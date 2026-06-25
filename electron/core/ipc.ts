// ============================================================================
// IMPORTS
// ============================================================================

import { dialog, ipcMain } from 'electron'
import type { BrowserWindow } from 'electron'
import fs from 'fs'
import { startAutomation, stopAutomation, isRunning } from './automation.js'
import { devLog, getDevLogEntries, setDevLogRenderer } from './dev-logger.js'
import { writeLog, readLog } from './logger.js'
import { executeScreenLock, executeSystemShutdown } from './post-stop.js'
import { checkPythonPrerequisites, installPythonPrerequisites } from './python-deps.js'
import { updateTrayMode, updateTrayPostStopOptions, updateTrayStatus } from './tray.js'
import { IPC_CHANNELS } from './types.js'
import type { StartPayload, StopPayload, AutomationStatus } from './types.js'
import { formatDuration } from './utils.js'

// ============================================================================
// CONSTANTS
// ============================================================================

const LOG_FILE_FILTERS = [{ name: 'Log Files', extensions: ['log', 'txt'] }]

// ============================================================================
// STATE
// ============================================================================

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function buildSender(getWindow: () => BrowserWindow | null) {
  return {
    status: (status: AutomationStatus) => {
      getWindow()?.webContents.send(IPC_CHANNELS.AUTOMATION_STATUS, { status })
    },
    error: (message: string) => {
      getWindow()?.webContents.send(IPC_CHANNELS.AUTOMATION_ERROR, { message })
    },
    logEntry: (entry: string) => {
      getWindow()?.webContents.send(IPC_CHANNELS.LOG_NEW_ENTRY, { entry })
    },
    devLogEntry: (entry: string) => {
      getWindow()?.webContents.send(IPC_CHANNELS.DEV_LOG_NEW_ENTRY, { entry })
    },
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Register all IPC handlers.
 * Call once from electron/main.ts after app.whenReady().
 */
export function registerIpcHandlers(getWindow: () => BrowserWindow | null): void {

  // ── Wire dev-logger renderer pusher ──────────────────────────────────────
  // Uses a lazy closure so it always uses the current window reference.
  setDevLogRenderer((entry: string) => {
    getWindow()?.webContents.send(IPC_CHANNELS.DEV_LOG_NEW_ENTRY, { entry })
  })

  // ── automation:start ──────────────────────────────────────────────────────
  ipcMain.on(IPC_CHANNELS.AUTOMATION_START, (_event, payload: StartPayload) => {
    console.log('[IPC] AUTOMATION_START received — payload:', JSON.stringify(payload))
    devLog('INFO', `IPC: AUTOMATION_START received — mode: ${payload.mode}, duration: ${payload.durationSeconds}s`)

    if (isRunning()) {
      console.log('[IPC] Already running — ignoring')
      devLog('WARN', 'IPC: AUTOMATION_START ignored — already running')
      return
    }

    const send = buildSender(getWindow)
    // Update tray immediately so the icon reflects the new state without
    // waiting for the Python process to confirm via onStatus callback.
    updateTrayStatus(true)

    const onStatus = (status: AutomationStatus, errorMessage?: string) => {
      send.status(status)
      if (errorMessage) send.error(errorMessage)
      // Re-sync on any status change (handles error → stopped transitions too)
      updateTrayStatus(status === 'running')
    }

    startAutomation(payload, onStatus, send.logEntry)
  })

  // ── prerequisites:check ───────────────────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.PREREQUISITES_CHECK, () => {
    devLog('INFO', 'IPC: PREREQUISITES_CHECK')
    return checkPythonPrerequisites()
  })

  // ── prerequisites:install ─────────────────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.PREREQUISITES_INSTALL, async () => {
    devLog('INFO', 'IPC: PREREQUISITES_INSTALL')
    const send = buildSender(getWindow)
    return installPythonPrerequisites(send.logEntry)
  })

  // ── automation:stop ───────────────────────────────────────────────────────
  ipcMain.on(IPC_CHANNELS.AUTOMATION_STOP, (_event, payload: StopPayload) => {
    if (!isRunning()) return

    const send = buildSender(getWindow)
    const { reason = 'manual', elapsedSeconds = 0 } = payload ?? {}

    devLog('INFO', `IPC: AUTOMATION_STOP — reason: ${reason}, elapsed: ${elapsedSeconds}s`)
    stopAutomation()

    // Write the stop log entry (duration is known by the renderer which tracks elapsed time)
    const durationStr = formatDuration(elapsedSeconds)
    const stopEntry =
      reason === 'timer'
        ? `STOPPED (timer elapsed) — Ran for: ${durationStr}`
        : `STOPPED (manual) — Ran for: ${durationStr}`

    writeLog(stopEntry)
    send.logEntry(stopEntry)
    send.status('stopped')
    updateTrayStatus(false)
  })

  // ── post-stop:shutdown ────────────────────────────────────────────────────
  // Triggered by the renderer after the 30-second shutdown countdown elapses
  // without user cancellation.
  ipcMain.on(IPC_CHANNELS.POST_STOP_SHUTDOWN, () => {
    const send = buildSender(getWindow)
    executeSystemShutdown(send.logEntry)
  })

  // ── post-stop:screen-lock ─────────────────────────────────────────────────
  // Triggered by the renderer when the Screen Lock post-stop option is active.
  // Called immediately on stop (standalone) or just before shutdown (combined).
  ipcMain.on(IPC_CHANNELS.POST_STOP_SCREEN_LOCK, () => {
    const send = buildSender(getWindow)
    executeScreenLock(send.logEntry)
  })

  // ── log:get-entries ───────────────────────────────────────────────────────
  // Renderer calls this on mount to populate the Activity Log with entries
  // from all previous sessions (F6 — log persists across restarts).
  ipcMain.handle(IPC_CHANNELS.LOG_GET_ENTRIES, (): string[] => {
    const raw = readLog()
    if (!raw.trim()) return []
    // Split on newlines, drop blank lines, newest-first
    return raw
      .trim()
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .reverse()
  })

  // ── log:export ────────────────────────────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.LOG_EXPORT, async () => {
    const win = getWindow()
    const saveOptions = {
      title: 'Export Activity Log',
      defaultPath: 'internalx-activity.log',
      filters: LOG_FILE_FILTERS,
    }
    const result = win
      ? await dialog.showSaveDialog(win, saveOptions)
      : await dialog.showSaveDialog(saveOptions)

    if (result.canceled || !result.filePath) return { success: false }

    try {
      fs.writeFileSync(result.filePath, readLog(), 'utf8')
      return { success: true, path: result.filePath }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // ── dev-log:get-entries ───────────────────────────────────────────────────
  // Renderer calls this on mount to hydrate the dev log panel with in-memory
  // entries accumulated since app start (oldest first).
  ipcMain.handle(IPC_CHANNELS.DEV_LOG_GET_ENTRIES, (): string[] => {
    return getDevLogEntries()
  })

  // ── app:mode-changed ──────────────────────────────────────────────────────
  ipcMain.on(IPC_CHANNELS.APP_MODE_CHANGED, (_event, { mode }: { mode: string }) => {
    devLog('INFO', `Mode changed to: ${mode}`)
    updateTrayMode(mode)
  })

  // ── tray:post-stop-options-changed ────────────────────────────────────────
  // Renderer sends this whenever screen-lock or shutdown preferences change so
  // the tray checkbox items stay in sync with the app UI.
  ipcMain.on(
    IPC_CHANNELS.TRAY_POST_STOP_OPTIONS_CHANGED,
    (_event, { screenLock, shutdown }: { screenLock: boolean; shutdown: boolean }) => {
      updateTrayPostStopOptions(screenLock, shutdown)
    },
  )
}
