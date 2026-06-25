// ============================================================================
// IMPORTS
// ============================================================================

import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'
import { IPC_CHANNELS } from './core/types.js'
import type { StartPayload, StopPayload, StatusPayload, ErrorPayload, LogEntryPayload, PrerequisitesCheckResult, PrerequisitesInstallResult } from './core/types.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type Unsubscribe = () => void

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/** Subscribe to a Main → Renderer channel. Returns an unsubscribe fn. */
function on<T>(channel: string, callback: (payload: T) => void): Unsubscribe {
  const handler = (_event: IpcRendererEvent, payload: T) => callback(payload)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

/** Subscribe to a payload-less Main → Renderer channel. */
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
    start: (payload: StartPayload): void => {
      ipcRenderer.send(IPC_CHANNELS.AUTOMATION_START, payload)
    },
    stop: (payload: StopPayload): void => {
      ipcRenderer.send(IPC_CHANNELS.AUTOMATION_STOP, payload)
    },
    onStatus: (cb: (payload: StatusPayload) => void): Unsubscribe => {
      return on<StatusPayload>(IPC_CHANNELS.AUTOMATION_STATUS, cb)
    },
    onError: (cb: (payload: ErrorPayload) => void): Unsubscribe => {
      return on<ErrorPayload>(IPC_CHANNELS.AUTOMATION_ERROR, cb)
    },
  },

  // ── Prerequisites ──────────────────────────────────────────────────────────
  prerequisites: {
    check: (): Promise<PrerequisitesCheckResult> => {
      return ipcRenderer.invoke(IPC_CHANNELS.PREREQUISITES_CHECK)
    },
    install: (): Promise<PrerequisitesInstallResult> => {
      return ipcRenderer.invoke(IPC_CHANNELS.PREREQUISITES_INSTALL)
    },
  },

  // ── Activity log ───────────────────────────────────────────────────────────
  log: {
    /** Subscribe to new live log entries pushed from Main. */
    onNewEntry: (cb: (payload: LogEntryPayload) => void): Unsubscribe => {
      return on<LogEntryPayload>(IPC_CHANNELS.LOG_NEW_ENTRY, cb)
    },

    /** Fetch all historical log entries from disk (newest first). Called on mount. */
    getEntries: (): Promise<string[]> => {
      return ipcRenderer.invoke(IPC_CHANNELS.LOG_GET_ENTRIES)
    },

    /** Open a save dialog and write the log to the chosen path. */
    export: (): Promise<{ success: boolean; path?: string; error?: string }> => {
      return ipcRenderer.invoke(IPC_CHANNELS.LOG_EXPORT)
    },
  },

  // ── Post-stop actions ──────────────────────────────────────────────────────
  postStop: {
    /** Tell Main to lock the screen immediately (Windows / macOS). */
    lockScreen: (): void => {
      ipcRenderer.send(IPC_CHANNELS.POST_STOP_SCREEN_LOCK)
    },
    /** Tell Main to shut down the OS after the 30 s countdown elapses (Windows / macOS). */
    executeShutdown: (): void => {
      ipcRenderer.send(IPC_CHANNELS.POST_STOP_SHUTDOWN)
    },
  },

  // ── Developer log ──────────────────────────────────────────────────────────
  devLog: {
    /** Fetch buffered dev log entries from Main (oldest first). Called on panel open. */
    getEntries: (): Promise<string[]> => {
      return ipcRenderer.invoke(IPC_CHANNELS.DEV_LOG_GET_ENTRIES)
    },
    /** Subscribe to live dev log entries pushed from Main as they happen. */
    onNewEntry: (cb: (payload: { entry: string }) => void): Unsubscribe => {
      return on<{ entry: string }>(IPC_CHANNELS.DEV_LOG_NEW_ENTRY, cb)
    },
  },

  // ── Tray ───────────────────────────────────────────────────────────────────
  tray: {
    onRequestStart: (cb: () => void): Unsubscribe => {
      return onVoid(IPC_CHANNELS.TRAY_REQUEST_START, cb)
    },
    onRequestStop: (cb: () => void): Unsubscribe => {
      return onVoid(IPC_CHANNELS.TRAY_REQUEST_STOP, cb)
    },
    /** Main asks renderer to start with a specific hour preset. */
    onRequestStartPreset: (cb: (payload: { hours: number }) => void): Unsubscribe => {
      return on<{ hours: number }>(IPC_CHANNELS.TRAY_REQUEST_START_PRESET, cb)
    },
    /** Main asks renderer to set the screen-lock post-stop preference. */
    onSetScreenLock: (cb: (payload: { value: boolean }) => void): Unsubscribe => {
      return on<{ value: boolean }>(IPC_CHANNELS.TRAY_SET_SCREEN_LOCK, cb)
    },
    /** Main asks renderer to set the shutdown post-stop preference. */
    onSetShutdown: (cb: (payload: { value: boolean }) => void): Unsubscribe => {
      return on<{ value: boolean }>(IPC_CHANNELS.TRAY_SET_SHUTDOWN, cb)
    },
    /** Renderer notifies Main that post-stop preferences changed (keeps tray checkboxes in sync). */
    notifyPostStopOptionsChanged: (screenLock: boolean, shutdown: boolean): void => {
      ipcRenderer.send(IPC_CHANNELS.TRAY_POST_STOP_OPTIONS_CHANGED, { screenLock, shutdown })
    },
    notifyModeChanged: (mode: string): void => {
      ipcRenderer.send(IPC_CHANNELS.APP_MODE_CHANGED, { mode })
    },
  },
})
