interface AiLockNoticeProps {
  className?: string
}

// Shown wherever an AI-powered action is disabled (AI is in beta; see lib/aiAccess).
export function AiLockNotice({ className = '' }: AiLockNoticeProps) {
  return (
    <p className={`text-xs text-amber-400 ${className}`}>
      AI features are in beta and not available on your account yet.
    </p>
  )
}
