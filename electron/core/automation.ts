// ============================================================================
// IMPORTS
// ============================================================================

import { execSync, spawn } from 'child_process'
import type { ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { devLog } from './dev-logger.js'
import { writeLog } from './logger.js'
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

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// In dev  → dist-electron/main.js (flat bundle) → ../scripts/
// In prod → resources/app.asar/dist-electron/ → use resourcesPath
const SCRIPTS_DIR_DEV = path.resolve(__dirname, '../scripts')
const REQUIREMENTS_FILE = 'requirements.txt'
const FORCE_KILL_DELAY_MS = 3000

// ============================================================================
// STATE
// ============================================================================

let child: ChildProcess | null = null
let forceKillTimer: ReturnType<typeof setTimeout> | null = null
let _intentionallyStopped = false
let _isPreparing = false

// Callbacks set on spawn, used by exit/error handlers
let _onStatus: StatusCallback | null = null
let _onLog: LogCallback | null = null

// Skip re-checking pip after a successful install for the same Python binary this session.
let _depsReady = false
let _depsReadyForPython: string | null = null

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getScriptsDir(): string {
  // When Vite dev server URL is set, we are in development
  if (process.env.VITE_DEV_SERVER_URL) return SCRIPTS_DIR_DEV

  // Production: scripts are bundled into extraResources
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath
  return resourcesPath ? path.join(resourcesPath, 'scripts') : SCRIPTS_DIR_DEV
}

function detectPythonBinary(): string | null {
  const candidates = process.platform === 'win32'
    ? ['python', 'python3', 'py']
    : ['python3', 'python']

  for (const bin of candidates) {
    try {
      execSync(`${bin} --version`, { stdio: 'ignore' })
      return bin
    } catch {
      // try next candidate
    }
  }
  return null
}

function getScriptFilename(mode: 'basic' | 'advanced'): string {
  return mode === 'basic' ? 'basic_mode.py' : 'advanced_mode.py'
}

function clearForceKillTimer(): void {
  if (forceKillTimer !== null) {
    clearTimeout(forceKillTimer)
    forceKillTimer = null
  }
}

function parseRequirementModuleNames(requirementsPath: string): string[] {
  if (!fs.existsSync(requirementsPath)) return []

  const content = fs.readFileSync(requirementsPath, 'utf8')
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => line.split(/[>=<![\s]/)[0].trim())
    .filter(Boolean)
}

function arePythonModulesImportable(pythonBin: string, moduleNames: string[]): boolean {
  if (moduleNames.length === 0) return true

  const importStatement = moduleNames.join(', ')
  try {
    execSync(`${pythonBin} -c "import ${importStatement}"`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function installPythonDependencies(
  pythonBin: string,
  requirementsPath: string,
): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const proc = spawn(
      pythonBin,
      ['-m', 'pip', 'install', '-r', requirementsPath, '--disable-pip-version-check'],
      {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )

    let stderr = ''

    proc.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    proc.on('error', (err) => {
      resolve({ ok: false, error: err.message })
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ ok: true })
        return
      }

      const trimmedStderr = stderr.trim()
      const errorMessage = trimmedStderr.length > 0
        ? trimmedStderr
        : `pip install failed (exit code: ${code ?? 'unknown'})`

      resolve({ ok: false, error: errorMessage })
    })
  })
}

