// ============================================================================
// TYPE DEFINITIONS — window.electronAPI bridge (mirrors electron/preload.ts)
// ============================================================================

type Unsubscribe = () => void

interface AutomationStartPayload {
  mode: 'basic' | 'advanced'
  durationSeconds: number
  closeTracker: boolean
  shutdown: boolean
}

interface AutomationStopPayload {
  reason: 'manual' | 'timer'
  elapsedSeconds: number
}

interface AutomationStatusPayload {
  status: 'running' | 'stopped' | 'error'
}

interface AutomationErrorPayload {
  message: string
}

interface LogEntryPayload {
  entry: string
}

interface ExportLogResult {
  success: boolean
  path?: string
  error?: string
}

interface PrerequisitesCheckResult {
  ready: boolean
  pythonFound: boolean
  pythonBin?: string
  missingModules: string[]
  message?: string
}

interface PrerequisitesInstallResult {
  success: boolean
  error?: string
}

interface ElectronAPI {
  automation: {
    start: (payload: AutomationStartPayload) => void
    stop: (payload: AutomationStopPayload) => void
    onStatus: (cb: (payload: AutomationStatusPayload) => void) => Unsubscribe
    onError: (cb: (payload: AutomationErrorPayload) => void) => Unsubscribe
  }
  prerequisites: {
    check: () => Promise<PrerequisitesCheckResult>
    install: () => Promise<PrerequisitesInstallResult>
  }
  log: {
    onNewEntry: (cb: (payload: LogEntryPayload) => void) => Unsubscribe
    getEntries: () => Promise<string[]>
    export: () => Promise<ExportLogResult>
  }
  devLog: {
    getEntries: () => Promise<string[]>
    onNewEntry: (cb: (payload: { entry: string }) => void) => Unsubscribe
  }
  postStop: {
    executeShutdown: () => void
  }
  tray: {
    onRequestStart: (cb: () => void) => Unsubscribe
    onRequestStop: (cb: () => void) => Unsubscribe
    notifyModeChanged: (mode: string) => void
  }
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
