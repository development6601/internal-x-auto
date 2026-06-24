// ============================================================================
// IMPORTS
// ============================================================================

import { type HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'running'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: 'bg-editorial-success-bg text-editorial-success',
  warning: 'bg-editorial-warning-bg text-editorial-warning',
  error: 'bg-editorial-error-bg text-editorial-error',
  info: 'bg-editorial-info-bg text-editorial-info',
  neutral: 'bg-editorial-secondary text-editorial-muted',
  running: 'bg-editorial-success-bg text-editorial-success',
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Badge = ({ variant = 'neutral', className, children, ...props }: BadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center font-body text-[11px] font-bold uppercase tracking-badge',
        'rounded-editorial px-2.5 py-[3px]',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export default Badge
