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
// TYPE DEFINITIONS
// ============================================================================

interface UpworkPlatformOps {
  isUpworkRunning: () => boolean
  getUpworkProcessCount: () => number
  sleep: (ms: number) => void
  requestGracefulUpworkClose: (onLog: LogCallback) => void
  forceKillUpwork: (onLog: LogCallback) => void
  dismissCrashDialogsWithRetries: (onLog: LogCallback) => void
}

// ============================================================================
// CONSTANTS
// ============================================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const UPWORK_PROCESS_BASE = 'Upwork'
const UPWORK_WINDOWS_PROCESS_NAME = 'Upwork.exe'
const UPWORK_MAC_APP_NAME = 'Upwork'

const DISMISS_DIALOGS_SCRIPT_WIN = path.join(__dirname, 'scripts/dismiss-upwork-dialogs.ps1')
const DISMISS_DIALOGS_SCRIPT_WIN_FALLBACK = path.join(__dirname, '../electron/scripts/dismiss-upwork-dialogs.ps1')
const DISMISS_DIALOGS_SCRIPT_MAC = path.join(__dirname, 'scripts/dismiss-upwork-dialogs.applescript')
const DISMISS_DIALOGS_SCRIPT_MAC_FALLBACK = path.join(__dirname, '../electron/scripts/dismiss-upwork-dialogs.applescript')

const GRACEFUL_CLOSE_TIMEOUT_MS = 8000
const FORCE_KILL_SETTLE_MS = 1500
const POLL_INTERVAL_MS = 400
const DIALOG_DISMISS_RETRIES = 3
const DIALOG_DISMISS_INTERVAL_MS = 600

// ============================================================================
// UTILITY FUNCTIONS — Shared
// ============================================================================

const logStep = (onLog: LogCallback, message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO'): void => {
  const entry = `UPWORK — ${message}`
  writeLog(entry)
  onLog(entry)
  devLog(level, entry)
}

