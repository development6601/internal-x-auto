// ============================================================================
// IMPORTS
// ============================================================================

import { useCallback, useEffect, useState } from 'react'

// ============================================================================
// CONSTANTS
// ============================================================================

const hasElectronAPI = (): boolean =>
  typeof window !== 'undefined' && window.electronAPI !== undefined

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Manages the developer / debug log panel entries.
 *
 * On mount:  fetches buffered entries from the Main process ring buffer.
 * At runtime: appends new entries pushed live from Main (newest at bottom).
 *
 * The dev log captures internal events: Python spawn, stdout/stderr,
 * exit codes, IPC events, tray changes — useful for debugging without
 * attaching a full Node debugger.
 */
const useDevLog = () => {
  // ── STATE ─────────────────────────────────────────────────────────────────
  const [entries, setEntries] = useState<string[]>([])

  // ── EFFECTS — Load buffered entries on mount ──────────────────────────────
  useEffect(() => {
    if (!hasElectronAPI()) return

    window.electronAPI!.devLog.getEntries().then((historical) => {
      if (historical.length > 0) {
        setEntries(historical)
      }
    }).catch(() => {
      // IPC unavailable — start with empty state
    })
  }, [])

  // ── EFFECTS — Subscribe to live entries from Main ─────────────────────────
  useEffect(() => {
    if (!hasElectronAPI()) return

    const unsubscribe = window.electronAPI!.devLog.onNewEntry(({ entry }) => {
      // Append newest at the end so the log reads top-to-bottom chronologically
      setEntries((prev) => [...prev, entry])
    })

    return unsubscribe
  }, [])

  // ── ACTIONS ───────────────────────────────────────────────────────────────
  const clearEntries = useCallback(() => {
    setEntries([])
  }, [])

  return { entries, clearEntries }
}

export default useDevLog
