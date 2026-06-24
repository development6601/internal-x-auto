// ============================================================================
// IMPORTS
// ============================================================================

import { useEffect, useCallback, type ReactNode } from 'react'
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
      className="fixed inset-0 z-[400] flex items-center justify-center p-6"
      style={{ background: 'var(--color-bg-overlay)' }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'w-full max-w-[480px] bg-editorial-surface rounded-editorial shadow-modal p-8',
          'transform transition-all duration-350',
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          {eyebrow && (
            <span className="font-body text-[10px] font-bold uppercase tracking-eyebrow text-editorial-muted">
              {eyebrow}
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="ml-auto font-body text-editorial-muted hover:text-editorial-text-primary transition-colors"
          >
            ×
          </button>
        </div>

        <h2
          id="modal-title"
          className="font-display text-2xl font-light text-editorial-text-primary mb-3"
        >
          {title}
        </h2>

        <hr className="border-0 border-t border-editorial-border mb-2.5" />

        {description && (
          <p className="font-body text-[15px] text-editorial-text-secondary leading-relaxed mb-5">
            {description}
          </p>
        )}

        {children}

        {showActions && (
          <div className="flex gap-3 mt-6">
            <Button variant="ghost" className="flex-1" onClick={onClose}>
              {cancelLabel}
            </Button>
            <Button variant="primary" className="flex-[2]" onClick={handleConfirm}>
              {confirmLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
