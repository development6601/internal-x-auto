// ============================================================================
// IMPORTS
// ============================================================================

import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { getTimestamp } from './utils.js'

// ============================================================================
// STATE
// ============================================================================

let resolvedLogPath: string | null = null

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function ensureLogPath(): string {
  if (resolvedLogPath) return resolvedLogPath

  const dir = path.join(app.getPath('userData'), 'logs')
  fs.mkdirSync(dir, { recursive: true })
  resolvedLogPath = path.join(dir, 'activity.log')
  return resolvedLogPath
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Append a single entry to the persistent activity log.
 * The entry is prefixed with a timestamp automatically.
 */
export function writeLog(entry: string): void {
  const line = `[${getTimestamp()}] ${entry}`
  try {
    fs.appendFileSync(ensureLogPath(), line + '\n', 'utf8')
  } catch (err) {
    console.error('[Logger] Failed to write log entry:', err)
  }
}

/**
 * Read the full contents of the activity log.
 * Returns an empty string if the file does not exist yet.
 */
export function readLog(): string {
  const logPath = ensureLogPath()
  try {
    return fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : ''
  } catch {
    return ''
  }
}

/**
 * Returns the absolute path to the log file.
 */
export function getLogPath(): string {
  return ensureLogPath()
}
