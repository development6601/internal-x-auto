// ============================================================================
// IMPORTS
// ============================================================================

import { execSync, spawn } from 'child_process'
import type { ChildProcess } from 'child_process'
import path from 'path'
import { devLog } from './dev-logger.js'
import { writeLog } from './logger.js'
import { detectPythonBinary, getScriptsDir } from './python-deps.js'
import { formatDuration } from './utils.js'
import type { AutomationStatus, StartPayload } from './types.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type StatusCallback = (status: AutomationStatus, errorMessage?: string) => void
export type LogCallback = (entry: string) => void

// ============================================================================
// CONSTANTS
// ============================================================================

const FORCE_KILL_DELAY_MS = 3000

// ============================================================================
// STATE
// ============================================================================

let child: ChildProcess | null = null
let forceKillTimer: ReturnType<typeof setTimeout> | null = null
let _intentionallyStopped = false

let _onStatus: StatusCallback | null = null
let _onLog: LogCallback | null = null

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getScriptFilename(mode: 'basic' | 'advanced'): string {
  return mode === 'basic' ? 'basic_mode.py' : 'advanced_mode.py'
}

function clearForceKillTimer(): void {
  if (forceKillTimer !== null) {
    clearTimeout(forceKillTimer)
    forceKillTimer = null
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export function isRunning(): boolean {
  return child !== null
}

export function startAutomation(
  payload: StartPayload,
  onStatus: StatusCallback,
  onLog: LogCallback,
): void {
  devLog('INFO', `startAutomation() called — payload: ${JSON.stringify(payload)}`)

  if (child) {
    devLog('WARN', 'startAutomation() called but child is already running — ignoring')
    console.warn('[Automation] Already running — ignoring start request')
    return
  }

  _onStatus = onStatus
  _onLog = onLog
  _intentionallyStopped = false

  devLog('INFO', `Platform: ${process.platform} | VITE_DEV_SERVER_URL: ${process.env['VITE_DEV_SERVER_URL'] ?? '(not set)'}`)

  devLog('INFO', 'Detecting Python binary...')
  const pythonBin = detectPythonBinary()
  if (!pythonBin) {
    devLog('ERROR', 'Python binary not found in PATH')
    const entry = 'ERROR — Python binary not found in PATH'
    writeLog(entry)
    onLog(entry)
    onStatus('error', 'Python not found. Please ensure Python 3 is installed and available in PATH.')
    return
  }
  devLog('INFO', `Python detected: ${pythonBin}`)

  const scriptsDir = getScriptsDir()
  const scriptFile = getScriptFilename(payload.mode)
  const scriptPath = path.join(scriptsDir, scriptFile)
  devLog('INFO', `Scripts dir: ${scriptsDir} | Script file: ${scriptFile} | Full path: ${scriptPath}`)

  devLog('INFO', `Spawning: ${pythonBin} ${scriptPath} --mode ${payload.mode} --duration ${payload.durationSeconds} --shutdown ${payload.shutdown}`)
  devLog('INFO', `spawn cwd: ${scriptsDir}`)

  try {
    child = spawn(
      pythonBin,
      [
        scriptPath,
        '--mode', payload.mode,
        '--duration', String(payload.durationSeconds),
        '--shutdown', String(payload.shutdown),
      ],
      {
        cwd: scriptsDir,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    devLog('ERROR', `spawn() failed: ${msg}`)
    const entry = `ERROR — Failed to spawn Python: ${msg}`
    writeLog(entry)
    onLog(entry)
    onStatus('error', entry)
    child = null
    return
  }

  devLog('INFO', `Python process spawned (PID: ${child.pid ?? 'unknown'})`)

  const timerLabel =
    payload.durationSeconds === 0
      ? 'indefinite'
      : formatDuration(payload.durationSeconds)

  const startEntry =
    `STARTED — Mode: ${payload.mode === 'advanced' ? 'Advanced' : 'Basic'}, ` +
    `Timer: ${timerLabel}, ` +
    `Close Tracker: ${payload.closeTracker ? 'Yes' : 'No'}, ` +
    `Shutdown: ${payload.shutdown ? 'Yes' : 'No'}`

  writeLog(startEntry)
  onLog(startEntry)
  onStatus('running')

  child.stdout?.on('data', (data: Buffer) => {
    const line = data.toString().trim()
    if (line) {
      devLog('SCRIPT', line)
      const entry = `SCRIPT — ${line}`
      writeLog(entry)
      onLog(entry)
    }
  })

  child.stderr?.on('data', (data: Buffer) => {
    const line = data.toString().trim()
    if (line) {
      devLog('STDERR', line)
      const entry = `SCRIPT STDERR — ${line}`
      writeLog(entry)
      onLog(entry)
    }
  })

  child.on('error', (err) => {
    clearForceKillTimer()
    devLog('ERROR', `Process error: ${err.message}`)
    const entry = `ERROR — Script process error: ${err.message}`
    writeLog(entry)
    _onLog?.(entry)
    _onStatus?.('error', err.message)
    child = null
    _intentionallyStopped = false
  })

  child.on('exit', (code) => {
    clearForceKillTimer()

    const wasIntentional = _intentionallyStopped
    _intentionallyStopped = false
    child = null

    devLog('INFO', `Process exited (code: ${code}, intentional: ${wasIntentional})`)

    if (wasIntentional) return

    if (code !== 0 && code !== null) {
      devLog('WARN', `Unexpected exit code: ${code}`)
      const entry = `ERROR — Script exited unexpectedly (code: ${code})`
      writeLog(entry)
      _onLog?.(entry)
      _onStatus?.('error', entry)
    }
  })
}

export function stopAutomation(): void {
  if (!child) return

  _intentionallyStopped = true
  const pid = child.pid

  if (process.platform === 'win32' && pid) {
    try {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' })
    } catch {
      // Process may already be gone
    }
    child = null
  } else {
    try { child.kill('SIGTERM') } catch { /* ignore */ }

    forceKillTimer = setTimeout(() => {
      if (child) {
        try { child.kill('SIGKILL') } catch { /* ignore */ }
        child = null
      }
    }, FORCE_KILL_DELAY_MS)
  }
}

export function cleanupOnExit(): void {
  _intentionallyStopped = true
  clearForceKillTimer()

  if (child) {
    const pid = child.pid
    try {
      if (process.platform === 'win32' && pid) {
        execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' })
      } else {
        child.kill('SIGKILL')
      }
    } catch { /* ignore */ }
    child = null
  }
}
