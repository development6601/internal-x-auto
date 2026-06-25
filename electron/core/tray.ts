// ============================================================================
// IMPORTS
// ============================================================================

import { app, Menu, nativeImage, Tray } from 'electron'
import type { BrowserWindow, NativeImage } from 'electron'
import { IPC_CHANNELS } from './types.js'
import { APP_NAME } from '../../src/constants/app.constants.js'

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
let _mode = 'basic'
let _screenLock = false
let _shutdown = false

// ============================================================================
// CONSTANTS — SVG icon definitions
// ============================================================================

// Running state: Power icon on success-green background (#2d6a4f from design system)
// Matches `--color-success` for immediate "all-good" recognition
const SVG_RUNNING = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="6" fill="#2d6a4f"/>
  <g transform="translate(4,4)">
    <path d="M12 2v10" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M18.4 6.6a9 9 0 1 1-12.77.04" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  </g>
</svg>`

// Stopped state: PowerOff icon on error-red background (#9b2335 from design system)
// Matches `--color-error` for immediate "inactive" recognition
const SVG_STOPPED = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="6" fill="#9b2335"/>
  <g transform="translate(4,4)">
    <path d="M18.36 6.64A9 9 0 0 1 20.77 15" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <path d="M6.16 6.16a9 9 0 1 0 12.68 12.68" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <path d="M12 2v4" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <path d="M2 2L22 22" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  </g>
</svg>`

// ============================================================================
// UTILITY FUNCTIONS — Icon builder
// ============================================================================

/**
 * Convert an inline SVG string to a NativeImage via base64 data URL.
 * Falls back to a minimal 16×16 BGRA bitmap if the data URL fails.
 */
function svgToNativeImage(svg: string, isRunning: boolean): NativeImage {
  try {
    const dataUrl = 'data:image/svg+xml;base64,' + Buffer.from(svg.trim()).toString('base64')
    const img = nativeImage.createFromDataURL(dataUrl)
    if (!img.isEmpty()) return img
  } catch {
    // fall through to bitmap fallback
  }

  // ── Bitmap fallback: 16×16 filled circle (BGRA) ──────────────────────────
  // Used when SVG data-URL rendering is unavailable on the platform.
  const SIZE = 16
  const buf = Buffer.alloc(SIZE * SIZE * 4, 0)
  // Running: green #2d6a4f → BGRA [79, 106, 45, 255]
  // Stopped: red  #9b2335 → BGRA [53, 35, 155, 255]
  const [b, g, r] = isRunning ? [79, 106, 45] : [53, 35, 155]
  const cx = (SIZE - 1) / 2
  const cy = (SIZE - 1) / 2

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) <= SIZE / 2 - 1) {
        const i = (y * SIZE + x) * 4
        buf[i] = b; buf[i + 1] = g; buf[i + 2] = r; buf[i + 3] = 255
      }
    }
  }
  return nativeImage.createFromBitmap(buf, { width: SIZE, height: SIZE })
}

function buildTrayIcon(isRunning: boolean): NativeImage {
  return svgToNativeImage(isRunning ? SVG_RUNNING : SVG_STOPPED, isRunning)
}

// ============================================================================
// UTILITY FUNCTIONS — Menu builder
// ============================================================================

function buildContextMenu(getWindow: GetWindow): Menu {
  const statusLabel = _isRunning ? '● Running' : '○ Stopped'
  const modeLabel   = `Mode: ${_mode === 'advanced' ? 'Advanced' : 'Basic'}`

  const sendPreset = (hours: number) => {
    const win = getWindow()
    if (!win) return
    win.show()
    win.focus()
    win.webContents.send(IPC_CHANNELS.TRAY_REQUEST_START_PRESET, { hours })
  }

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
      label: 'Quick Start',
      enabled: !_isRunning,
      submenu: [
        { label: 'Start for 1 hour',  click: () => sendPreset(1) },
        { label: 'Start for 2 hours', click: () => sendPreset(2) },
        { label: 'Start for 3 hours', click: () => sendPreset(3) },
        { label: 'Start for 4 hours', click: () => sendPreset(4) },
      ],
    },
    {
      label: 'Stop Automation',
      enabled: _isRunning,
      click: () => {
        getWindow()?.webContents.send(IPC_CHANNELS.TRAY_REQUEST_STOP)
      },
    },
    { type: 'separator' },
    { label: 'After Timer Ends', enabled: false },
    {
      label: 'Screen Lock',
      type: 'checkbox',
      checked: _screenLock,
      enabled: !_isRunning,
      click: () => {
        const next = !_screenLock
        getWindow()?.webContents.send(IPC_CHANNELS.TRAY_SET_SCREEN_LOCK, { value: next })
      },
    },
    {
      label: 'Shutdown',
      type: 'checkbox',
      checked: _shutdown,
      enabled: !_isRunning,
      click: () => {
        const next = !_shutdown
        getWindow()?.webContents.send(IPC_CHANNELS.TRAY_SET_SHUTDOWN, { value: next })
      },
    },
    { type: 'separator' },
    { label: modeLabel, enabled: false },
    { type: 'separator' },
    {
      label: 'Open Application',
      click: () => {
        const win = getWindow()
        if (win) { win.show(); win.focus() }
      },
    },
    { type: 'separator' },
    { label: 'Exit', click: () => app.quit() },
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
  tray.setToolTip(`${APP_NAME} — Stopped`)
  tray.setContextMenu(buildContextMenu(getWindow))

  tray.on('double-click', () => {
    const win = getWindow()
    if (win) { win.show(); win.focus() }
  })
}

/**
 * Sync tray icon and menu with the current automation running state.
 * Called from ipc.ts on every automation:status change.
 */
export function updateTrayStatus(isRunning: boolean): void {
  if (!tray || !_getWindow) return
  _isRunning = isRunning
  tray.setImage(buildTrayIcon(isRunning))
  tray.setToolTip(`${APP_NAME} — ${isRunning ? 'Running' : 'Stopped'}`)
  tray.setContextMenu(buildContextMenu(_getWindow))
}

/**
 * Refresh the mode label in the tray context menu.
 * Called from ipc.ts when the renderer sends app:mode-changed.
 */
export function updateTrayMode(mode: string): void {
  if (!tray || !_getWindow) return
  _mode = mode
  tray.setContextMenu(buildContextMenu(_getWindow))
}

/**
 * Sync the After Timer Ends checkboxes in the tray menu with renderer state.
 * Called from ipc.ts when the renderer sends tray:post-stop-options-changed.
 */
export function updateTrayPostStopOptions(screenLock: boolean, shutdown: boolean): void {
  if (!tray || !_getWindow) return
  _screenLock = screenLock
  _shutdown = shutdown
  tray.setContextMenu(buildContextMenu(_getWindow))
}

/** Destroy the tray on app exit. */
export function destroyTray(): void {
  tray?.destroy()
  tray = null
}
