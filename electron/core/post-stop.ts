// ============================================================================
// IMPORTS
// ============================================================================

import { execSync } from 'child_process'
import { writeLog } from './logger.js'
import type { LogCallback } from './automation.js'

// ============================================================================
// CONSTANTS
// ============================================================================

// Windows process name for the Upwork Desktop App.
// Update this if the process name differs on your system
// (check Task Manager → Details tab while Upwork is open).
const UPWORK_PROCESS_NAME = 'Upwork.exe'

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Attempt to close the Upwork Desktop App via taskkill.
 *
 * - If the process is running, it is force-terminated.
 * - If the process is not found, logs an informational message (not an error).
 * - Runs synchronously so it completes before the next post-stop step.
 */
export function closeUpworkTracker(onLog: LogCallback): void {
  try {
    execSync(`taskkill /IM ${UPWORK_PROCESS_NAME} /F`, { stdio: 'ignore' })
    const entry = 'Upwork tracker closed successfully'
    writeLog(entry)
    onLog(entry)
  } catch {
    // Non-zero exit from taskkill means the process was not found.
    // This is informational — not an error state.
    const entry = 'Upwork tracker not found (already closed or not running)'
    writeLog(entry)
    onLog(entry)
  }
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

  try {
    execSync('shutdown /s /t 0', { stdio: 'ignore' })
  } catch (err) {
    const errEntry = `ERROR — System shutdown command failed: ${err instanceof Error ? err.message : String(err)}`
    writeLog(errEntry)
    onLog(errEntry)
  }
}
