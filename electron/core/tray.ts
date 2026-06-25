// ============================================================================
// IMPORTS
// ============================================================================

import { app, Menu, nativeImage, Tray } from 'electron'
import type { BrowserWindow, NativeImage } from 'electron'
import { IPC_CHANNELS } from './types.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type GetWindow = () => BrowserWindow | null

// ============================================================================
// STATE
// ============================================================================

let tray: Tray | null = null
let _getWindow: GetWindow | null = null
let _isRunning = false
let _mode = 'advanced'

// ============================================================================
// UTILITY FUNCTIONS — Icon generation
// ============================================================================

/**
 * Creates a 16×16 circle icon programmatically using raw BGRA pixel data.
 * Green = automation running, gray = stopped/idle.
 * No external image files required.
 */
function buildTrayIcon(isRunning: boolean): NativeImage {
  const SIZE = 16
  const buf = Buffer.alloc(SIZE * SIZE * 4, 0) // all transparent

  // BGRA: green #22c55e when running, gray #6b7280 when stopped
  const [b, g, r] = isRunning ? [94, 197, 34] : [128, 114, 107]
  const cx = (SIZE - 1) / 2
  const cy = (SIZE - 1) / 2
  const radius = SIZE / 2 - 1.5 // slight inset so the circle isn't clipped

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      if (dist <= radius) {
        const i = (y * SIZE + x) * 4
        buf[i] = b
        buf[i + 1] = g
        buf[i + 2] = r
        buf[i + 3] = 255
      }
    }
  }

  return nativeImage.createFromBitmap(buf, { width: SIZE, height: SIZE })
}

// ============================================================================
// UTILITY FUNCTIONS — Menu builder
// ============================================================================

function buildContextMenu(getWindow: GetWindow): Menu {
  const statusLabel = _isRunning ? '● Running' : '○ Stopped'
  const modeLabel = `Mode: ${_mode === 'advanced' ? 'Advanced' : 'Basic'}`

  return Menu.buildFromTemplate([
    { label: statusLabel, enabled: false },
    { type: 'separator' },
    {
      label: 'Start Automation',
      enabled: !_isRunning,
      click: () => {
        const win = getWindow()
        if (win) {
          win.show()
          win.focus()
          win.webContents.send(IPC_CHANNELS.TRAY_REQUEST_START)
        }
      },
    },
    {
      label: 'Stop Automation',
      enabled: _isRunning,
      click: () => {
        getWindow()?.webContents.send(IPC_CHANNELS.TRAY_REQUEST_STOP)
      },
    },
    { type: 'separator' },
    { label: modeLabel, enabled: false },
    { type: 'separator' },
    {
      label: 'Open Application',
      click: () => {
        const win = getWindow()
        if (win) {
          win.show()
          win.focus()
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => app.quit(),
    },
  ])
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Create the system tray icon and context menu.
 * Must be called after app.whenReady().
 */
export function createTray(getWindow: GetWindow): void {
  _getWindow = getWindow

  tray = new Tray(buildTrayIcon(false))
  tray.setToolTip('InternalX — Stopped')
  tray.setContextMenu(buildContextMenu(getWindow))

  // Double-click restores the window
  tray.on('double-click', () => {
    const win = getWindow()
    if (win) {
      win.show()
      win.focus()
    }
  })
}

/**
 * Update the tray icon and menu to reflect the current running state.
 * Called by ipc.ts whenever automation:status changes.
 */
export function updateTrayStatus(isRunning: boolean): void {
  if (!tray || !_getWindow) return
  _isRunning = isRunning
  tray.setImage(buildTrayIcon(isRunning))
  tray.setToolTip(`InternalX — ${isRunning ? 'Running' : 'Stopped'}`)
  tray.setContextMenu(buildContextMenu(_getWindow))
}

/**
 * Update the mode label shown in the tray context menu.
 * Called by ipc.ts whenever the renderer notifies mode change.
 */
export function updateTrayMode(mode: string): void {
  if (!tray || !_getWindow) return
  _mode = mode
  tray.setContextMenu(buildContextMenu(_getWindow))
}

/**
 * Destroy the tray instance on app exit.
 */
export function destroyTray(): void {
  tray?.destroy()
  tray = null
}
