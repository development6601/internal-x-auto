// ============================================================================
// IMPORTS
// ============================================================================

import { type InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Accessible name when used without a visible label. */
  'aria-label': string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Switch = ({
  className,
  id,
  disabled,
  checked,
  onChange,
  'aria-label': ariaLabel,
  ...props
}: SwitchProps) => {
  const inputId = id ?? `switch-${ariaLabel.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'relative inline-flex flex-shrink-0 items-center',
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
        className,
      )}
    >
      <input
        id={inputId}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-label={ariaLabel}
        className="peer sr-only"
        {...props}
      />
      <span
        className={cn(
          'relative inline-block h-5 w-9 rounded-full border-[1.5px] border-editorial-border-medium',
          'bg-editorial-secondary transition-colors duration-200',
          'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-editorial-primary peer-focus-visible:outline-offset-2',
          'peer-checked:bg-editorial-primary peer-checked:border-editorial-primary',
          disabled && 'peer-disabled:bg-editorial-secondary',
        )}
        aria-hidden
      />
      <span
        className={cn(
          'pointer-events-none absolute top-[3px] left-[3px] h-3.5 w-3.5 rounded-full',
          'bg-editorial-surface shadow-sm transition-transform duration-200',
          'peer-checked:translate-x-4',
        )}
        aria-hidden
      />
    </label>
  )
}

export default Switch
