// ============================================================================
// IMPORTS
// ============================================================================

// (no imports — pure type/const definitions shared across electron modules)

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type AutomationMode = 'basic' | 'advanced'
export type AutomationStatus = 'running' | 'stopped' | 'error'
export type StopReason = 'manual' | 'timer'

export interface StartPayload {
  mode: AutomationMode
  durationSeconds: number
  closeTracker: boolean
  shutdown: boolean
}

export interface StopPayload {
  reason: StopReason
  elapsedSeconds: number
}

export interface StatusPayload {
  status: AutomationStatus
}

export interface ErrorPayload {
  message: string
}

export interface LogEntryPayload {
  entry: string
}

export interface ExportLogResult {
  success: boolean
  path?: string
  error?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const IPC_CHANNELS = {
  // Renderer → Main
  AUTOMATION_START: 'automation:start',
  AUTOMATION_STOP: 'automation:stop',
  LOG_EXPORT: 'log:export',
  APP_MODE_CHANGED: 'app:mode-changed',
  // Main → Renderer
  AUTOMATION_STATUS: 'automation:status',
  AUTOMATION_ERROR: 'automation:error',
  LOG_NEW_ENTRY: 'log:new-entry',
  TRAY_REQUEST_START: 'tray:request-start',
  TRAY_REQUEST_STOP: 'tray:request-stop',
} as const
