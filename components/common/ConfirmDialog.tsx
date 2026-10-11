import { Button } from './Button'
import { Logo } from './Logo'

interface ConfirmDialogProps {
  isOpen: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// Branded replacement for window.confirm() — used anywhere we need the user
// to confirm a destructive action (deleting an application, a component, etc.)
export function ConfirmDialog({
  isOpen,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
      <div className="bg-navy-800 border border-navy-600 rounded-lg max-w-sm w-full p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Logo className="h-9" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-navy-300 text-sm mt-1">{message}</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg font-semibold border border-navy-600 text-navy-200 hover:bg-navy-700 hover:text-white transition"
          >
            {cancelLabel}
          </button>
          {danger ? (
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 rounded-lg font-semibold bg-red-500/20 border border-red-400/40 text-red-300 hover:bg-red-500/30 transition"
            >
              {confirmLabel}
            </button>
          ) : (
            <Button onClick={onConfirm} className="flex-1">
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
