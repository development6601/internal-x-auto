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
              'relative flex flex-1 items-center justify-center px-2 sm:px-3 py-2.5 rounded-editorial border cursor-pointer min-w-0 overflow-hidden',
              'transition-[background-color,border-color,box-shadow] duration-200',
              isSelected
                ? 'bg-[rgba(123,45,59,0.04)] border-editorial-primary shadow-input-focus'
                : 'bg-editorial-surface border-editorial-border hover:bg-editorial-secondary hover:border-[#c0a898]',
              disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
            )}
          >
            {/* {isSelected && (
              <span className="absolute left-0 inset-y-0 w-[3px] bg-editorial-primary rounded-r-full" aria-hidden />
            )} */}
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
              <span
                className={cn(
                  'font-body text-xs font-semibold leading-none truncate transition-colors duration-200',
                  isSelected ? 'text-editorial-primary' : 'text-editorial-text-primary',
                )}
              >
                {option.label}
              </span>
              {option.tooltip && (
                <Tooltip content={option.tooltip} maxWidth={240}>
                  <span
                    className="flex items-center justify-center flex-shrink-0 leading-none h-full min-h-[20px]"
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
