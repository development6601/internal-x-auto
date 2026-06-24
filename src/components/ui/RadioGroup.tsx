// ============================================================================
// IMPORTS
// ============================================================================

import { cn } from '@/utils/cn'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface RadioOption<T extends string> {
  value: T
  label: string
  description?: string
}

export interface RadioGroupProps<T extends string> {
  name: string
  value: T
  options: RadioOption<T>[]
  onChange: (value: T) => void
  disabled?: boolean
  className?: string
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
}: RadioGroupProps<T>) => {
  return (
    <div className={cn('flex flex-col gap-2', className)} role="radiogroup">
      {options.map((option) => {
        const isSelected = value === option.value
        const inputId = `${name}-${option.value}`

        return (
          <label
            key={option.value}
            htmlFor={inputId}
            className={cn(
              'flex items-start gap-3 p-4 rounded-editorial border cursor-pointer',
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
            <span
              className={cn(
                'flex-shrink-0 w-4 h-4 mt-0.5 rounded-full border-[1.5px] flex items-center justify-center',
                isSelected ? 'border-editorial-primary' : 'border-editorial-border-medium',
              )}
            >
              {isSelected && (
                <span className="w-2 h-2 rounded-full bg-editorial-primary" />
              )}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-body text-sm font-semibold text-editorial-text-primary">
                {option.label}
              </span>
              {option.description && (
                <span className="font-body text-xs text-editorial-muted leading-relaxed">
                  {option.description}
                </span>
              )}
            </span>
          </label>
        )
      })}
    </div>
  )
}

export default RadioGroup
