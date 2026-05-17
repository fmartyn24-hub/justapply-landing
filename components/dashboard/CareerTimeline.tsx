import { useMemo } from 'react'

interface TimelineComponent {
  id: string
  type: string
  title: string
  description?: string
  start_date?: string
  end_date?: string
  impact_metrics?: string
  tags: string[]
  created_at: string
}

interface CareerTimelineProps {
  components: TimelineComponent[]
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

export function CareerTimeline({ components }: CareerTimelineProps) {
  // Filter to only roles
  const roles = useMemo(() => {
    return sortRolesByDate(components.filter((comp) => comp.type === 'role'))
  }, [components])

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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Your Career Timeline</h2>
        <p className="text-gray-600 mt-1">
          {roles.length} role{roles.length !== 1 ? 's' : ''} in your career journey
        </p>
      </div>

      {/* Horizontal timeline - left to right on desktop, top to bottom on mobile */}
      <div className="flex flex-col md:flex-row md:overflow-x-auto md:pb-4 gap-4 md:gap-6">
        {roles.map((role, idx) => {
          const startYear = role.start_date ? new Date(role.start_date).getFullYear() : null
          const endYear = role.end_date ? new Date(role.end_date).getFullYear() : null
          const isLast = idx === roles.length - 1

          return (
            <div key={role.id} className="flex-1 md:min-w-[300px] md:flex-shrink-0">
              {/* Card */}
              <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg p-5 border-2 border-gray-200 hover:border-blue-400 transition shadow-sm h-full flex flex-col">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{roleConfig.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{role.title}</p>
                    {/* Date range */}
                    {(startYear || endYear) && (
                      <p className="text-sm text-gray-600 font-medium">
                        {startYear}
                        {endYear && startYear !== endYear ? ` - ${endYear}` : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                {role.description && (
                  <p className="text-sm text-gray-700 mb-3 line-clamp-3 flex-grow">
                    {role.description}
                  </p>
                )}

                {/* Impact metrics */}
                {role.impact_metrics && (
                  <p className="text-sm font-medium text-gray-800 mb-3">
                    📈 {role.impact_metrics}
                  </p>
                )}

                {/* Tags */}
                {role.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-auto pt-3 border-t border-gray-200">
                    {role.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-white bg-opacity-60 text-gray-700 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {role.tags.length > 3 && (
                      <span className="px-2 py-1 text-gray-600 text-xs">
                        +{role.tags.length - 3}
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
}
