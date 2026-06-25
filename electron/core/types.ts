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

export interface PrerequisitesCheckResult {
  ready: boolean
  pythonFound: boolean
  pythonBin?: string
  missingModules: string[]
  message?: string
}

export interface PrerequisitesInstallResult {
  success: boolean
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
  LOG_GET_ENTRIES: 'log:get-entries',    // Renderer asks Main for full log on mount
  PREREQUISITES_CHECK: 'prerequisites:check',
  PREREQUISITES_INSTALL: 'prerequisites:install',
  APP_MODE_CHANGED: 'app:mode-changed',
  POST_STOP_SHUTDOWN: 'post-stop:shutdown', // Renderer asks Main to execute OS shutdown
  // Main → Renderer
  AUTOMATION_STATUS: 'automation:status',
  AUTOMATION_ERROR: 'automation:error',
  LOG_NEW_ENTRY: 'log:new-entry',
  DEV_LOG_GET_ENTRIES: 'dev-log:get-entries', // Renderer asks Main for buffered dev log
  DEV_LOG_NEW_ENTRY: 'dev-log:new-entry',     // Main pushes live dev log entries
  TRAY_REQUEST_START: 'tray:request-start',
  TRAY_REQUEST_STOP: 'tray:request-stop',
} as const
