// ============================================================================
// IMPORTS
// ============================================================================

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { devLog } from './dev-logger.js'
import { writeLog } from './logger.js'
import type { LogCallback } from './automation.js'

// ============================================================================
// CONSTANTS
// ============================================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DISMISS_DIALOGS_SCRIPT = path.join(__dirname, 'scripts/dismiss-upwork-dialogs.ps1')
const DISMISS_DIALOGS_SCRIPT_FALLBACK = path.join(__dirname, '../electron/scripts/dismiss-upwork-dialogs.ps1')

// Windows process name for the Upwork Desktop App.
// Update this if the process name differs on your system
// (check Task Manager → Details tab while Upwork is open).
const UPWORK_PROCESS_NAME = 'Upwork.exe'
const UPWORK_PROCESS_BASE = 'Upwork'

const GRACEFUL_CLOSE_TIMEOUT_MS = 8000
const FORCE_KILL_SETTLE_MS = 1500
const POLL_INTERVAL_MS = 400
const DIALOG_DISMISS_RETRIES = 3
const DIALOG_DISMISS_INTERVAL_MS = 600

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const sleepSync = (ms: number): void => {
  execSync(`powershell -NoProfile -Command "Start-Sleep -Milliseconds ${ms}"`, { stdio: 'ignore' })
}

const logStep = (onLog: LogCallback, message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO'): void => {
  const entry = `UPWORK — ${message}`
  writeLog(entry)
  onLog(entry)
  devLog(level, entry)
}

