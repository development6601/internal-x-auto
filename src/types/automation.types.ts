// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type AutomationStatus = 'stopped' | 'running' | 'countdown' | 'error'

export type AutomationMode = 'basic' | 'advanced'

export interface AutomationConfig {
  mode: AutomationMode
  timerHours: number
  timerMinutes: number
  closeTracker: boolean
  shutdown: boolean
}
