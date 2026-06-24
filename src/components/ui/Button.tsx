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
    'bg-editorial-primary text-white border-transparent hover:bg-editorial-primary-hover active:bg-editorial-primary-active',
  secondary:
    'bg-transparent text-editorial-primary border-editorial-primary hover:bg-editorial-secondary',
  ghost:
    'bg-transparent text-editorial-muted border-editorial-border hover:bg-editorial-secondary hover:text-editorial-text-primary',
  danger:
    'bg-editorial-error text-white border-transparent hover:opacity-90 active:opacity-80',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'py-2 px-3 sm:px-4 text-[11px] sm:text-xs min-h-[32px] sm:min-h-[34px]',
  base: 'py-2 sm:py-2.5 px-4 sm:px-[22px] text-[11px] sm:text-[13px] min-h-[36px] sm:min-h-[40px]',
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
