import { Button } from './Button'
import { Logo } from './Logo'

interface NoticeModalProps {
  isOpen: boolean
  message: string
  variant?: 'success' | 'error' | 'info'
  onClose: () => void
}

// Branded replacement for window.alert() — success/error/info messages shown
// as a centered, justapply-branded popup instead of the browser's native one.
export function NoticeModal({ isOpen, message, variant = 'info', onClose }: NoticeModalProps) {
  if (!isOpen) return null

  const icon = variant === 'success' ? '✓' : variant === 'error' ? '!' : 'i'
  const iconColor =
    variant === 'success'
      ? 'bg-green-500/20 text-green-400 border-green-400/40'
      : variant === 'error'
      ? 'bg-red-500/20 text-red-400 border-red-400/40'
      : 'bg-primary/20 text-blue-300 border-primary/40'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
      <div className="bg-navy-800 border border-navy-600 rounded-lg max-w-sm w-full p-6 space-y-4 text-center">
        <Logo className="h-9 mx-auto" />
        <div className={`w-10 h-10 rounded-full border flex items-center justify-center mx-auto font-bold ${iconColor}`}>
          {icon}
        </div>
        <p className="text-white text-sm">{message}</p>
        <Button onClick={onClose} className="w-full">
          OK
        </Button>
      </div>
    </div>
  )
}
