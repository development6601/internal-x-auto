// ============================================================================
// IMPORTS
// ============================================================================

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'base'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-editorial-primary text-white border-transparent hover:bg-editorial-primary-hover active:bg-editorial-primary-active shadow-button-primary hover:shadow-[0_4px_18px_rgba(123,45,59,0.38),0_1px_3px_rgba(123,45,59,0.20)]',
  secondary:
    'bg-transparent text-editorial-primary border-editorial-primary hover:bg-editorial-secondary hover:shadow-[0_1px_6px_rgba(123,45,59,0.10)]',
  ghost:
    'bg-transparent text-editorial-muted border-editorial-border hover:bg-editorial-secondary hover:text-editorial-text-primary',
  danger:
    'bg-editorial-error text-white border-transparent hover:opacity-90 active:opacity-80',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'py-2.5 px-4 text-[11px] sm:text-xs min-h-[36px] sm:min-h-[38px]',
  base: 'py-2.5 sm:py-3 px-5 sm:px-6 text-[11px] sm:text-[13px] min-h-[40px] sm:min-h-[44px]',
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'base',
      fullWidth = false,
      className,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-body font-semibold uppercase tracking-button whitespace-nowrap',
          'border-[1.5px] rounded-editorial cursor-pointer',
          'transition-[background-color,color,opacity,transform] duration-200 ease-out',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-editorial-primary focus-visible:outline-offset-2',
          'active:scale-[0.98] active:duration-50',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'

export default Button
