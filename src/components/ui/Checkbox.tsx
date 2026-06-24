// ============================================================================
// IMPORTS
// ============================================================================

import { type InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Checkbox = ({ label, className, id, disabled, checked, onChange, ...props }: CheckboxProps) => {
  const inputId = id ?? `checkbox-${label.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'inline-flex items-start gap-3 cursor-pointer group',
        disabled && 'opacity-40 cursor-not-allowed',
        className,
      )}
    >
      <span className="relative flex-shrink-0 mt-0.5">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <span
          className={cn(
            'block w-4 h-4 rounded-editorial border-[1.5px] border-editorial-border-medium',
            'bg-editorial-surface transition-all duration-200',
            'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-editorial-primary peer-focus-visible:outline-offset-2',
            'peer-checked:bg-editorial-primary peer-checked:border-editorial-primary',
            'group-hover:border-[#c8b8a8]',
            'peer-disabled:bg-editorial-secondary',
          )}
        />
        <svg
          className="absolute top-0.5 left-0.5 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2 6L5 9L10 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="font-body text-sm text-editorial-text-secondary leading-snug select-none">
        {label}
      </span>
    </label>
  )
}

export default Checkbox
