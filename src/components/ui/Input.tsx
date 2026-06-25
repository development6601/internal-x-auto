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
          'bg-editorial-surface border border-editorial-border rounded-editorial',
          'px-4 py-2.5 outline-none',
          'transition-[border-color,box-shadow,background-color] duration-200 ease-out',
          'placeholder:text-editorial-disabled',
          'hover:border-[#c0a898] hover:bg-[#fffdf9]',
          'focus:border-editorial-primary focus:shadow-input-focus focus:bg-editorial-surface',
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
