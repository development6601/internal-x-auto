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
  success: 'bg-editorial-success-bg text-editorial-success border border-[rgba(45,106,79,0.20)]',
  warning: 'bg-editorial-warning-bg text-editorial-warning border border-[rgba(199,124,44,0.20)]',
  error: 'bg-editorial-error-bg text-editorial-error border border-[rgba(155,35,53,0.20)]',
  info: 'bg-editorial-info-bg text-editorial-info border border-[rgba(44,74,123,0.20)]',
  neutral: 'bg-editorial-secondary text-editorial-muted border border-editorial-border',
  running: 'bg-editorial-success-bg text-editorial-success border border-[rgba(45,106,79,0.20)]',
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
