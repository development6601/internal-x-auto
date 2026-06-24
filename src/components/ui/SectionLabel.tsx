// ============================================================================
// IMPORTS
// ============================================================================

import { type HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SectionLabelProps extends HTMLAttributes<HTMLDivElement> {}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SectionLabel = ({ className, children, ...props }: SectionLabelProps) => {
  return (
    <div
      className={cn(
        'font-body text-[10px] font-bold uppercase tracking-eyebrow text-editorial-muted',
        'border-b border-editorial-border pb-2 mb-5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default SectionLabel
