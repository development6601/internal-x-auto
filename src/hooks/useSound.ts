// ============================================================================
// CONSTANTS
// ============================================================================

const SOUND_URLS = {
  startEnd: '/sound/start-end.mp3',
  secondBeep: '/sound/second-beep.mp3',
} as const

// ============================================================================
// STATE
// ============================================================================

const audioCache = new Map<string, HTMLAudioElement>()

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getAudio = (url: string): HTMLAudioElement => {
  const cached = audioCache.get(url)
  if (cached) return cached

  const audio = new Audio(url)
  audioCache.set(url, audio)
  return audio
}

const playSound = (url: string): void => {
  if (typeof window === 'undefined') return

  try {
    const audio = getAudio(url)
    audio.currentTime = 0
    void audio.play().catch(() => {
      // Autoplay or missing asset — silently skip
    })
  } catch {
    // Audio unavailable — silently skip
  }
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Plays bundled UI sounds for automation start/stop and countdown ticks.
 * Assets live in `resources/sound/` and are copied to `public/sound/` at build time.
 */
const useSound = () => {
  const playStartEnd = (): void => {
    playSound(SOUND_URLS.startEnd)
  }

  const playSecondBeep = (): void => {
    playSound(SOUND_URLS.secondBeep)
  }

  return { playStartEnd, playSecondBeep }
}

export default useSound
