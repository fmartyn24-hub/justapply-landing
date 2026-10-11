import { useEffect, useState } from 'react'
import { track } from '@vercel/analytics'
import { useAuth } from '@/lib/context/AuthContext'

// The AI features we're validating demand for while they're locked. Keys are
// stored in the ai_feature_interest table, so treat them as stable IDs.
export type AiFeatureKey = 'import' | 'match_analysis' | 'cover_letter' | 'cv_advice'

type Answer = 'yes' | 'maybe' | 'no'

const ANSWERS: { value: Answer; label: string }[] = [
  { value: 'yes', label: "Yes, I'd use this" },
  { value: 'maybe', label: 'Maybe' },
  { value: 'no', label: 'Not for me' },
]

const storageKey = (feature: AiFeatureKey) => `justapply-ai-interest-${feature}`

export function AiBoltIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0" aria-hidden="true">
      <path d="M13 2 3 14h7l-1 8 11-14h-7l0-6Z" />
    </svg>
  )
}

export function AiBetaBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-primary/20 text-blue-300 border border-primary/40">
      <AiBoltIcon size={10} />
      AI · Coming soon
    </span>
  )
}

// Asks "would you use this?" for a locked AI feature and records the answer
// (Supabase via /api/ai-interest, plus a Vercel Analytics event). Remembers the
// answer locally so the same person isn't asked twice for the same feature.
export function AiInterestPrompt({ feature, compact = false }: { feature: AiFeatureKey; compact?: boolean }) {
  const { session } = useAuth()
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [comment, setComment] = useState('')
  const [stage, setStage] = useState<'ask' | 'comment' | 'done'>('ask')

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey(feature))
      if (stored) setStage('done')
    } catch {
      // Storage unavailable (private mode etc.) — just ask again.
    }
  }, [feature])

  const send = async (value: Answer, text?: string) => {
    try {
      window.localStorage.setItem(storageKey(feature), value)
    } catch {}
    if (!text) track('AI Interest', { feature, answer: value })
    if (!session?.access_token) return
    try {
      await fetch('/api/ai-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ feature, answer: value, comment: text || null }),
      })
    } catch {
      // Feedback is best-effort; never block the user on it.
    }
  }

  const choose = (value: Answer) => {
    setAnswer(value)
    setStage('comment')
    send(value)
  }

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (answer && comment.trim()) send(answer, comment.trim())
    setStage('done')
  }

  if (stage === 'done') {
    return (
      <p className="text-sm text-navy-300">
        Thanks, noted. We&apos;ll let you know when this is ready.
      </p>
    )
  }

  if (stage === 'comment') {
    return (
      <form onSubmit={submitComment} className="space-y-2">
        <label htmlFor={`ai-comment-${feature}`} className="block text-sm text-navy-200">
          {answer === 'no' ? 'What would make it useful to you?' : 'What would you most want it to do?'}{' '}
          <span className="text-navy-400">(optional)</span>
        </label>
        <textarea
          id={`ai-comment-${feature}`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          maxLength={1000}
          className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-sm text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="e.g. I'd want it to keep my own phrasing"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-blue-700 transition"
          >
            {comment.trim() ? 'Send' : 'Done'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-2">
      <p className={`font-medium text-white ${compact ? 'text-sm' : ''}`}>Would you use this?</p>
      <div className="flex flex-wrap gap-2">
        {ANSWERS.map((a) => (
          <button
            key={a.value}
            type="button"
            onClick={() => choose(a.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
              a.value === 'yes'
                ? 'bg-primary border-primary text-white hover:bg-blue-700'
                : 'border-navy-600 text-navy-200 hover:bg-navy-700 hover:text-white'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}

interface AiFeatureTeaserProps {
  feature: AiFeatureKey
  title: string
  pitch: string
  bullets?: string[]
  className?: string
}

// Shown in place of an AI feature while AI is in beta. Sells what the feature
// would do (instead of blurring a fake UI) and asks whether the person would
// use it, so locked features double as demand research.
export function AiFeatureTeaser({ feature, title, pitch, bullets, className = '' }: AiFeatureTeaserProps) {
  return (
    <div className={`rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6 space-y-4 ${className}`}>
      <AiBetaBadge />
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-navy-300 mt-1">{pitch}</p>
      </div>
      {bullets && bullets.length > 0 && (
        <ul className="text-sm text-navy-200 space-y-1.5">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="text-blue-400 flex-shrink-0">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="pt-1 border-t border-navy-700/60">
        <div className="pt-4">
          <AiInterestPrompt feature={feature} />
        </div>
      </div>
    </div>
  )
}
