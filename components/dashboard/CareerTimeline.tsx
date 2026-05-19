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
      <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-600 text-lg">No roles yet.</p>
        <p className="text-gray-500 text-sm mt-1">
          Add roles to visualize your career timeline.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Your Career Journey</h2>
        <p className="text-gray-600 mt-1">
          {rolesByOrganization.length} organization{rolesByOrganization.length !== 1 ? 's' : ''} · {roles.length} role{roles.length !== 1 ? 's' : ''} marking your professional growth
        </p>
      </div>

      {/* Desktop: Timeline grouped by organization */}
      <div className="hidden md:block space-y-12">
        {rolesByOrganization.map(([ org, orgRoles ]) => {
          const orgRolesSorted = sortRolesByDate(orgRoles)
          const lastRole = orgRolesSorted[orgRolesSorted.length - 1]

          return (
            <div key={org} className="relative">
              {/* Organization Header */}
              <div className="mb-8 pb-4 border-b-2 border-blue-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">🏢 {org}</h3>
                <p className="text-sm text-gray-600">
                  {orgRoles.length} role{orgRoles.length !== 1 ? 's' : ''} · {new Date(orgRolesSorted[0].start_date || '').getFullYear() || '?'}
                  {lastRole?.end_date ? ` - ${new Date(lastRole.end_date).getFullYear()}` : ' - Present'}
                </p>
              </div>

              {/* Roles under this organization */}
              <div className="space-y-6">
                {orgRolesSorted.map((role) => {
                  const startYear = role.start_date ? new Date(role.start_date).getFullYear() : null
                  const endYear = role.end_date ? new Date(role.end_date).getFullYear() : null

                  return (
                    <div
                      key={role.id}
                      onClick={() => onRoleClick?.(role)}
                      className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg p-5 border-2 border-gray-200 hover:border-blue-400 transition shadow-md cursor-pointer hover:shadow-lg ml-8"
                    >
                      {/* Year indicator */}
                      {(startYear || endYear) && (
                        <div className="mb-2">
                          <span className="inline-block px-3 py-1 bg-white bg-opacity-70 rounded-full text-sm font-bold text-purple-600">
                            {startYear}
                            {endYear ? ` - ${endYear}` : role.end_date ? ` - ${new Date(role.end_date).getFullYear()}` : ' - Present'}
                          </span>
                        </div>
                      )}

                      {/* Location */}
                      {role.primary_location && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-600">📍 {role.primary_location}</p>
                        </div>
                      )}

                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-2xl flex-shrink-0">{roleConfig.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-lg leading-tight">
                            {role.title}
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      {role.description && (
                        <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                          {role.description}
                        </p>
                      )}

                      {/* Impact metrics - prominently displayed */}
                      {role.impact_metrics && (
                        <div className="bg-white bg-opacity-50 rounded p-2 mb-3 border-l-4 border-purple-500">
                          <p className="text-sm font-semibold text-gray-900">
                            📈 {role.impact_metrics}
                          </p>
                        </div>
                      )}

                      {/* Tags */}
                      {role.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                          {role.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-white bg-opacity-70 text-gray-700 text-xs rounded-full font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                          {role.tags.length > 4 && (
                            <span className="px-2 py-1 text-gray-600 text-xs font-medium">
                              +{role.tags.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile: Vertical timeline grouped by organization */}
      <div className="md:hidden space-y-8">
        {rolesByOrganization.map(([ org, orgRoles ]) => {
          const orgRolesSorted = sortRolesByDate(orgRoles)

          return (
            <div key={org}>
              {/* Organization Header */}
              <div className="mb-4 pb-3 border-b-2 border-blue-200">
                <h3 className="text-xl font-bold text-gray-900 mb-1">🏢 {org}</h3>
                <p className="text-xs text-gray-600">
                  {orgRoles.length} role{orgRoles.length !== 1 ? 's' : ''} · {new Date(orgRolesSorted[0].start_date || '').getFullYear() || '?'}
                  {orgRolesSorted[orgRolesSorted.length - 1]?.end_date ? ` - ${new Date(orgRolesSorted[orgRolesSorted.length - 1].end_date).getFullYear()}` : ' - Present'}
                </p>
              </div>

              {/* Roles under this organization */}
              <div className="space-y-4">
                {orgRolesSorted.map((role) => {
                  const startYear = role.start_date ? new Date(role.start_date).getFullYear() : null
                  const endYear = role.end_date ? new Date(role.end_date).getFullYear() : null

                  return (
                    <div key={role.id} className="relative pl-6">
                      {/* Vertical accent line */}
                      <div className="absolute left-0 top-0 w-1 h-full bg-blue-300" />
                      <div className="absolute left-0 top-3 -translate-x-2.5 w-4 h-4 bg-white border-3 border-blue-400 rounded-full shadow-md" />

                      {/* Card */}
                      <div
                        onClick={() => onRoleClick?.(role)}
                        className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg p-4 border-2 border-gray-200 hover:border-blue-400 transition shadow-md cursor-pointer hover:shadow-lg"
                      >
                        {/* Year indicator */}
                        {(startYear || endYear) && (
                          <div className="mb-2">
                            <span className="inline-block px-3 py-1 bg-white bg-opacity-70 rounded-full text-sm font-bold text-purple-600">
                              {startYear}
                              {endYear ? ` - ${endYear}` : role.end_date ? ` - ${new Date(role.end_date).getFullYear()}` : ' - Present'}
                            </span>
                          </div>
                        )}

                        {/* Location */}
                        {role.primary_location && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-600">📍 {role.primary_location}</p>
                          </div>
                        )}

                        {/* Header */}
                        <div className="flex items-start gap-3 mb-3">
                          <span className="text-2xl flex-shrink-0">{roleConfig.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-lg leading-tight">
                              {role.title}
                            </p>
                          </div>
                        </div>

                        {/* Description */}
                        {role.description && (
                          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                            {role.description}
                          </p>
                        )}

                        {/* Impact metrics */}
                        {role.impact_metrics && (
                          <div className="bg-white bg-opacity-50 rounded p-2 mb-3 border-l-4 border-purple-500">
                            <p className="text-sm font-semibold text-gray-900">
                              📈 {role.impact_metrics}
                            </p>
                          </div>
                        )}

                        {/* Tags */}
                        {role.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                            {role.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-white bg-opacity-70 text-gray-700 text-xs rounded-full font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                            {role.tags.length > 3 && (
                              <span className="px-2 py-1 text-gray-600 text-xs font-medium">
                                +{role.tags.length - 3} more
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
