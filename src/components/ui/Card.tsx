// ============================================================================
// IMPORTS
// ============================================================================

import { type HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'xs' | 'sm' | 'base'
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PADDING_CLASSES = {
  xs: 'p-1',
  sm: 'p-4',
  base: 'p-6',
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Card = ({ padding = 'base', className, children, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        'bg-editorial-surface border border-editorial-border rounded-editorial shadow-card',
        PADDING_CLASSES[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
