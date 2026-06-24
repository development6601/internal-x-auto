// ============================================================================
// IMPORTS
// ============================================================================

import { useEffect, useCallback, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import Button from './Button'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  eyebrow?: string
  description?: string
  children?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  showActions?: boolean
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Modal = ({
  isOpen,
  onClose,
  title,
  eyebrow,
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  showActions = true,
}: ModalProps) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (!isOpen) return

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm?.()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'var(--color-bg-overlay)' }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'w-full max-w-[min(480px,100%)] bg-editorial-surface rounded-editorial shadow-modal',
          'p-5 sm:p-8 transform transition-all duration-350',
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          {eyebrow ? (
            <span className="font-body text-[10px] font-bold uppercase tracking-eyebrow text-editorial-muted pt-1">
              {eyebrow}
            </span>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className={cn(
              'inline-flex items-center justify-center flex-shrink-0',
              'w-9 h-9 rounded-editorial',
              'text-editorial-muted hover:text-editorial-text-primary hover:bg-editorial-secondary',
              'transition-colors duration-150',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-editorial-primary focus-visible:outline-offset-2',
            )}
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <h2
          id="modal-title"
          className="font-display text-xl sm:text-2xl font-light text-editorial-text-primary mb-3"
        >
          {title}
        </h2>

        <hr className="border-0 border-t border-editorial-border mb-2.5" />

        {description && (
          <p className="font-body text-sm sm:text-[15px] text-editorial-text-secondary leading-relaxed mb-5">
            {description}
          </p>
        )}

        {children}

        {showActions && (
          <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3 mt-6">
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              className="sm:flex-1 whitespace-nowrap"
              onClick={onClose}
            >
              {cancelLabel}
            </Button>
            <Button
              variant="primary"
              size="sm"
              fullWidth
              className="sm:flex-[2] whitespace-nowrap"
              onClick={handleConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
