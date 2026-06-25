// ============================================================================
// IMPORTS
// ============================================================================

import { dialog, ipcMain } from 'electron'
import type { BrowserWindow } from 'electron'
import fs from 'fs'
import { startAutomation, stopAutomation, isRunning } from './automation.js'
import { writeLog, readLog } from './logger.js'
import { updateTrayMode, updateTrayStatus } from './tray.js'
import { IPC_CHANNELS } from './types.js'
import type { StartPayload, StopPayload, AutomationStatus } from './types.js'
import { formatDuration } from './utils.js'

// ============================================================================
// CONSTANTS
// ============================================================================

const LOG_FILE_FILTERS = [{ name: 'Log Files', extensions: ['log', 'txt'] }]

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

  // ── automation:start ──────────────────────────────────────────────────────
  ipcMain.on(IPC_CHANNELS.AUTOMATION_START, (_event, payload: StartPayload) => {
    if (isRunning()) return // UI disables Start when running; this is a safety guard

    const send = buildSender(getWindow)

    const onStatus = (status: AutomationStatus, errorMessage?: string) => {
      send.status(status)
      if (errorMessage) send.error(errorMessage)
      // Keep tray icon in sync with automation state
      updateTrayStatus(status === 'running')
    }

    startAutomation(payload, onStatus, send.logEntry)
  })

  // ── automation:stop ───────────────────────────────────────────────────────
  ipcMain.on(IPC_CHANNELS.AUTOMATION_STOP, (_event, payload: StopPayload) => {
    if (!isRunning()) return

    const send = buildSender(getWindow)
    const { reason = 'manual', elapsedSeconds = 0 } = payload ?? {}

    stopAutomation()

    const durationStr = formatDuration(elapsedSeconds)
    const entry =
      reason === 'timer'
        ? `STOPPED (timer elapsed) — Ran for: ${durationStr}`
        : `STOPPED (manual) — Ran for: ${durationStr}`

    writeLog(entry)
    send.logEntry(entry)
    send.status('stopped')
    updateTrayStatus(false)
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

    if (result.canceled || !result.filePath) {
      return { success: false }
    }

    try {
      fs.writeFileSync(result.filePath, readLog(), 'utf8')
      return { success: true, path: result.filePath }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // ── app:mode-changed ──────────────────────────────────────────────────────
  // Renderer sends this whenever the mode radio selection changes.
  // Main updates the tray context menu label accordingly.
  ipcMain.on(IPC_CHANNELS.APP_MODE_CHANGED, (_event, { mode }: { mode: string }) => {
    updateTrayMode(mode)
  })
}
