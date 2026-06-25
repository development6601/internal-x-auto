// ============================================================================
// IMPORTS
// ============================================================================

import { type HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SectionLabelProps extends HTMLAttributes<HTMLDivElement> {
  bordered?: boolean
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const SECTION_TITLE_CLASS =
  'font-body text-[11px] font-bold uppercase tracking-eyebrow text-editorial-muted'

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SectionLabel = ({
  className,
  children,
  bordered = true,
  ...props
}: SectionLabelProps) => {
  return (
    <div
      className={cn(
        SECTION_TITLE_CLASS,
        bordered && 'border-b border-editorial-border pb-2 mb-5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default SectionLabel