async function ensurePythonDependencies(
  pythonBin: string,
  scriptsDir: string,
  onLog: LogCallback,
): Promise<{ ok: boolean; error?: string }> {
  if (_depsReady && _depsReadyForPython === pythonBin) {
    devLog('INFO', 'Python dependencies already verified this session — skipping check')
    return { ok: true }
  }

  const requirementsPath = path.join(scriptsDir, REQUIREMENTS_FILE)
  if (!fs.existsSync(requirementsPath)) {
    const message = `requirements.txt not found at: ${requirementsPath}`
    devLog('ERROR', message)
    return { ok: false, error: message }
  }

  const moduleNames = parseRequirementModuleNames(requirementsPath)
  devLog('INFO', `Checking Python dependencies: ${moduleNames.join(', ') || '(none)'}`)

  if (arePythonModulesImportable(pythonBin, moduleNames)) {
    devLog('INFO', 'Python dependencies already installed')
    _depsReady = true
    _depsReadyForPython = pythonBin
    return { ok: true }
  }

  const installingEntry = 'INFO — Python packages missing; installing from requirements.txt...'
  devLog('INFO', 'Python packages missing — running pip install')
  writeLog(installingEntry)
  onLog(installingEntry)

  const installResult = await installPythonDependencies(pythonBin, requirementsPath)
  if (!installResult.ok) {
    const message = installResult.error ?? 'Failed to install Python dependencies'
    devLog('ERROR', `pip install failed: ${message}`)
    return {
      ok: false,
      error: `Failed to install Python packages. Run manually: ${pythonBin} -m pip install -r "${requirementsPath}". ${message}`,
    }
  }

  if (!arePythonModulesImportable(pythonBin, moduleNames)) {
    const message = `Packages installed but import still failed: ${moduleNames.join(', ')}`
    devLog('ERROR', message)
    return { ok: false, error: message }
  }

  const installedEntry = 'INFO — Python dependencies installed successfully'
  devLog('INFO', 'Python dependencies installed successfully')
  writeLog(installedEntry)
  onLog(installedEntry)

  _depsReady = true
  _depsReadyForPython = pythonBin
  return { ok: true }
}

function spawnAutomationScript(
  pythonBin: string,
  scriptPath: string,
  scriptsDir: string,
  payload: StartPayload,
  onStatus: StatusCallback,
  onLog: LogCallback,
): void {
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

// ============================================================================
// EXPORTS
// ============================================================================

export function isRunning(): boolean {
  return child !== null || _isPreparing
}

export async function startAutomation(
  payload: StartPayload,
  onStatus: StatusCallback,
  onLog: LogCallback,
): Promise<void> {
  devLog('INFO', `startAutomation() called — payload: ${JSON.stringify(payload)}`)

  // Guard: prevent double spawn (includes pip install in progress)
  if (child || _isPreparing) {
    devLog('WARN', 'startAutomation() called but automation is already starting or running — ignoring')
    console.warn('[Automation] Already running — ignoring start request')
    return
  }

  _isPreparing = true

  try {
    _onStatus = onStatus
    _onLog = onLog
    _intentionallyStopped = false

    devLog('INFO', `Platform: ${process.platform} | VITE_DEV_SERVER_URL: ${process.env['VITE_DEV_SERVER_URL'] ?? '(not set)'}`)

    // ── Step 1: Detect Python ─────────────────────────────────────────────────
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

    // ── Step 2: Resolve script path ───────────────────────────────────────────
    const scriptsDir = getScriptsDir()
    const scriptFile = getScriptFilename(payload.mode)
    const scriptPath = path.join(scriptsDir, scriptFile)
    devLog('INFO', `Scripts dir: ${scriptsDir} | Script file: ${scriptFile} | Full path: ${scriptPath}`)

    // ── Step 3: Ensure Python dependencies ────────────────────────────────────
    const depsResult = await ensurePythonDependencies(pythonBin, scriptsDir, onLog)
    if (!depsResult.ok) {
      const entry = `ERROR — ${depsResult.error ?? 'Python dependency check failed'}`
      writeLog(entry)
      onLog(entry)
      onStatus('error', depsResult.error)
      return
    }

    // ── Step 4: Spawn process ─────────────────────────────────────────────────
    spawnAutomationScript(pythonBin, scriptPath, scriptsDir, payload, onStatus, onLog)
  } finally {
    _isPreparing = false
  }
}

export function stopAutomation(): void {
  if (!child) return

  _intentionallyStopped = true
  const pid = child.pid

  if (process.platform === 'win32' && pid) {
    // Windows: force-kill entire process tree
    try {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' })
    } catch {
      // Process may already be gone
    }
    child = null
  } else {
    // Unix: graceful SIGTERM then SIGKILL after delay
    try { child.kill('SIGTERM') } catch { /* ignore */ }

    forceKillTimer = setTimeout(() => {
      if (child) {
        try { child.kill('SIGKILL') } catch { /* ignore */ }
        child = null
      }
    }, FORCE_KILL_DELAY_MS)
  }
}

/**
 * Stop any running automation and clear all state.
 * Called during app quit to prevent orphan processes.
 */
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
