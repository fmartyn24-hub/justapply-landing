import { ReactNode } from 'react'

interface LockedOverlayProps {
  children: ReactNode
  active: boolean
  title?: string
  pitch?: string
  bullets?: string[]
  ctaLabel?: string
  onCta?: () => void
  className?: string
}

function AiBoltIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
      <path d="M13 2 3 14h7l-1 8 11-14h-7l0-6Z" />
    </svg>
  )
}

// Blurs and disables an entire feature (rather than just its buttons) and
// covers it with an upgrade pitch — used to preview what a free account
// sees when an AI-powered feature is locked. `children` still renders (so
// layout/sizing is preserved) but is blurred and inert underneath. Sells
// what the paid plan actually does, not just that it's locked.
export function LockedOverlay({
  children,
  active,
  title = "This feature is only available for paying users",
  pitch,
  bullets,
  ctaLabel,
  onCta,
  className = '',
}: LockedOverlayProps) {
  if (!active) return <>{children}</>

  return (
    <div className={`relative ${className}`}>
      <div className="blur-sm pointer-events-none select-none opacity-60">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center p-6 z-10">
        <div className="bg-navy-900/95 border border-navy-600 rounded-lg px-7 py-6 text-center max-w-sm shadow-lg space-y-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-primary/20 text-blue-300 border border-primary/40">
            <AiBoltIcon />
            AI Powered
          </span>
          <p className="text-white font-semibold">{title}</p>
          {pitch && <p className="text-sm text-navy-300">{pitch}</p>}
          {bullets && bullets.length > 0 && (
            <ul className="text-sm text-navy-200 text-left space-y-1.5 pt-1">
              {bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="text-blue-400 flex-shrink-0">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
          {ctaLabel && onCta && (
            <button
              onClick={onCta}
              className="w-full mt-2 px-4 py-2 rounded-lg font-semibold bg-primary text-white hover:bg-blue-700 transition text-sm"
            >
              {ctaLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
