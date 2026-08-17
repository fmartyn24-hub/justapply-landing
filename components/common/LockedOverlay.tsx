import { ReactNode } from 'react'

interface LockedOverlayProps {
  children: ReactNode
  active: boolean
  ctaLabel?: string
  onCta?: () => void
  className?: string
}

// Blurs and disables an entire feature (rather than just its buttons) and
// covers it with an upgrade message — used to preview what a free account
// sees when an AI-powered feature is locked. `children` still renders (so
// layout/sizing is preserved) but is blurred and inert underneath.
export function LockedOverlay({ children, active, ctaLabel, onCta, className = '' }: LockedOverlayProps) {
  if (!active) return <>{children}</>

  return (
    <div className={`relative ${className}`}>
      <div className="blur-sm pointer-events-none select-none opacity-60">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center p-6 z-10">
        <div className="bg-navy-900/90 border border-navy-600 rounded-lg px-6 py-5 text-center max-w-xs shadow-lg">
          <p className="text-white font-semibold">This feature is only available for paying users</p>
          {ctaLabel && onCta && (
            <button
              onClick={onCta}
              className="mt-4 px-4 py-2 rounded-lg font-semibold bg-primary text-white hover:bg-blue-700 transition text-sm"
            >
              {ctaLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
