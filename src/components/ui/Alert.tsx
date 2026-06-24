// ============================================================================
// IMPORTS
// ============================================================================

import { type HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type AlertVariant = 'warning' | 'error' | 'info' | 'success'

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant
  title?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  warning: 'bg-editorial-warning-bg border-editorial-warning text-editorial-warning',
  error: 'bg-editorial-error-bg border-editorial-error text-editorial-error',
  info: 'bg-editorial-info-bg border-editorial-info text-editorial-info',
  success: 'bg-editorial-success-bg border-editorial-success text-editorial-success',
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Alert = ({ variant = 'warning', title, className, children, ...props }: AlertProps) => {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-editorial border px-4 py-3',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {title && (
        <p className="font-body text-xs font-bold uppercase tracking-label mb-1">
          {title}
        </p>
      )}
      <p className="font-body text-sm leading-relaxed text-editorial-text-secondary">
        {children}
      </p>
    </div>
  )
}

export default Alert
