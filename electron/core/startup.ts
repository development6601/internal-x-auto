// ============================================================================
// IMPORTS
// ============================================================================

import { app } from 'electron'

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Register InternalX in the OS startup registry so it launches at login.
 *
 * Skipped in development (VITE_DEV_SERVER_URL is set) to avoid registering
 * the dev build binary.  In production the packaged .exe path is used.
 *
 * The app launches hidden (minimized to tray) on auto-start, indicated by
 * the `--hidden` CLI flag which shouldStartHidden() detects.
 */
export function configureAutoLaunch(): void {
  if (process.env.VITE_DEV_SERVER_URL) return // dev — skip

  try {
    app.setLoginItemSettings({
      openAtLogin: true,
      path: app.getPath('exe'),
      args: ['--hidden'],
    })
  } catch (err) {
    console.error('[Startup] Failed to set login item:', err)
  }
}

/**
 * Returns true when the app was launched via auto-start (or explicitly
 * passed --hidden), meaning the main window should start hidden.
 */
export function shouldStartHidden(): boolean {
  return process.argv.includes('--hidden')
}
