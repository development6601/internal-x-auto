// ============================================================================
// IMPORTS
// ============================================================================

import { useCallback, useEffect, useState } from 'react'
import type { PrerequisiteStatus, PrerequisitesCheckResult } from '@/types/prerequisites.types'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UsePrerequisitesOptions {
  onInstallSuccess?: () => void
  onInstallFailure?: (message: string) => void
}

interface UsePrerequisitesReturn {
  status: PrerequisiteStatus
  isReady: boolean
  install: () => Promise<void>
  recheck: () => Promise<void>
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const hasElectronPrerequisites = (): boolean => {
  return typeof window !== 'undefined' && window.electronAPI?.prerequisites !== undefined
}

const mapCheckToStatus = (result: PrerequisitesCheckResult): PrerequisiteStatus => {
  if (!result.pythonFound) return 'no_python'
  if (result.ready) return 'ready'
  return 'missing'
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const usePrerequisites = (options: UsePrerequisitesOptions = {}): UsePrerequisitesReturn => {
  const { onInstallSuccess, onInstallFailure } = options

  const [status, setStatus] = useState<PrerequisiteStatus>('checking')

  const recheck = useCallback(async () => {
    if (!hasElectronPrerequisites()) {
      setStatus('missing')
      return
    }

    setStatus('checking')
    const result = await window.electronAPI!.prerequisites.check()
    setStatus(mapCheckToStatus(result))
  }, [])

  const install = useCallback(async () => {
    if (!hasElectronPrerequisites()) return
    if (status === 'ready' || status === 'installing' || status === 'checking') return

    setStatus('installing')
    const result = await window.electronAPI!.prerequisites.install()

    if (result.success) {
      setStatus('ready')
      onInstallSuccess?.()
      return
    }

    const errorMessage = result.error ?? 'Failed to install Python requirements.'
    setStatus('missing')
    onInstallFailure?.(errorMessage)
  }, [status, onInstallSuccess, onInstallFailure])

  useEffect(() => {
    void recheck()
  }, [recheck])

  const isReady = status === 'ready'

  return {
    status,
    isReady,
    install,
    recheck,
  }
}

export default usePrerequisites
