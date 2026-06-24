// ============================================================================
// IMPORTS
// ============================================================================

import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError = false, disabled, ...props }, ref) => {
    return (
      <input
        ref={ref}
        disabled={disabled}
        className={cn(
          'w-full font-body text-sm text-editorial-text-primary',
          'bg-editorial-surface border-[1.5px] rounded-editorial',
          'px-3.5 py-2.5 outline-none',
          'transition-[border-color,box-shadow] duration-200 ease-out',
          'placeholder:text-editorial-muted',
          'hover:border-[#c8b8a8]',
          'focus:border-editorial-primary focus:shadow-input-focus',
          'focus-visible:outline-none',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-editorial-secondary',
          hasError && 'border-editorial-error focus:border-editorial-error focus:shadow-none',
          className,
        )}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'

export default Input
