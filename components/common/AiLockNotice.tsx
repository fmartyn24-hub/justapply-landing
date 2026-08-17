interface AiLockNoticeProps {
  className?: string
}

// Shown wherever an AI-powered action is disabled because the admin is
// previewing the app as a free account (see DashboardShell's plan toggle).
export function AiLockNotice({ className = '' }: AiLockNoticeProps) {
  return (
    <p className={`text-xs text-amber-400 ${className}`}>
      AI features are on the paid plan — you're previewing as a free account.
    </p>
  )
}
