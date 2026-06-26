// ============================================================================
// IMPORTS
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ThemeMode = 'light' | 'dark'

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'internalx-theme'
const DEFAULT_THEME_MODE: ThemeMode = 'light'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const readStoredMode = (): ThemeMode => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark') return 'dark'
    if (stored === 'light') return 'light'
    // Migrate legacy 'system' preference to light
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_THEME_MODE
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
 * Manages the app's colour-scheme mode (light or dark only).
 *
 * Default is light. The chosen mode is persisted in localStorage under
 * `internalx-theme`. The hook applies the `dark` class to `document.documentElement`
 * so Tailwind's `class` dark-mode strategy and CSS-variable overrides take effect.
 */
const useTheme = () => {
  // ============================================================================
  // STATE
  // ============================================================================
  const [themeMode, setThemeModeState] = useState<ThemeMode>(readStoredMode)

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  const isDark = useMemo(() => themeMode === 'dark', [themeMode])

  // ============================================================================
  // EFFECTS — apply dark class
  // ============================================================================
  useEffect(() => {
    applyDarkClass(isDark)
  }, [isDark])

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

  /** Toggle between light and dark. */
  const cycleTheme = useCallback(() => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light')
  }, [themeMode, setThemeMode])

  return { themeMode, isDark, setThemeMode, cycleTheme }
}

export default useTheme
