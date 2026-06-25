// ============================================================================
// IMPORTS
// ============================================================================

import { app, BrowserWindow } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { getAppIcon, getAppIconPath, getWindowsWindowIcon } from './core/app-icon.js'
import { registerIpcHandlers } from './core/ipc.js'
import { cleanupOnExit } from './core/automation.js'
import { createTray, destroyTray } from './core/tray.js'
import { configureAutoLaunch, shouldStartHidden } from './core/startup.js'
import { APP_NAME } from '../src/constants/app.constants.js'

// ============================================================================
// CONSTANTS
// ============================================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const APP_WIDTH = 420
const APP_MIN_WIDTH = 350
const APP_MAX_WIDTH = 450
const APP_HEIGHT = 800
const APP_MIN_HEIGHT = 700
const APP_MAX_HEIGHT = 850
const WINDOWS_APP_USER_MODEL_ID = 'com.internalx.app'

// Must be set before app.whenReady() so Windows groups the taskbar entry
// under our AppUserModelID and uses the window icon we provide.
if (process.platform === 'win32') {
  app.setAppUserModelId(WINDOWS_APP_USER_MODEL_ID)
}

// ============================================================================
// STATE
// ============================================================================

let mainWindow: BrowserWindow | null = null

/**
 * Set to true before app.quit() so the window `close` handler allows the
 * quit to proceed instead of hiding to tray.
 */
let isQuitting = false

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

function applyAppIcon(): void {
  const icon = getAppIcon()
  if (icon.isEmpty()) return

  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(icon)
  }
}

function createWindow(): void {
  const appIcon = getAppIcon()
  const appIconPath = getAppIconPath()
  const windowsIconPath = getWindowsWindowIcon()

  // Windows: pass absolute .ico path string — most reliable for taskbar icon.
  // Other platforms: NativeImage or path fallback.
  const windowIcon =
    process.platform === 'win32'
      ? windowsIconPath
      : appIconPath ?? (appIcon.isEmpty() ? undefined : appIcon)

  mainWindow = new BrowserWindow({
    width: APP_WIDTH,
    height: APP_HEIGHT,
    minWidth: APP_MIN_WIDTH,
    maxWidth: APP_MAX_WIDTH,
    minHeight: APP_MIN_HEIGHT,
    maxHeight: APP_MAX_HEIGHT,
    title: APP_NAME,
    icon: windowIcon,
    // Start hidden when launched at login (--hidden flag)
    show: !shouldStartHidden(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      // sandbox: false is required to allow ESM preload scripts.
      // contextIsolation remains true so contextBridge is enforced.
      sandbox: false,
      // Prevent Chromium from throttling timers when the window is hidden
      // to the system tray. Without this, setInterval fires at ~3-5x slower
      // than the requested 1 s interval, causing the elapsed/remaining timers
      // in the renderer to fall far behind real wall-clock time.
      backgroundThrottling: false,
    },
  })

  if (!appIcon.isEmpty()) {
    mainWindow.setIcon(appIcon)
  } else if (windowsIconPath) {
    mainWindow.setIcon(windowsIconPath)
  }

  mainWindow.once('ready-to-show', () => {
    // Re-apply on show — Windows sometimes drops the icon set at construction
    // when the window was created hidden (tray / --hidden startup).
    if (windowsIconPath) {
      mainWindow?.setIcon(windowsIconPath)
    } else if (!appIcon.isEmpty()) {
      mainWindow?.setIcon(appIcon)
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Minimize to tray on close — only fully quit via tray "Exit"
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ============================================================================
// APP LIFECYCLE
// ============================================================================

// macOS dock hover label defaults to "Electron" in dev unless set explicitly.
app.setName(APP_NAME)

if (process.platform === 'darwin') {
  app.setAboutPanelOptions({ applicationName: APP_NAME })
}

app.whenReady().then(() => {
  applyAppIcon()

  // Register all IPC handlers before creating the window
  registerIpcHandlers(getMainWindow)

  // Create the main window
  createWindow()

  // Create the system tray icon and context menu
  createTray(getMainWindow)

  // Register the app in the OS startup registry (production only)
  configureAutoLaunch()

  app.on('activate', () => {
    // macOS: re-create window if dock icon is clicked and no windows are open
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('before-quit', () => {
  isQuitting = true
  // Kill any running Python child process before exiting
  cleanupOnExit()
  destroyTray()
})

app.on('window-all-closed', () => {
  // On macOS apps stay active until explicitly quit; on Windows/Linux quit immediately.
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
