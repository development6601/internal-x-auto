// ============================================================================
// IMPORTS
// ============================================================================

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getTimestamp } from './utils.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type DevLogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SCRIPT' | 'STDERR'

// ============================================================================
// CONSTANTS
// ============================================================================

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MAX_ENTRIES = 500

// ============================================================================
// INITIALIZATION — Load .env and determine if dev logging is enabled
// ============================================================================

function loadDotEnv(): Record<string, string> {
  try {
    // Resolves to project root from dist-electron/core/dev-logger.js
    const envPath = path.resolve(__dirname, '../../.env')
    const raw = fs.readFileSync(envPath, 'utf8')
    const result: Record<string, string> = {}
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx < 0) continue
      const key = trimmed.substring(0, eqIdx).trim()
      // Strip inline comments (e.g. DEV_LOG=true  # comment)
      const val = trimmed.substring(eqIdx + 1).split('#')[0].trim()
      result[key] = val
    }
    return result
  } catch {
    // .env not found or unreadable — silently continue with empty env
    return {}
  }
}

const _dotEnv = loadDotEnv()

// Always enabled in development (VITE_DEV_SERVER_URL is injected by vite-plugin-electron).
// In production, require DEV_LOG=true in .env.
const _isDev = typeof process.env['VITE_DEV_SERVER_URL'] === 'string'
const _enabled = _isDev || (_dotEnv['DEV_LOG'] ?? process.env['DEV_LOG'] ?? '') === 'true'

// ============================================================================
// STATE
// ============================================================================

const _buffer: string[] = []
let _rendererPusher: ((entry: string) => void) | null = null

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatTime(): string {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  const s = String(now.getSeconds()).padStart(2, '0')
  return `${h}:${m}:${s}`
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Register the function used to push live entries to the renderer window.
 * Call once from ipc.ts after handlers are registered.
 */
export function setDevLogRenderer(pusher: (entry: string) => void): void {
  _rendererPusher = pusher
}

/**
 * Append a dev log entry to the ring buffer and push it to the renderer.
 * No-ops entirely when DEV_LOG is not set to "true" in .env.
 */
export function devLog(level: DevLogLevel, message: string): void {
  if (!_enabled) return
  const entry = `[${formatTime()}] [${level}] ${message}`
  _buffer.push(entry)
  // Keep ring buffer bounded
  if (_buffer.length > MAX_ENTRIES) _buffer.shift()
  // Also emit to the Electron main-process terminal so it's visible in the
  // npm run dev output even without opening the in-app dev log panel.
  console.log(`[DEV] ${entry}`)
  _rendererPusher?.(entry)
}

/**
 * Return all buffered dev log entries (oldest first).
 * Called by the log:get-dev-entries IPC handler on renderer mount.
 */
export function getDevLogEntries(): string[] {
  return [..._buffer]
}

/** Clear the in-memory buffer (does not affect the persistent log file). */
export function clearDevLog(): void {
  _buffer.length = 0
}

// Export a dated convenience alias used by utils.ts callers
export { getTimestamp }
