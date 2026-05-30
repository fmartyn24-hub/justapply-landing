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

const roleConfig = {
  icon: '💼',
  color: 'from-purple-100 to-purple-50',
  label: 'Role',
}

function sortRolesByDate(roles: TimelineComponent[]): TimelineComponent[] {
  return [...roles].sort((a, b) => {
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

// A role's own date range, e.g. "2018 – Present" or "2015 – 2017".
function roleDateRange(role: TimelineComponent): string {
  const sy = getYear(role.start_date)
  const ey = getYear(role.end_date)
  if (sy && ey) return `${sy} – ${ey}`
  if (sy && !ey) return `${sy} – Present`
  if (!sy && ey) return ey
  return ''
}

// The full span a person spent at a company: earliest start → latest end
// (or Present if any role there is still open).
function companyDateRange(roles: TimelineComponent[]): string {
  const startYears = roles.map((r) => getYear(r.start_date)).filter(Boolean) as string[]
  const endYears = roles.map((r) => getYear(r.end_date)).filter(Boolean) as string[]
  const earliest = startYears.length ? startYears.reduce((a, b) => (a < b ? a : b)) : null
  const hasOpenRole = roles.some((r) => getYear(r.start_date) && !getYear(r.end_date))
  const latest = endYears.length ? endYears.reduce((a, b) => (a > b ? a : b)) : null
  if (!earliest && !latest) return ''
  const end = hasOpenRole ? 'Present' : latest || 'Present'
  return `${earliest || '?'} – ${end}`
}

export function CareerTimeline({ components, expandedRole, onRoleClick }: CareerTimelineProps) {
  // Filter to only roles
  const roles = useMemo(() => {
    return sortRolesByDate(components.filter((comp) => comp.type === 'role'))
  }, [components])

  // Group roles by organization
  const rolesByOrganization = useMemo(() => {
    const groups: { [org: string]: TimelineComponent[] } = {}

    roles.forEach((role) => {
      const org = role.organization_name || 'Other'
      if (!groups[org]) {
        groups[org] = []
      }
      groups[org].push(role)
    })

    // Sort organizations by most recent role date
    return Object.entries(groups).sort((a, b) => {
      const lastDateA = a[1][0]?.start_date ? new Date(a[1][0].start_date).getTime() : 0
      const lastDateB = b[1][0]?.start_date ? new Date(b[1][0].start_date).getTime() : 0
      return lastDateB - lastDateA
    })
  }, [roles])

  if (roles.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-700 font-medium">No roles added yet</p>
        <p className="text-gray-500 text-sm mt-1">
          Add roles to build your career timeline.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Career timeline</h2>
        <p className="text-sm text-gray-500 mt-1">
          {rolesByOrganization.length} {rolesByOrganization.length === 1 ? 'organization' : 'organizations'} · {roles.length} {roles.length === 1 ? 'role' : 'roles'}
        </p>
      </div>

      {/* Desktop: Timeline grouped by organization */}
      <div className="hidden md:block space-y-8">
        {rolesByOrganization.map(([ org, orgRoles ]) => {
          const orgRolesSorted = sortRolesByDate(orgRoles)
          const hasProgression = orgRolesSorted.length > 1

          return (
            <div key={org} className="relative">
              {/* Organization Header */}
              <div className="mb-6 pb-3 border-b-2 border-orange-300">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">{org}</h3>
                  {hasProgression && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded-full px-2 py-0.5">
                      ↗ {orgRolesSorted.length} positions
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {companyDateRange(orgRolesSorted) || `${orgRoles.length} ${orgRoles.length === 1 ? 'role' : 'roles'}`}
                </p>
              </div>

              {/* Roles under this organization — a connected sub-timeline so
                  internal progression (promotions, title changes) reads as growth */}
              <div className="relative ml-3 pl-6 space-y-3">
                {/* Vertical connector line spanning the roles */}
                {hasProgression && (
                  <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-gradient-to-b from-purple-300 to-orange-200" />
                )}
                {orgRolesSorted.map((role, roleIndex) => {
                  const range = roleDateRange(role)
                  const isCurrent = !!getYear(role.start_date) && !getYear(role.end_date)

                  return (
                    <div key={role.id} className="relative">
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-6 top-3 w-3 h-3 rounded-full border-2 border-white ${
                          isCurrent ? 'bg-purple-500' : 'bg-orange-300'
                        }`}
                        style={{ boxShadow: '0 0 0 2px #e5e7eb' }}
                      />
                      <div
                        onClick={() => onRoleClick?.(role)}
                        className="bg-white rounded-lg p-3 border border-gray-200 hover:border-magenta-300 hover:shadow-md hover:shadow-magenta-100 transition cursor-pointer"
                      >
                        {/* Header: title + progression hint */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-medium text-gray-900">{role.title}</p>
                          {hasProgression && roleIndex === 0 && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-purple-600 flex-shrink-0">
                              Most recent
                            </span>
                          )}
                        </div>

                        {/* Date range */}
                        {range && (
                          <div className="mb-2">
                            <span className="text-xs text-gray-500">{range}</span>
                          </div>
                        )}

                        {/* Location */}
                        {role.primary_location && (
                          <p className="text-xs text-gray-500 mb-2">{role.primary_location}</p>
                        )}

                        {/* Description */}
                        {role.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{role.description}</p>
                        )}

                        {/* Impact metrics */}
                        {role.impact_metrics && (
                          <p className="text-xs text-gray-700 font-medium mb-2">{role.impact_metrics}</p>
                        )}

                        {/* Tags */}
                        {role.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {role.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {role.tags.length > 3 && (
                              <span className="text-gray-500 text-xs">+{role.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile: Vertical timeline grouped by organization */}
      <div className="md:hidden space-y-6">
        {rolesByOrganization.map(([ org, orgRoles ]) => {
          const orgRolesSorted = sortRolesByDate(orgRoles)
          const hasProgression = orgRolesSorted.length > 1

          return (
            <div key={org}>
              {/* Organization Header */}
              <div className="mb-3 pb-2 border-b-2 border-orange-300">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-base font-semibold text-gray-900">{org}</h3>
                  {hasProgression && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded-full px-2 py-0.5">
                      ↗ {orgRolesSorted.length} positions
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {companyDateRange(orgRolesSorted) || `${orgRoles.length} ${orgRoles.length === 1 ? 'role' : 'roles'}`}
                </p>
              </div>

              {/* Roles under this organization */}
              <div className="space-y-2">
                {orgRolesSorted.map((role) => {
                  const range = roleDateRange(role)
                  const isCurrent = !!getYear(role.start_date) && !getYear(role.end_date)

                  return (
                    <div key={role.id} className="relative pl-4">
                      {/* Vertical accent line */}
                      <div className="absolute left-0 top-0 w-0.5 h-full bg-gray-200" />
                      <div
                        className={`absolute left-0 top-1.5 -translate-x-1.5 w-3 h-3 bg-white border-2 rounded-full ${
                          isCurrent ? 'border-purple-500' : 'border-gray-300'
                        }`}
                      />

                      {/* Card */}
                      <div
                        onClick={() => onRoleClick?.(role)}
                        className="bg-white rounded-lg p-3 border border-gray-200 hover:border-magenta-300 hover:shadow-md hover:shadow-magenta-100 transition cursor-pointer"
                      >
                        {/* Header */}
                        <p className="font-medium text-gray-900 text-sm mb-2">
                          {role.title}
                        </p>

                        {/* Date range */}
                        {range && (
                          <div className="mb-2">
                            <span className="text-xs text-gray-500">{range}</span>
                          </div>
                        )}

                        {/* Location */}
                        {role.primary_location && (
                          <p className="text-xs text-gray-500 mb-2">
                            {role.primary_location}
                          </p>
                        )}

                        {/* Description */}
                        {role.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {role.description}
                          </p>
                        )}

                        {/* Impact metrics */}
                        {role.impact_metrics && (
                          <p className="text-xs text-gray-700 font-medium mb-2">
                            {role.impact_metrics}
                          </p>
                        )}

                        {/* Tags */}
                        {role.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {role.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {role.tags.length > 2 && (
                              <span className="text-gray-500 text-xs">
                                +{role.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
