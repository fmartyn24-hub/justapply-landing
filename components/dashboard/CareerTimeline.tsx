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
          const lastRole = orgRolesSorted[orgRolesSorted.length - 1]

          return (
            <div key={org} className="relative">
              {/* Organization Header */}
              <div className="mb-6 pb-3 border-b-2 border-orange-300">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{org}</h3>
                <p className="text-xs text-gray-500">
                  {orgRoles.length} {orgRoles.length === 1 ? 'role' : 'roles'} · {new Date(orgRolesSorted[0].start_date || '').getFullYear() || '?'}
                  {lastRole?.end_date ? ` - ${new Date(lastRole.end_date).getFullYear()}` : ' - Present'}
                </p>
              </div>

              {/* Roles under this organization */}
              <div className="space-y-3 ml-6">
                {orgRolesSorted.map((role) => {
                  const startYear = role.start_date ? new Date(role.start_date).getFullYear() : null
                  const endYear = role.end_date ? new Date(role.end_date).getFullYear() : null

                  return (
                    <div
                      key={role.id}
                      onClick={() => onRoleClick?.(role)}
                      className="bg-white rounded-lg p-3 border border-gray-200 hover:border-magenta-300 hover:shadow-md hover:shadow-magenta-100 transition cursor-pointer"
                    >
                      {/* Header */}
                      <div className="mb-2">
                        <p className="font-medium text-gray-900">
                          {role.title}
                        </p>
                      </div>

                      {/* Year indicator */}
                      {(startYear || endYear) && (
                        <div className="mb-2">
                          <span className="text-xs text-gray-500">
                            {startYear}
                            {endYear ? ` - ${endYear}` : role.end_date ? ` - ${new Date(role.end_date).getFullYear()}` : ' - Present'}
                          </span>
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
                          {role.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {role.tags.length > 3 && (
                            <span className="text-gray-500 text-xs">
                              +{role.tags.length - 3}
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
      <div className="md:hidden space-y-6">
        {rolesByOrganization.map(([ org, orgRoles ]) => {
          const orgRolesSorted = sortRolesByDate(orgRoles)
          const lastRole = orgRolesSorted[orgRolesSorted.length - 1]

          return (
            <div key={org}>
              {/* Organization Header */}
              <div className="mb-3 pb-2 border-b-2 border-orange-300">
                <h3 className="text-base font-semibold text-gray-900 mb-1">{org}</h3>
                <p className="text-xs text-gray-500">
                  {orgRoles.length} {orgRoles.length === 1 ? 'role' : 'roles'} · {new Date(orgRolesSorted[0].start_date || '').getFullYear() || '?'}
                  {lastRole?.end_date ? ` - ${new Date(lastRole.end_date).getFullYear()}` : ' - Present'}
                </p>
              </div>

              {/* Roles under this organization */}
              <div className="space-y-2">
                {orgRolesSorted.map((role) => {
                  const startYear = role.start_date ? new Date(role.start_date).getFullYear() : null
                  const endYear = role.end_date ? new Date(role.end_date).getFullYear() : null

                  return (
                    <div key={role.id} className="relative pl-4">
                      {/* Vertical accent line */}
                      <div className="absolute left-0 top-0 w-0.5 h-full bg-gray-200" />
                      <div className="absolute left-0 top-1.5 -translate-x-1.5 w-3 h-3 bg-white border-2 border-gray-300 rounded-full" />

                      {/* Card */}
                      <div
                        onClick={() => onRoleClick?.(role)}
                        className="bg-white rounded-lg p-3 border border-gray-200 hover:border-magenta-300 hover:shadow-md hover:shadow-magenta-100 transition cursor-pointer"
                      >
                        {/* Header */}
                        <p className="font-medium text-gray-900 text-sm mb-2">
                          {role.title}
                        </p>

                        {/* Year indicator */}
                        {(startYear || endYear) && (
                          <div className="mb-2">
                            <span className="text-xs text-gray-500">
                              {startYear}
                              {endYear ? ` - ${endYear}` : role.end_date ? ` - ${new Date(role.end_date).getFullYear()}` : ' - Present'}
                            </span>
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