const resolveScriptPath = (candidates: string[]): string | null => {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

const runUpworkCloseSequence = (onLog: LogCallback, ops: UpworkPlatformOps): void => {
  logStep(onLog, 'Close sequence started')

  if (!ops.isUpworkRunning()) {
    logStep(onLog, 'Not found — already closed or not running')
    return
  }

  const initialCount = ops.getUpworkProcessCount()
  logStep(onLog, `Found ${initialCount} Upwork process(es) — starting graceful close`)

  ops.requestGracefulUpworkClose(onLog)

  if (waitForUpworkExit(onLog, ops, GRACEFUL_CLOSE_TIMEOUT_MS)) {
    logStep(onLog, 'Closed successfully (graceful)')
    return
  }

  logStep(onLog, 'Graceful close failed — escalating to force kill', 'WARN')
  ops.forceKillUpwork(onLog)
  ops.dismissCrashDialogsWithRetries(onLog)

  if (!ops.isUpworkRunning()) {
    logStep(onLog, 'Closed successfully (force kill + dialog dismiss)')
    return
  }

  logStep(
    onLog,
    `Close failed — ${ops.getUpworkProcessCount()} process(es) still running after force kill`,
    'ERROR',
  )
}

const waitForUpworkExit = (
  onLog: LogCallback,
  ops: UpworkPlatformOps,
  timeoutMs: number,
): boolean => {
  const deadline = Date.now() + timeoutMs
  let polls = 0

  logStep(onLog, `Waiting up to ${timeoutMs / 1000}s for graceful exit (poll every ${POLL_INTERVAL_MS}ms)`)

  while (Date.now() < deadline) {
    polls += 1
    const running = ops.isUpworkRunning()
    const count = ops.getUpworkProcessCount()

    if (!running) {
      logStep(onLog, `Graceful exit confirmed after ${polls} poll(s)`)
      return true
    }

    if (polls === 1 || polls % 5 === 0) {
      logStep(onLog, `Still running — ${count} Upwork process(es) after ${polls} poll(s)`, 'WARN')
    }

    ops.sleep(POLL_INTERVAL_MS)
  }

  if (ops.isUpworkRunning()) {
    logStep(onLog, `Graceful close timed out — ${ops.getUpworkProcessCount()} process(es) still running`, 'WARN')
  }
  return !ops.isUpworkRunning()
}

// ============================================================================
// UTILITY FUNCTIONS — Windows
// ============================================================================

const sleepWindows = (ms: number): void => {
  execSync(`powershell -NoProfile -Command "Start-Sleep -Milliseconds ${ms}"`, { stdio: 'ignore' })
}

const isUpworkRunningWindows = (): boolean => {
  try {
    const output = execSync(`tasklist /FI "IMAGENAME eq ${UPWORK_WINDOWS_PROCESS_NAME}" /NH`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return output.toLowerCase().includes(UPWORK_WINDOWS_PROCESS_NAME.toLowerCase())
  } catch {
    return false
  }
}

const getUpworkProcessCountWindows = (): number => {
  try {
    const output = execSync(
      `powershell -NoProfile -Command "(Get-Process -Name '${UPWORK_PROCESS_BASE}' -ErrorAction SilentlyContinue | Measure-Object).Count"`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    )
    const count = Number.parseInt(output.trim(), 10)
    return Number.isNaN(count) ? 0 : count
  } catch {
    return isUpworkRunningWindows() ? 1 : 0
  }
}

const requestGracefulUpworkCloseWindows = (onLog: LogCallback): void => {
  logStep(onLog, 'Graceful step 1/2: CloseMainWindow on visible Upwork windows')

  execSync(
    `powershell -NoProfile -Command "& { Get-Process -Name '${UPWORK_PROCESS_BASE}' -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | ForEach-Object { $_.CloseMainWindow() | Out-Null } }"`,
    { stdio: 'ignore' },
  )

  if (!isUpworkRunningWindows()) {
    logStep(onLog, 'Graceful step 1/2: Upwork exited after CloseMainWindow')
    return
  }

  logStep(onLog, 'Graceful step 2/2: taskkill without /F (WM_CLOSE)')

  try {
    execSync(`taskkill /IM ${UPWORK_WINDOWS_PROCESS_NAME}`, { stdio: 'ignore', timeout: 5000 })
    logStep(onLog, 'Graceful step 2/2: WM_CLOSE signal sent')
  } catch {
    logStep(onLog, 'Graceful step 2/2: WM_CLOSE returned non-zero (process may still be exiting)', 'WARN')
  }
}

const forceKillUpworkWindows = (onLog: LogCallback): void => {
  logStep(onLog, 'Force step 1/2: taskkill /F /T on Upwork.exe', 'WARN')

  try {
    execSync(`taskkill /IM ${UPWORK_WINDOWS_PROCESS_NAME} /T /F`, { stdio: 'ignore' })
    logStep(onLog, 'Force step 1/2: force kill command completed')
  } catch {
    logStep(onLog, 'Force step 1/2: force kill returned non-zero (process may already be gone)', 'WARN')
  }

  sleepWindows(FORCE_KILL_SETTLE_MS)

  if (!isUpworkRunningWindows()) {
    logStep(onLog, 'Force step 1/2: Upwork process no longer running after force kill')
    return
  }

  logStep(onLog, 'Force step 2/2: retrying force kill', 'WARN')
  try {
    execSync(`taskkill /IM ${UPWORK_WINDOWS_PROCESS_NAME} /T /F`, { stdio: 'ignore' })
  } catch {
    logStep(onLog, 'Force step 2/2: retry force kill returned non-zero', 'WARN')
  }
}

const dismissUpworkCrashDialogsWindows = (onLog: LogCallback): number => {
  const scriptPath = resolveScriptPath([DISMISS_DIALOGS_SCRIPT_WIN, DISMISS_DIALOGS_SCRIPT_WIN_FALLBACK])
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

const dismissCrashDialogsWithRetriesWindows = (onLog: LogCallback): void => {
  logStep(onLog, `Crash-dialog dismiss: starting (${DIALOG_DISMISS_RETRIES} attempts)`)

  let totalClosed = 0
  for (let attempt = 1; attempt <= DIALOG_DISMISS_RETRIES; attempt += 1) {
    logStep(onLog, `Crash-dialog dismiss: attempt ${attempt}/${DIALOG_DISMISS_RETRIES}`)
    totalClosed += dismissUpworkCrashDialogsWindows(onLog)
    if (attempt < DIALOG_DISMISS_RETRIES) {
      sleepWindows(DIALOG_DISMISS_INTERVAL_MS)
    }
  }

  logStep(onLog, `Crash-dialog dismiss: finished — ${totalClosed} window(s) closed in total`)
}

const windowsUpworkOps: UpworkPlatformOps = {
  isUpworkRunning: isUpworkRunningWindows,
  getUpworkProcessCount: getUpworkProcessCountWindows,
  sleep: sleepWindows,
  requestGracefulUpworkClose: requestGracefulUpworkCloseWindows,
  forceKillUpwork: forceKillUpworkWindows,
  dismissCrashDialogsWithRetries: dismissCrashDialogsWithRetriesWindows,
}

// ============================================================================
// UTILITY FUNCTIONS — macOS
// ============================================================================

const sleepMac = (ms: number): void => {
  const seconds = Math.max(ms / 1000, 0.05)
  execSync(`sleep ${seconds}`, { stdio: 'ignore' })
}

const isUpworkRunningMac = (): boolean => {
  try {
    execSync(`pgrep -x ${UPWORK_PROCESS_BASE}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

const getUpworkProcessCountMac = (): number => {
  try {
    const output = execSync(`pgrep -x ${UPWORK_PROCESS_BASE}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const lines = output.trim().split('\n').filter(Boolean)
    return lines.length
  } catch {
    return 0
  }
}

const requestGracefulUpworkCloseMac = (onLog: LogCallback): void => {
  logStep(onLog, `Graceful step 1/2: AppleScript quit on ${UPWORK_MAC_APP_NAME}`)

  try {
    execSync(`osascript -e 'tell application "${UPWORK_MAC_APP_NAME}" to quit'`, { stdio: 'ignore' })
    logStep(onLog, 'Graceful step 1/2: quit command sent')
  } catch {
    logStep(onLog, 'Graceful step 1/2: quit returned non-zero (app may be background-only)', 'WARN')
  }

  if (!isUpworkRunningMac()) {
    logStep(onLog, 'Graceful step 1/2: Upwork exited after quit')
    return
  }

  logStep(onLog, 'Graceful step 2/2: killall -TERM Upwork')

  try {
    execSync(`killall -TERM ${UPWORK_PROCESS_BASE}`, { stdio: 'ignore' })
    logStep(onLog, 'Graceful step 2/2: SIGTERM sent')
  } catch {
    logStep(onLog, 'Graceful step 2/2: SIGTERM returned non-zero (process may still be exiting)', 'WARN')
  }
}

const forceKillUpworkMac = (onLog: LogCallback): void => {
  logStep(onLog, 'Force step 1/2: killall -9 Upwork', 'WARN')

  try {
    execSync(`killall -9 ${UPWORK_PROCESS_BASE}`, { stdio: 'ignore' })
    logStep(onLog, 'Force step 1/2: force kill command completed')
  } catch {
    logStep(onLog, 'Force step 1/2: force kill returned non-zero (process may already be gone)', 'WARN')
  }

  sleepMac(FORCE_KILL_SETTLE_MS)

  if (!isUpworkRunningMac()) {
    logStep(onLog, 'Force step 1/2: Upwork process no longer running after force kill')
    return
  }

  logStep(onLog, 'Force step 2/2: retrying force kill', 'WARN')
  try {
    execSync(`killall -9 ${UPWORK_PROCESS_BASE}`, { stdio: 'ignore' })
  } catch {
    logStep(onLog, 'Force step 2/2: retry force kill returned non-zero', 'WARN')
  }
}

const dismissUpworkCrashDialogsMac = (onLog: LogCallback): number => {
  const scriptPath = resolveScriptPath([DISMISS_DIALOGS_SCRIPT_MAC, DISMISS_DIALOGS_SCRIPT_MAC_FALLBACK])
  if (!scriptPath) {
    logStep(onLog, 'Crash-dialog dismiss script not found', 'ERROR')
    return 0
  }

  try {
    const output = execSync(`osascript "${scriptPath}" ${UPWORK_PROCESS_BASE}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const closed = Number.parseInt(output.trim(), 10)
    const count = Number.isNaN(closed) ? 0 : closed
    logStep(onLog, `Crash-dialog dismiss: closed ${count} window(s) via AppleScript`)
    return count
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logStep(onLog, `Crash-dialog dismiss failed: ${msg}`, 'ERROR')
    return 0
  }
}

const dismissCrashDialogsWithRetriesMac = (onLog: LogCallback): void => {
  logStep(onLog, `Crash-dialog dismiss: starting (${DIALOG_DISMISS_RETRIES} attempts)`)

  let totalClosed = 0
  for (let attempt = 1; attempt <= DIALOG_DISMISS_RETRIES; attempt += 1) {
    logStep(onLog, `Crash-dialog dismiss: attempt ${attempt}/${DIALOG_DISMISS_RETRIES}`)
    totalClosed += dismissUpworkCrashDialogsMac(onLog)
    if (attempt < DIALOG_DISMISS_RETRIES) {
      sleepMac(DIALOG_DISMISS_INTERVAL_MS)
    }
  }

  logStep(onLog, `Crash-dialog dismiss: finished — ${totalClosed} window(s) closed in total`)
}

const macUpworkOps: UpworkPlatformOps = {
  isUpworkRunning: isUpworkRunningMac,
  getUpworkProcessCount: getUpworkProcessCountMac,
  sleep: sleepMac,
  requestGracefulUpworkClose: requestGracefulUpworkCloseMac,
  forceKillUpwork: forceKillUpworkMac,
  dismissCrashDialogsWithRetries: dismissCrashDialogsWithRetriesMac,
}

// ============================================================================
// UTILITY FUNCTIONS — OS shutdown
// ============================================================================

const runPlatformShutdown = (): void => {
  if (process.platform === 'win32') {
    execSync('shutdown /s /t 0', { stdio: 'ignore' })
    return
  }

  if (process.platform === 'darwin') {
    execSync('osascript -e \'tell application "System Events" to shut down\'', {
      stdio: 'ignore',
    })
    return
  }

  throw new Error(`System shutdown is not supported on platform: ${process.platform}`)
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Close the Upwork Desktop App after automation stops.
 *
 * Flow (Windows + macOS): graceful close → wait → force kill → dismiss crash dialogs.
 */
export function closeUpworkTracker(onLog: LogCallback): void {
  if (process.platform === 'win32') {
    runUpworkCloseSequence(onLog, windowsUpworkOps)
    return
  }

  if (process.platform === 'darwin') {
    runUpworkCloseSequence(onLog, macUpworkOps)
    return
  }

  const entry = `UPWORK — Close tracker is not supported on platform: ${process.platform}`
  writeLog(entry)
  onLog(entry)
  devLog('WARN', entry)
}

/**
 * Shut down the host OS after the renderer's 30-second countdown ends.
 *
 * - Windows: `shutdown /s /t 0` (immediate shutdown)
 * - macOS: AppleScript via System Events (no sudo)
 */
export function executeSystemShutdown(onLog: LogCallback): void {
  const platformLabel =
    process.platform === 'win32' ? 'Windows' : process.platform === 'darwin' ? 'macOS' : process.platform

  const entry = `System shutdown initiated (${platformLabel})`
  writeLog(entry)
  onLog(entry)
  devLog('INFO', entry)

  try {
    runPlatformShutdown()
  } catch (err) {
    const errEntry = `ERROR — System shutdown command failed: ${err instanceof Error ? err.message : String(err)}`
    writeLog(errEntry)
    onLog(errEntry)
    devLog('ERROR', errEntry)
  }
}
