// ============================================================================
// IMPORTS
// ============================================================================

import { Check } from 'lucide-react'
import { type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { InfoHint } from './InfoIcon'
import Tooltip from './Tooltip'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  tooltip?: ReactNode
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Checkbox = ({
  label,
  tooltip,
  className,
  id,
  disabled,
  checked,
  onChange,
  ...props
}: CheckboxProps) => {
  const inputId = id ?? `checkbox-${label.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'inline-flex items-center gap-2 cursor-pointer group',
        disabled && 'opacity-40 cursor-not-allowed',
        className,
      )}
    >
      <span className="relative flex-shrink-0 inline-flex items-center">
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
        <Check
          size={12}
          strokeWidth={2.5}
          className="absolute top-0.5 left-0.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none"
          aria-hidden
        />
      </span>
      <span className="inline-flex items-center gap-1.5 min-w-0">
        <span className="font-body text-xs font-semibold text-editorial-text-primary leading-none select-none">
          {label}
        </span>
        {tooltip && (
          <Tooltip content={tooltip} maxWidth={240}>
            <span
              className="inline-flex items-center justify-center flex-shrink-0 leading-none"
              onClick={(event) => event.preventDefault()}
            >
              <InfoHint />
            </span>
          </Tooltip>
        )}
      </span>
    </label>
  )
}

export default Checkbox
