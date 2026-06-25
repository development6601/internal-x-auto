// ============================================================================
// IMPORTS
// ============================================================================

import { AlertTriangle, Info } from 'lucide-react'
import { type HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface InfoHintProps extends HTMLAttributes<HTMLSpanElement> {}

export interface WarningHintProps extends HTMLAttributes<HTMLSpanElement> {}

// ============================================================================
// MAIN COMPONENTS
// ============================================================================

export const InfoHint = ({ className, ...props }: InfoHintProps) => {
  return (
    <span
      className={cn('inline-flex items-center text-editorial-muted', className)}
      aria-hidden
      {...props}
    >
      <Info size={14} strokeWidth={2} />
    </span>
  )
}

export const WarningHint = ({ className, ...props }: WarningHintProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center flex-shrink-0',
        'w-6 h-6 rounded-editorial border-[1.5px]',
        'border-editorial-warning/50 bg-editorial-warning-bg text-editorial-warning',
        className,
      )}
      {...props}
    >
      <AlertTriangle size={12} strokeWidth={2} />
    </span>
  )
}
