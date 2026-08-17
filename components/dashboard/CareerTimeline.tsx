import { useMemo } from 'react'

interface TimelineComponent {
  id: string
  type: string
  title: string
  organization_name?: string
  description?: string
  start_date?: string
  end_date?: string
  impact_metrics?: string
  primary_location?: string
  tags: string[]
  created_at: string
}

interface CareerTimelineProps {
  components: TimelineComponent[]
  expandedRole?: TimelineComponent | null
  onRoleClick?: (role: TimelineComponent | null) => void
}

// Types shown on the timeline — not just jobs. Icon shown on non-role
// entries so the timeline reads as a full career + education story.
const TIMELINE_TYPES: Record<string, { icon: string; label: string }> = {
  role: { icon: '💼', label: 'Role' },
  education: { icon: '🎓', label: 'Education' },
  certification: { icon: '📜', label: 'Certification' },
  program: { icon: '🚀', label: 'Program' },
  volunteer: { icon: '🤝', label: 'Volunteer' },
}

function sortByDateDesc(entries: TimelineComponent[]): TimelineComponent[] {
  return [...entries].sort((a, b) => {
    const dateA = a.start_date ? new Date(a.start_date).getTime() : 0
    const dateB = b.start_date ? new Date(b.start_date).getTime() : 0
    return dateB - dateA // Most recent first
  })
}

// Parse a 4-digit year straight from a "YYYY-MM-DD" string to avoid timezone
// off-by-one errors with Date().
function getYear(date?: string): string | null {
  return date && /^\d{4}/.test(date) ? date.slice(0, 4) : null
}

// An entry's own date range, e.g. "2018 – Present" or "2015 – 2017".
function entryDateRange(entry: TimelineComponent): string {
  const sy = getYear(entry.start_date)
  const ey = getYear(entry.end_date)
  if (sy && ey) return `${sy} – ${ey}`
  if (sy && !ey) return `${sy} – Present`
  if (!sy && ey) return ey
  return ''
}

function EntryCard({
  entry,
  align,
  onClick,
}: {
  entry: TimelineComponent
  align: 'left' | 'right'
  onClick?: () => void
}) {
  const range = entryDateRange(entry)
  const meta = TIMELINE_TYPES[entry.type]

  return (
    <div
      onClick={onClick}
      className={`bg-navy-800 rounded-lg p-3 border border-navy-700 hover:border-blue-400 hover:shadow-md hover:shadow-blue-900/40 transition cursor-pointer ${
        align === 'right' ? 'md:text-left' : ''
      }`}
    >
      <div className="flex items-center gap-2 flex-wrap mb-1">
        {meta && <span>{meta.icon}</span>}
        <p className="font-medium text-white">{entry.title}</p>
      </div>
      {entry.organization_name && (
        <p className="text-sm text-blue-300 mb-1">{entry.organization_name}</p>
      )}
      {range && (
        <div className="mb-2">
          <span className="text-xs text-navy-400">{range}</span>
        </div>
      )}
      {entry.primary_location && (
        <p className="text-xs text-navy-400 mb-2">{entry.primary_location}</p>
      )}
      {entry.description && (
        <p className="text-xs text-navy-300 mb-2 line-clamp-2">{entry.description}</p>
      )}
      {entry.impact_metrics && (
        <p className="text-xs text-white font-medium mb-2">{entry.impact_metrics}</p>
      )}
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {entry.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-navy-700 text-navy-200 text-xs rounded">
              {tag}
            </span>
          ))}
          {entry.tags.length > 3 && <span className="text-navy-400 text-xs">+{entry.tags.length - 3}</span>}
        </div>
      )}
    </div>
  )
}

export function CareerTimeline({ components, expandedRole, onRoleClick }: CareerTimelineProps) {
  // One unified timeline — roles alongside education, certifications,
  // programs, and volunteer work — ordered strictly by date rather than
  // split into separate per-type or per-organization timelines.
  const entries = useMemo(() => {
    return sortByDateDesc(components.filter((comp) => comp.type in TIMELINE_TYPES))
  }, [components])

  const roleCount = entries.filter((e) => e.type === 'role').length
  const complementaryCount = entries.length - roleCount

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 bg-navy-800 rounded-lg border border-navy-700">
        <p className="text-white font-medium">No timeline entries yet</p>
        <p className="text-navy-300 text-sm mt-1">
          Add roles, education, or programs to build your career timeline.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Career timeline</h2>
        <p className="text-sm text-navy-300 mt-1">
          {roleCount} {roleCount === 1 ? 'role' : 'roles'}
          {complementaryCount > 0 && <> · {complementaryCount} complementary {complementaryCount === 1 ? 'entry' : 'entries'}</>}
        </p>
        <div className="flex items-center gap-4 mt-2 text-xs text-navy-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" /> Work
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" /> Education, certifications & more
          </span>
        </div>
      </div>

      {/* Desktop: single chronological spine, work on the left, everything else on the right */}
      <div className="hidden md:grid grid-cols-[1fr_2rem_1fr] gap-x-6">
        {entries.map((entry, i) => {
          const isRole = entry.type === 'role'
          const isCurrent = !!getYear(entry.start_date) && !getYear(entry.end_date)

          return (
            <div key={entry.id} className="contents">
              <div className="flex justify-end">
                {isRole && <div className="w-full max-w-md"><EntryCard entry={entry} align="left" onClick={() => onRoleClick?.(entry)} /></div>}
              </div>
              <div className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full border-2 border-navy-900 flex-shrink-0 ${
                    isRole ? (isCurrent ? 'bg-blue-500' : 'bg-blue-300') : isCurrent ? 'bg-purple-500' : 'bg-purple-300'
                  }`}
                  style={{ boxShadow: '0 0 0 2px #151C3D' }}
                />
                {i < entries.length - 1 && <div className="w-0.5 flex-1 bg-navy-700 my-1" />}
              </div>
              <div className="flex justify-start">
                {!isRole && <div className="w-full max-w-md"><EntryCard entry={entry} align="right" onClick={() => onRoleClick?.(entry)} /></div>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile: single stacked chronological list */}
      <div className="md:hidden space-y-3">
        {entries.map((entry) => {
          const isRole = entry.type === 'role'
          const isCurrent = !!getYear(entry.start_date) && !getYear(entry.end_date)

          return (
            <div key={entry.id} className="relative pl-4">
              <div className="absolute left-0 top-0 w-0.5 h-full bg-navy-700" />
              <div
                className={`absolute left-0 top-1.5 -translate-x-1.5 w-3 h-3 bg-navy-900 border-2 rounded-full ${
                  isRole ? (isCurrent ? 'border-blue-500' : 'border-blue-300') : isCurrent ? 'border-purple-500' : 'border-purple-300'
                }`}
              />
              <EntryCard entry={entry} align="left" onClick={() => onRoleClick?.(entry)} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
