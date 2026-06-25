// ============================================================================
// IMPORTS
// ============================================================================

import { useCallback, useEffect } from 'react'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface StartPayload {
  mode: 'basic' | 'advanced'
  durationSeconds: number
  shutdown: boolean
}

interface StopPayload {
  reason: 'manual' | 'timer'
  elapsedSeconds: number
}

interface UseAutomationOptions {
  onStatus: (status: 'running' | 'stopped' | 'error') => void
  onError: (message: string) => void
}

// ============================================================================
// CONSTANTS
// ============================================================================

const hasElectronAPI = (): boolean =>
  typeof window !== 'undefined' && window.electronAPI !== undefined

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Bridges the React UI to the Electron automation IPC layer.
 *
 * - Subscribes to `automation:status` and `automation:error` from Main.
 * - Exposes `start(payload)` and `stop(payload)` to the component.
 * - Gracefully no-ops when running outside of Electron (browser dev).
 */
const useAutomation = ({ onStatus, onError }: UseAutomationOptions) => {

  // ── Subscribe to IPC events ───────────────────────────────────────────────
  useEffect(() => {
    if (!hasElectronAPI()) return

    const unsubStatus = window.electronAPI!.automation.onStatus(({ status }) => {
      onStatus(status)
    })

    const unsubError = window.electronAPI!.automation.onError(({ message }) => {
      onError(message)
    })

    return () => {
      unsubStatus()
      unsubError()
    }
  }, [onStatus, onError])

  // ── Exposed actions ───────────────────────────────────────────────────────
  const start = useCallback((payload: StartPayload): void => {
    if (!hasElectronAPI()) {
      console.warn('[useAutomation] electronAPI not available — running outside Electron?')
      return
    }
    window.electronAPI!.automation.start(payload)
  }, [])

  const stop = useCallback((payload: StopPayload): void => {
    if (!hasElectronAPI()) return
    window.electronAPI!.automation.stop(payload)
  }, [])

  return { start, stop }
}

export default useAutomation
