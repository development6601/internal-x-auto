// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const formatDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds]
    .map((unit) => String(unit).padStart(2, '0'))
    .join(':')
}

export const parseTimerInput = (value: string): number => {
  const parsed = parseInt(value, 10)
  return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed
}

export const timerToSeconds = (hours: number, minutes: number): number =>
  hours * 3600 + minutes * 60
