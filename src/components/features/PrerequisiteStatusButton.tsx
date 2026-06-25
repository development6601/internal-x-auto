// ============================================================================
// IMPORTS
// ============================================================================

import { Package } from 'lucide-react'
import { Tooltip } from '@/components/ui'
import type { PrerequisiteStatus } from '@/types/prerequisites.types'
import { cn } from '@/utils/cn'
import {
  PREREQUISITE_CHECKING_TOOLTIP,
  PREREQUISITE_INSTALLING_TOOLTIP,
  PREREQUISITE_MISSING_TOOLTIP,
  PREREQUISITE_NO_PYTHON_TOOLTIP,
  PREREQUISITE_READY_TOOLTIP,
} from '@/constants/app.constants'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PrerequisiteStatusButtonProps {
  status: PrerequisiteStatus
  onInstall: () => void
  disabled?: boolean
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getTooltipContent = (status: PrerequisiteStatus): string => {
  if (status === 'ready') return PREREQUISITE_READY_TOOLTIP
  if (status === 'checking') return PREREQUISITE_CHECKING_TOOLTIP
  if (status === 'installing') return PREREQUISITE_INSTALLING_TOOLTIP
  if (status === 'no_python') return PREREQUISITE_NO_PYTHON_TOOLTIP
  return PREREQUISITE_MISSING_TOOLTIP
}

const isSignalVisible = (status: PrerequisiteStatus): boolean => {
  return status === 'ready' || status === 'missing' || status === 'no_python'
}

const isSignalReady = (status: PrerequisiteStatus): boolean => {
  return status === 'ready'
}

const isClickable = (status: PrerequisiteStatus, disabled: boolean): boolean => {
  if (disabled) return false
  return status === 'missing'
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const PrerequisiteStatusButton = ({
  status,
  onInstall,
  disabled = false,
}: PrerequisiteStatusButtonProps) => {
  const tooltipContent = getTooltipContent(status)
  const signalVisible = isSignalVisible(status)
  const signalReady = isSignalReady(status)
  const clickable = isClickable(status, disabled)
  const isBusy = status === 'checking' || status === 'installing'

  const handleClick = () => {
    if (!clickable) return
    onInstall()
  }

  const buttonClassName = cn(
    'relative inline-flex items-center justify-center w-8 h-8 rounded-editorial border-[1.5px]',
    'transition-colors duration-150',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-editorial-primary focus-visible:outline-offset-2',
    status === 'ready' &&
      'border-editorial-success bg-editorial-success-bg text-editorial-success',
    (status === 'missing' || status === 'no_python') &&
      'border-editorial-error bg-editorial-error-bg text-editorial-error',
    isBusy &&
      'border-editorial-border text-editorial-muted cursor-wait',
    clickable && 'hover:opacity-90 cursor-pointer',
    !clickable && !isBusy && 'cursor-default',
    disabled && 'opacity-50 cursor-not-allowed',
  )

  const signalClassName = cn(
    'absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ring-1 ring-editorial-surface',
    signalReady ? 'bg-editorial-success' : 'bg-editorial-error',
  )

  return (
    <Tooltip content={tooltipContent} maxWidth={200} placement="bottom">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isBusy || !clickable}
        aria-label="Python requirements status"
        aria-busy={isBusy}
        className={buttonClassName}
      >
        <Package size={16} strokeWidth={2} />
        {signalVisible && <span className={signalClassName} aria-hidden="true" />}
      </button>
    </Tooltip>
  )
}

export default PrerequisiteStatusButton
