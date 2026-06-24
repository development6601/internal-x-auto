// ============================================================================
// IMPORTS
// ============================================================================

import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type TooltipPlacement = 'auto' | 'top' | 'bottom'

export interface TooltipProps {
  content: ReactNode
  children: ReactNode
  className?: string
  maxWidth?: number
  placement?: TooltipPlacement
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VIEWPORT_MARGIN = 10
const TOOLTIP_GAP = 8
const TOOLTIP_Z_INDEX = 9999

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const computeTooltipPosition = (
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  maxWidth: number,
  placement: TooltipPlacement,
): CSSProperties => {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const tooltipWidth = Math.min(maxWidth, tooltipRect.width || maxWidth)
  const tooltipHeight = tooltipRect.height

  let top =
    placement === 'top'
      ? triggerRect.top - tooltipHeight - TOOLTIP_GAP
      : triggerRect.bottom + TOOLTIP_GAP

  if (placement === 'auto') {
    const fitsBelow =
      triggerRect.bottom + TOOLTIP_GAP + tooltipHeight <= viewportHeight - VIEWPORT_MARGIN
    const fitsAbove = triggerRect.top - TOOLTIP_GAP - tooltipHeight >= VIEWPORT_MARGIN

    if (!fitsBelow && fitsAbove) {
      top = triggerRect.top - tooltipHeight - TOOLTIP_GAP
    } else if (!fitsBelow && !fitsAbove) {
      top = Math.max(
        VIEWPORT_MARGIN,
        Math.min(
          triggerRect.bottom + TOOLTIP_GAP,
          viewportHeight - tooltipHeight - VIEWPORT_MARGIN,
        ),
      )
    }
  }

  top = Math.max(
    VIEWPORT_MARGIN,
    Math.min(top, viewportHeight - tooltipHeight - VIEWPORT_MARGIN),
  )

  let left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2
  left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(left, viewportWidth - tooltipWidth - VIEWPORT_MARGIN),
  )

  return {
    position: 'fixed',
    top,
    left,
    width: maxWidth,
    zIndex: TOOLTIP_Z_INDEX,
    visibility: 'visible',
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Tooltip = ({
  content,
  children,
  className,
  maxWidth = 220,
  placement = 'auto',
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({
    position: 'fixed',
    top: -9999,
    left: -9999,
    width: maxWidth,
    zIndex: TOOLTIP_Z_INDEX,
    visibility: 'hidden',
  })

  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const tooltipId = useId()

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    const tooltip = tooltipRef.current
    if (!trigger || !tooltip) return

    const triggerRect = trigger.getBoundingClientRect()
    const tooltipRect = tooltip.getBoundingClientRect()

    setTooltipStyle(
      computeTooltipPosition(triggerRect, tooltipRect, maxWidth, placement),
    )
  }, [maxWidth, placement])

  const show = useCallback(() => setIsVisible(true), [])
  const hide = useCallback(() => setIsVisible(false), [])

  useLayoutEffect(() => {
    if (!isVisible) return

    updatePosition()
    const frameId = window.requestAnimationFrame(() => updatePosition())

    const handleReposition = () => updatePosition()
    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
    }
  }, [isVisible, updatePosition, content])

  return (
    <>
      <span
        ref={triggerRef}
        className={cn('relative inline-flex items-center', className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <span aria-describedby={isVisible ? tooltipId : undefined}>{children}</span>
      </span>

      {isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            className={cn(
              'px-3 py-2 rounded-editorial bg-editorial-surface',
              'border border-editorial-border shadow-md',
              'font-body text-xs text-editorial-text-secondary leading-relaxed',
              'pointer-events-none whitespace-normal',
            )}
            style={tooltipStyle}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  )
}

export default Tooltip
