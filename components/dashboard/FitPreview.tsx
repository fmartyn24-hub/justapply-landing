import { useDeferredValue, useMemo } from 'react'
import {
  matchComponentsToPosting,
  highlightSegments,
  type ComponentMatch,
  type FitStrength,
  type MatchableComponent,
} from '@/lib/componentMatch'

const TYPE_LABELS: Record<string, string> = {
  role: 'Role',
  experience: 'Role',
  achievement: 'Achievement',
  project: 'Project',
  skill: 'Skill',
  kpi: 'KPI',
  education: 'Education',
  certification: 'Certification',
  program: 'Program',
  volunteer: 'Volunteer',
}

const STRENGTH: Record<FitStrength, { label: string; className: string }> = {
  strong: { label: 'Strong fit', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' },
  good: { label: 'Good fit', className: 'bg-blue-500/15 text-blue-300 border-blue-500/40' },
  some: { label: 'Some overlap', className: 'bg-navy-700 text-navy-300 border-navy-600' },
}

const MIN_POSTING_CHARS = 80

interface FitPreviewProps<T extends MatchableComponent> {
  posting: string
  components: T[]
  limit?: number
  compact?: boolean
  // Optional per-match action, e.g. "Insert" in the cover letter editor.
  renderAction?: (match: ComponentMatch<T>) => React.ReactNode
  onAddComponent?: () => void
}

function Highlighted({ text, stems, className = '' }: { text: string; stems: Set<string>; className?: string }) {
  return (
    <span className={className}>
      {highlightSegments(text, stems).map((seg, i) =>
        seg.hit ? (
          <mark key={i} className="bg-primary/25 text-white rounded px-0.5">
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </span>
  )
}

// Free, no-AI preview of how the user's career library fits a job posting:
// the components that fit best (and the shared words that prove it), plus the
// posting's keywords with what the library does and doesn't cover yet.
export function FitPreview<T extends MatchableComponent>({
  posting,
  components,
  limit = 5,
  compact = false,
  renderAction,
  onAddComponent,
}: FitPreviewProps<T>) {
  // Matching runs on every keystroke while pasting/typing; let React defer it.
  const deferredPosting = useDeferredValue(posting)
  const result = useMemo(
    () => matchComponentsToPosting(deferredPosting, components),
    [deferredPosting, components]
  )

  const libraryCount = components.filter((c) => c.type !== 'voice' && c.type !== 'context').length

  if (libraryCount === 0) {
    return (
      <div className="rounded-xl border border-dashed border-navy-600 p-5 text-sm text-navy-300 space-y-3">
        <p className="font-medium text-white">See which parts of your story fit</p>
        <p>
          Add roles, projects and achievements to your library, and we&apos;ll show which ones match each job you
          paste here.
        </p>
        {onAddComponent && (
          <button onClick={onAddComponent} className="text-blue-400 font-semibold hover:underline">
            Add your first component
          </button>
        )}
      </div>
    )
  }

  if (posting.trim().length < MIN_POSTING_CHARS) {
    return (
      <div className="rounded-xl border border-dashed border-navy-600 p-5 text-sm text-navy-300 space-y-2">
        <p className="font-medium text-white">How your library fits this job</p>
        <p>
          Paste the job description and we&apos;ll show which of your {libraryCount} components fit it best, and
          which of the employer&apos;s keywords you haven&apos;t covered yet.
        </p>
      </div>
    )
  }

  const top = result.matches.slice(0, limit)
  const covered = result.keywords.filter((k) => k.covered)
  const gaps = result.keywords.filter((k) => !k.covered)

  return (
    <div className={`rounded-xl border border-navy-600 bg-navy-800 ${compact ? 'p-4' : 'p-5'} space-y-5`}>
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-semibold text-white">How your library fits this job</h3>
          {result.keywords.length > 0 && (
            <span className="text-xs text-navy-400 flex-shrink-0">
              {covered.length} of {result.keywords.length} keywords covered
            </span>
          )}
        </div>
        {result.keywords.length > 0 && (
          <div className="mt-3 h-1.5 rounded-full bg-navy-700 overflow-hidden" aria-hidden="true">
            <div
              className="h-full bg-emerald-400/80 transition-all"
              style={{ width: `${(covered.length / result.keywords.length) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Best-fit components */}
      {top.length === 0 ? (
        <p className="text-sm text-navy-300">
          Nothing in your library shares words with this posting yet. Look at the keywords below: if you&apos;ve done
          any of it, add it as a component.
        </p>
      ) : (
        <ol className="space-y-3">
          {top.map((m, i) => (
            <li key={m.component.id} className="rounded-lg border border-navy-700 bg-navy-900 p-3">
              <div className="flex items-start gap-3">
                <span className="text-xs font-semibold text-navy-400 mt-0.5 w-4 flex-shrink-0">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-navy-400">
                      {TYPE_LABELS[m.component.type] || m.component.type}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wide border rounded-full px-2 py-0.5 ${STRENGTH[m.strength].className}`}
                    >
                      {STRENGTH[m.strength].label}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white mt-1">
                    <Highlighted text={m.component.title} stems={m.matchedStems} />
                    {m.component.organization_name && (
                      <span className="text-navy-400 font-normal"> · {m.component.organization_name}</span>
                    )}
                  </p>
                  {!compact && (m.component.impact_metrics || m.component.description) && (
                    <p className="text-xs text-navy-300 mt-1 line-clamp-2">
                      <Highlighted
                        text={m.component.impact_metrics || m.component.description || ''}
                        stems={m.matchedStems}
                      />
                    </p>
                  )}
                  <p className="text-xs text-navy-400 mt-1.5">
                    Matches the posting on{' '}
                    <span className="text-navy-200">{m.matchedWords.slice(0, compact ? 3 : 5).join(', ')}</span>
                  </p>
                </div>
                {renderAction && <div className="flex-shrink-0">{renderAction(m)}</div>}
              </div>
            </li>
          ))}
        </ol>
      )}

      {/* Keyword coverage */}
      {result.keywords.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-400 mb-2">Keywords in this posting</p>
          <div className="flex flex-wrap gap-1.5">
            {result.keywords.map((k) => (
              <span
                key={k.stem}
                title={k.covered ? 'Covered by your library' : 'Not in your library yet'}
                className={`text-xs rounded-full px-2.5 py-1 border ${
                  k.covered
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'border-dashed border-navy-500 text-navy-300'
                }`}
              >
                {k.covered ? '✓ ' : ''}
                {k.word}
              </span>
            ))}
          </div>
          {gaps.length > 0 && !compact && (
            <p className="text-xs text-navy-400 mt-3">
              Not covered yet: <span className="text-navy-200">{gaps.slice(0, 5).map((g) => g.word).join(', ')}</span>.
              If you have experience with these, add it to your library so it shows up next time.
              {onAddComponent && (
                <>
                  {' '}
                  <button onClick={onAddComponent} className="text-blue-400 font-semibold hover:underline">
                    Add a component
                  </button>
                </>
              )}
            </p>
          )}
        </div>
      )}

      <p className="text-[11px] text-navy-500">
        Based on shared words between the posting and your library. AI match analysis, which understands meaning
        and not just words, is coming soon.
      </p>
    </div>
  )
}
