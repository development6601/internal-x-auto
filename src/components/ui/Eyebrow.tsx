// ============================================================================
// IMPORTS
// ============================================================================

import { type HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface EyebrowProps extends HTMLAttributes<HTMLSpanElement> {}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Eyebrow = ({ className, children, ...props }: EyebrowProps) => {
  return (
    <span
      className={cn(
        'block font-body text-[10px] font-bold uppercase tracking-[0.2em] text-editorial-muted',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export default Eyebrow
