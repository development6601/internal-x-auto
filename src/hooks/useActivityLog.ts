// ============================================================================
// IMPORTS
// ============================================================================

import { useEffect, useState } from 'react'

// ============================================================================
// CONSTANTS
// ============================================================================

const hasElectronAPI = (): boolean =>
  typeof window !== 'undefined' && window.electronAPI !== undefined

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Subscribes to live log entries pushed from the Electron main process.
 * New entries are prepended so the most recent appears first.
 */
const useActivityLog = () => {
  // ── STATE ─────────────────────────────────────────────────────────────────
  const [entries, setEntries] = useState<string[]>([])

  // ── EFFECTS ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasElectronAPI()) return

    const unsubscribe = window.electronAPI!.log.onNewEntry(({ entry }) => {
      setEntries((prev) => [entry, ...prev])
    })

    return unsubscribe
  }, [])

  // ── ACTIONS ───────────────────────────────────────────────────────────────
  const exportLog = async (): Promise<void> => {
    if (!hasElectronAPI()) return
    await window.electronAPI!.log.export()
  }

  const clearEntries = (): void => {
    setEntries([])
  }

  return { entries, exportLog, clearEntries }
}

export default useActivityLog
