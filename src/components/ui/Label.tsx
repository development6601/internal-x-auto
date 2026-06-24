// ============================================================================
// IMPORTS
// ============================================================================

import { type LabelHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Label = ({ className, children, required = false, ...props }: LabelProps) => {
  return (
    <label
      className={cn(
        'block font-body text-[11px] font-bold uppercase tracking-label text-editorial-muted mb-1.5',
        className,
      )}
      {...props}
    >
      {children}
      {required && <span className="text-editorial-primary ml-0.5">*</span>}
    </label>
  )
}

export default Label
