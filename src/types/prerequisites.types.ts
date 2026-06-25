// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type PrerequisiteStatus = 'checking' | 'ready' | 'missing' | 'no_python' | 'installing'

export interface PrerequisitesCheckResult {
  ready: boolean
  pythonFound: boolean
  pythonBin?: string
  missingModules: string[]
  message?: string
}

export interface PrerequisitesInstallResult {
  success: boolean
  error?: string
}
