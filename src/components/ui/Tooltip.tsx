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

interface PositionResult {
  style: CSSProperties
  /** Pixel offset of the arrow div from the tooltip's left edge. */
  arrowLeft: number
  /** True when the tooltip is rendered above the trigger (arrow at bottom). */
  isAbove: boolean
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VIEWPORT_MARGIN = 10
const TOOLTIP_GAP = 10
const TOOLTIP_Z_INDEX = 9999
const ARROW_SIZE = 12
const ARROW_HALF = ARROW_SIZE / 2

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const computeTooltipPosition = (
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  maxWidth: number,
  placement: TooltipPlacement,
): PositionResult => {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const tooltipWidth = Math.min(maxWidth, tooltipRect.width || maxWidth)
  const tooltipHeight = tooltipRect.height

  let isAbove = false
  let top: number

  if (placement === 'top') {
    top = triggerRect.top - tooltipHeight - TOOLTIP_GAP
    isAbove = true
  } else if (placement === 'bottom') {
    top = triggerRect.bottom + TOOLTIP_GAP
    isAbove = false
  } else {
    const fitsBelow =
      triggerRect.bottom + TOOLTIP_GAP + tooltipHeight <= viewportHeight - VIEWPORT_MARGIN
    const fitsAbove =
      triggerRect.top - TOOLTIP_GAP - tooltipHeight >= VIEWPORT_MARGIN

    if (!fitsBelow && fitsAbove) {
      top = triggerRect.top - tooltipHeight - TOOLTIP_GAP
      isAbove = true
    } else if (!fitsBelow && !fitsAbove) {
      top = Math.max(
        VIEWPORT_MARGIN,
        Math.min(
          triggerRect.bottom + TOOLTIP_GAP,
          viewportHeight - tooltipHeight - VIEWPORT_MARGIN,
        ),
      )
      isAbove = false
    } else {
      top = triggerRect.bottom + TOOLTIP_GAP
      isAbove = false
    }
  }

  top = Math.max(VIEWPORT_MARGIN, Math.min(top, viewportHeight - tooltipHeight - VIEWPORT_MARGIN))

  const rawLeft = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2
  const clampedLeft = Math.max(
    VIEWPORT_MARGIN,
    Math.min(rawLeft, viewportWidth - tooltipWidth - VIEWPORT_MARGIN),
  )

  const triggerCenter = triggerRect.left + triggerRect.width / 2
  const rawArrowLeft = triggerCenter - clampedLeft - ARROW_HALF
  const arrowLeft = Math.max(8, Math.min(rawArrowLeft, tooltipWidth - ARROW_SIZE - 8))

  return {
    style: {
      position: 'fixed',
      top,
      left: clampedLeft,
      width: maxWidth,
      zIndex: TOOLTIP_Z_INDEX,
      visibility: 'visible',
    },
    arrowLeft,
    isAbove,
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
  const [pos, setPos] = useState<PositionResult>({
    style: {
      position: 'fixed',
      top: -9999,
      left: -9999,
      width: maxWidth,
      zIndex: TOOLTIP_Z_INDEX,
      visibility: 'hidden',
    },
    arrowLeft: 0,
    isAbove: false,
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

    setPos(computeTooltipPosition(triggerRect, tooltipRect, maxWidth, placement))
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
            style={pos.style}
          >
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: pos.arrowLeft,
                width: ARROW_SIZE,
                height: ARROW_SIZE,
                background: 'var(--color-bg-surface)',
                transform: 'rotate(45deg)',
                zIndex: 1,
                ...(pos.isAbove
                  ? {
                      bottom: -(ARROW_HALF - 1),
                      borderRight: '1px solid var(--color-border-light)',
                      borderBottom: '1px solid var(--color-border-light)',
                    }
                  : {
                      top: -(ARROW_HALF - 1),
                      borderLeft: '1px solid var(--color-border-light)',
                      borderTop: '1px solid var(--color-border-light)',
                    }),
              }}
            />
            {content}
          </div>,
          document.body,
        )}
    </>
  )
}

export default Tooltip
