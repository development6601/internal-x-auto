// ============================================================================
// IMPORTS
// ============================================================================

import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'
import { IPC_CHANNELS } from './core/types.js'
import type { StartPayload, StopPayload, StatusPayload, ErrorPayload, LogEntryPayload } from './core/types.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type Unsubscribe = () => void

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/** Subscribe to a Main → Renderer channel and return an unsubscribe fn. */
function on<T>(channel: string, callback: (payload: T) => void): Unsubscribe {
  const handler = (_event: IpcRendererEvent, payload: T) => callback(payload)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

/** Subscribe to a channel that carries no payload. */
function onVoid(channel: string, callback: () => void): Unsubscribe {
  const handler = () => callback()
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

// ============================================================================
// BRIDGE EXPOSURE
// ============================================================================

contextBridge.exposeInMainWorld('electronAPI', {

  // ── Automation ─────────────────────────────────────────────────────────────
  automation: {
    /** Fire-and-forget: spawn Python with the given config after countdown. */
    start: (payload: StartPayload): void => {
      ipcRenderer.send(IPC_CHANNELS.AUTOMATION_START, payload)
    },

    /** Fire-and-forget: kill Python and log the stop reason + duration. */
    stop: (payload: StopPayload): void => {
      ipcRenderer.send(IPC_CHANNELS.AUTOMATION_STOP, payload)
    },

    /** Subscribe to automation status updates from Main. */
    onStatus: (cb: (payload: StatusPayload) => void): Unsubscribe => {
      return on<StatusPayload>(IPC_CHANNELS.AUTOMATION_STATUS, cb)
    },

    /** Subscribe to automation error messages from Main. */
    onError: (cb: (payload: ErrorPayload) => void): Unsubscribe => {
      return on<ErrorPayload>(IPC_CHANNELS.AUTOMATION_ERROR, cb)
    },
  },

  // ── Activity log ───────────────────────────────────────────────────────────
  log: {
    /** Subscribe to new log entries pushed from Main. */
    onNewEntry: (cb: (payload: LogEntryPayload) => void): Unsubscribe => {
      return on<LogEntryPayload>(IPC_CHANNELS.LOG_NEW_ENTRY, cb)
    },

    /** Open a save dialog and write the log to the chosen path. */
    export: (): Promise<{ success: boolean; path?: string; error?: string }> => {
      return ipcRenderer.invoke(IPC_CHANNELS.LOG_EXPORT)
    },
  },

  // ── Tray ───────────────────────────────────────────────────────────────────
  tray: {
    /** Subscribe to "Start Automation" from tray right-click menu. */
    onRequestStart: (cb: () => void): Unsubscribe => {
      return onVoid(IPC_CHANNELS.TRAY_REQUEST_START, cb)
    },

    /** Subscribe to "Stop Automation" from tray right-click menu. */
    onRequestStop: (cb: () => void): Unsubscribe => {
      return onVoid(IPC_CHANNELS.TRAY_REQUEST_STOP, cb)
    },

    /** Notify Main when the mode radio changes so the tray menu label stays in sync. */
    notifyModeChanged: (mode: string): void => {
      ipcRenderer.send(IPC_CHANNELS.APP_MODE_CHANGED, { mode })
    },
  },
})
