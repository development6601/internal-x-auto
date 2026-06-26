// ============================================================================
// IMPORTS
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ThemeMode = 'system' | 'light' | 'dark'

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'internalx-theme'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const readStoredMode = (): ThemeMode => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // localStorage unavailable
  }
  return 'system'
}

const getSystemPreference = (): 'light' | 'dark' => {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

const applyDarkClass = (isDark: boolean): void => {
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Manages the app's colour-scheme mode.
 *
 * - 'system': follows the OS/browser `prefers-color-scheme` media query
 * - 'light':  always light regardless of system preference
 * - 'dark':   always dark regardless of system preference
 *
 * The chosen mode is persisted in localStorage under 'internalx-theme'.
 * The hook applies the `dark` class to `document.documentElement` so that
 * Tailwind's `class` dark-mode strategy and CSS-variable overrides take effect.
 */
const useTheme = () => {
  // ============================================================================
  // STATE
  // ============================================================================
  const [themeMode, setThemeModeState] = useState<ThemeMode>(readStoredMode)
  const [systemPref, setSystemPref] = useState<'light' | 'dark'>(getSystemPreference)

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  const isDark = useMemo(() => {
    if (themeMode === 'dark') return true
    if (themeMode === 'light') return false
    return systemPref === 'dark'
  }, [themeMode, systemPref])

  // ============================================================================
  // EFFECTS — apply dark class
  // ============================================================================
  useEffect(() => {
    applyDarkClass(isDark)
  }, [isDark])

  // ============================================================================
  // EFFECTS — track system preference changes (only matters in 'system' mode)
  // ============================================================================
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')

    const handler = (e: MediaQueryListEvent) => {
      setSystemPref(e.matches ? 'dark' : 'light')
    }

    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // ============================================================================
  // FUNCTIONS
  // ============================================================================
  const setThemeMode = useCallback((mode: ThemeMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // localStorage unavailable — still apply in memory
    }
    setThemeModeState(mode)
  }, [])

  /**
   * Cycle through modes: system → light → dark → system.
   * A single-click toggle cycles through all three states.
   */
  const cycleTheme = useCallback(() => {
    setThemeMode(
      themeMode === 'system' ? (isDark ? 'light' : 'dark')
        : themeMode === 'light' ? 'dark'
          : 'system',
    )
  }, [themeMode, isDark, setThemeMode])

  return { themeMode, isDark, setThemeMode, cycleTheme }
}

export default useTheme
