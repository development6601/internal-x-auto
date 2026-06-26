// ============================================================================
// CONSTANTS
// ============================================================================

const FALLBACK_SOUND_URLS = {
  startEnd: `${import.meta.env.BASE_URL}sound/start-end.mp3`,
  secondBeep: `${import.meta.env.BASE_URL}sound/second-beep.mp3`,
}

type SoundUrlMap = { startEnd: string; secondBeep: string }

// ============================================================================
// STATE
// ============================================================================

const audioCache = new Map<string, HTMLAudioElement>()

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getSoundUrls = (): SoundUrlMap => {
  const resolved = window.electronAPI?.sound?.urls
  if (resolved?.startEnd && resolved?.secondBeep) return resolved
  return FALLBACK_SOUND_URLS
}

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
 * Preload resolves file:// URLs from extraResources in packaged builds.
 */
const useSound = () => {
  const playStartEnd = (): void => {
    playSound(getSoundUrls().startEnd)
  }

  const playSecondBeep = (): void => {
    playSound(getSoundUrls().secondBeep)
  }

  return { playStartEnd, playSecondBeep }
}

export default useSound
