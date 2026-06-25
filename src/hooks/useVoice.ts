// ============================================================================
// IMPORTS
// ============================================================================

import { useCallback } from 'react'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const VOICE_MESSAGES = {
  countdownStart: 'Automation starting in 10 seconds.',
  started: 'Automation started.',
  stopped: 'Automation stopped.',
  shutdownWarning: 'System will shut down in 30 seconds.',
} as const

/**
 * Speak a message using the Web Speech API.
 * Silently no-ops if speech synthesis is unavailable.
 */
function speak(message: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  try {
    // Cancel any ongoing speech before starting a new one
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(message))
  } catch {
    // Speech synthesis unavailable — silently skip (per requirements F7)
  }
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Exposes voice announcement functions at each key automation event.
 * Uses the Web Speech API — no external library or API key required.
 * All functions are stable (useCallback with [] deps).
 */
const useVoice = () => {
  const announceCountdownStart = useCallback(() => {
    speak(VOICE_MESSAGES.countdownStart)
  }, [])

  const announceStarted = useCallback(() => {
    speak(VOICE_MESSAGES.started)
  }, [])

  const announceStopped = useCallback(() => {
    speak(VOICE_MESSAGES.stopped)
  }, [])

  const announceShutdown = useCallback(() => {
    speak(VOICE_MESSAGES.shutdownWarning)
  }, [])

  return { announceCountdownStart, announceStarted, announceStopped, announceShutdown }
}

export default useVoice