const isUpworkRunning = (): boolean => {
  try {
    const output = execSync(`tasklist /FI "IMAGENAME eq ${UPWORK_PROCESS_NAME}" /NH`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return output.toLowerCase().includes(UPWORK_PROCESS_NAME.toLowerCase())
  } catch {
    return false
  }
}

const getUpworkProcessCount = (): number => {
  try {
    const output = execSync(
      `powershell -NoProfile -Command "(Get-Process -Name '${UPWORK_PROCESS_BASE}' -ErrorAction SilentlyContinue | Measure-Object).Count"`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    )
    const count = Number.parseInt(output.trim(), 10)
    return Number.isNaN(count) ? 0 : count
  } catch {
    return isUpworkRunning() ? 1 : 0
  }
}

const requestGracefulUpworkClose = (onLog: LogCallback): void => {
  logStep(onLog, 'Graceful step 1/2: CloseMainWindow on visible Upwork windows')

  execSync(
    `powershell -NoProfile -Command "& { Get-Process -Name '${UPWORK_PROCESS_BASE}' -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | ForEach-Object { $_.CloseMainWindow() | Out-Null } }"`,
    { stdio: 'ignore' },
  )

  if (!isUpworkRunning()) {
    logStep(onLog, 'Graceful step 1/2: Upwork exited after CloseMainWindow')
    return
  }

  logStep(onLog, 'Graceful step 2/2: taskkill without /F (WM_CLOSE)')

  try {
    execSync(`taskkill /IM ${UPWORK_PROCESS_NAME}`, { stdio: 'ignore', timeout: 5000 })
    logStep(onLog, 'Graceful step 2/2: WM_CLOSE signal sent')
  } catch {
    logStep(onLog, 'Graceful step 2/2: WM_CLOSE returned non-zero (process may still be exiting)', 'WARN')
  }
}

const waitForUpworkExit = (onLog: LogCallback, timeoutMs: number): boolean => {
  const deadline = Date.now() + timeoutMs
  let polls = 0

  logStep(onLog, `Waiting up to ${timeoutMs / 1000}s for graceful exit (poll every ${POLL_INTERVAL_MS}ms)`)

  while (Date.now() < deadline) {
    polls += 1
    const running = isUpworkRunning()
    const count = getUpworkProcessCount()

    if (!running) {
      logStep(onLog, `Graceful exit confirmed after ${polls} poll(s)`)
      return true
    }

    if (polls === 1 || polls % 5 === 0) {
      logStep(onLog, `Still running — ${count} Upwork process(es) after ${polls} poll(s)`, 'WARN')
    }

    sleepSync(POLL_INTERVAL_MS)
  }

  const stillRunning = isUpworkRunning()
  if (stillRunning) {
    logStep(onLog, `Graceful close timed out — ${getUpworkProcessCount()} process(es) still running`, 'WARN')
  }
  return !stillRunning
}

const forceKillUpwork = (onLog: LogCallback): void => {
  logStep(onLog, 'Force step 1/2: taskkill /F /T on Upwork.exe', 'WARN')

  try {
    execSync(`taskkill /IM ${UPWORK_PROCESS_NAME} /T /F`, { stdio: 'ignore' })
    logStep(onLog, 'Force step 1/2: force kill command completed')
  } catch {
    logStep(onLog, 'Force step 1/2: force kill returned non-zero (process may already be gone)', 'WARN')
  }

  sleepSync(FORCE_KILL_SETTLE_MS)

  if (!isUpworkRunning()) {
    logStep(onLog, 'Force step 1/2: Upwork process no longer running after force kill')
    return
  }

  logStep(onLog, 'Force step 2/2: retrying force kill', 'WARN')
  try {
    execSync(`taskkill /IM ${UPWORK_PROCESS_NAME} /T /F`, { stdio: 'ignore' })
  } catch {
    logStep(onLog, 'Force step 2/2: retry force kill returned non-zero', 'WARN')
  }
}

const resolveDismissDialogsScript = (): string | null => {
  const candidates = [DISMISS_DIALOGS_SCRIPT, DISMISS_DIALOGS_SCRIPT_FALLBACK]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

/**
 * Close visible Upwork / crash-restart dialogs via WM_CLOSE.
 * Returns the number of windows closed.
 */
const dismissUpworkCrashDialogs = (onLog: LogCallback): number => {
  const scriptPath = resolveDismissDialogsScript()
  if (!scriptPath) {
    logStep(onLog, 'Crash-dialog dismiss script not found', 'ERROR')
    return 0
  }

  try {
    const output = execSync(
      `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -ProcessName ${UPWORK_PROCESS_BASE}`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    )
    const closed = Number.parseInt(output.trim(), 10)
    const count = Number.isNaN(closed) ? 0 : closed
    logStep(onLog, `Crash-dialog dismiss: closed ${count} window(s) via WM_CLOSE`)
    return count
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logStep(onLog, `Crash-dialog dismiss failed: ${msg}`, 'ERROR')
    return 0
  }
}

const dismissCrashDialogsWithRetries = (onLog: LogCallback): void => {
  logStep(onLog, `Crash-dialog dismiss: starting (${DIALOG_DISMISS_RETRIES} attempts)`)

  let totalClosed = 0
  for (let attempt = 1; attempt <= DIALOG_DISMISS_RETRIES; attempt += 1) {
    logStep(onLog, `Crash-dialog dismiss: attempt ${attempt}/${DIALOG_DISMISS_RETRIES}`)
    totalClosed += dismissUpworkCrashDialogs(onLog)
    if (attempt < DIALOG_DISMISS_RETRIES) {
      sleepSync(DIALOG_DISMISS_INTERVAL_MS)
    }
  }

  logStep(onLog, `Crash-dialog dismiss: finished — ${totalClosed} window(s) closed in total`)
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Close the Upwork Desktop App after automation stops.
 *
 * Flow: graceful (CloseMainWindow + WM_CLOSE) → wait → force kill → dismiss crash dialogs.
 */
export function closeUpworkTracker(onLog: LogCallback): void {
  logStep(onLog, 'Close sequence started')

  if (!isUpworkRunning()) {
    logStep(onLog, 'Not found — already closed or not running')
    return
  }

  const initialCount = getUpworkProcessCount()
  logStep(onLog, `Found ${initialCount} Upwork process(es) — starting graceful close`)

  requestGracefulUpworkClose(onLog)

  if (waitForUpworkExit(onLog, GRACEFUL_CLOSE_TIMEOUT_MS)) {
    logStep(onLog, 'Closed successfully (graceful)')
    return
  }

  logStep(onLog, 'Graceful close failed — escalating to force kill', 'WARN')
  forceKillUpwork(onLog)
  dismissCrashDialogsWithRetries(onLog)

  if (!isUpworkRunning()) {
    logStep(onLog, 'Closed successfully (force kill + dialog dismiss)')
    return
  }

  logStep(
    onLog,
    `Close failed — ${getUpworkProcessCount()} process(es) still running after force kill`,
    'ERROR',
  )
}

/**
 * Issue the Windows OS shutdown command and write a log entry.
 *
 * Called from the IPC handler after the renderer's 30-second countdown ends
 * (or if the user does not cancel).  The `shutdown /s /t 0` flag means
 * "shutdown immediately with no additional delay".
 */
export function executeSystemShutdown(onLog: LogCallback): void {
  const entry = 'System shutdown initiated'
  writeLog(entry)
  onLog(entry)
  devLog('INFO', entry)

  try {
    execSync('shutdown /s /t 0', { stdio: 'ignore' })
  } catch (err) {
    const errEntry = `ERROR — System shutdown command failed: ${err instanceof Error ? err.message : String(err)}`
    writeLog(errEntry)
    onLog(errEntry)
    devLog('ERROR', errEntry)
  }
}
