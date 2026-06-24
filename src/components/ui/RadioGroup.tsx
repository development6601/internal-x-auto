// ============================================================================
// IMPORTS
// ============================================================================

import { type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { InfoHint } from './InfoIcon'
import Tooltip from './Tooltip'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface RadioOption<T extends string> {
  value: T
  label: string
  tooltip?: ReactNode
}

export interface RadioGroupProps<T extends string> {
  name: string
  value: T
  options: RadioOption<T>[]
  onChange: (value: T) => void
  disabled?: boolean
  className?: string
  layout?: 'stacked' | 'inline'
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const RadioGroup = <T extends string>({
  name,
  value,
  options,
  onChange,
  disabled = false,
  className,
  layout = 'inline',
}: RadioGroupProps<T>) => {
  return (
    <div
      className={cn(
        layout === 'inline' ? 'flex gap-1' : 'flex flex-col gap-1',
        className,
      )}
      role="radiogroup"
    >
      {options.map((option) => {
        const isSelected = value === option.value
        const inputId = `${name}-${option.value}`

        return (
          <label
            key={option.value}
            htmlFor={inputId}
            className={cn(
              'flex flex-1 items-center justify-center px-2 sm:px-3 py-2 rounded-editorial border cursor-pointer min-w-0',
              'transition-[background-color,border-color] duration-200',
              isSelected
                ? 'bg-editorial-surface border-editorial-primary shadow-input-focus'
                : 'bg-editorial-surface border-editorial-border hover:bg-editorial-secondary',
              disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
            )}
          >
            <input
              id={inputId}
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              disabled={disabled}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span className="inline-flex items-center justify-center gap-1.5 min-w-0">
              <span className="font-body text-xs font-semibold text-editorial-text-primary leading-none truncate">
                {option.label}
              </span>
              {option.tooltip && (
                <Tooltip content={option.tooltip} maxWidth={240}>
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
      })}
    </div>
  )
}

export default RadioGroup
