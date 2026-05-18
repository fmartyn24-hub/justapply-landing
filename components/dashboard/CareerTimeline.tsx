import { useMemo } from 'react'

interface TimelineComponent {
  id: string
  type: string
  title: string
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
          {roles.length} role{roles.length !== 1 ? 's' : ''} marking your professional growth
        </p>
      </div>

      {/* Desktop: Horizontal timeline with alternating cards */}
      <div className="hidden md:block">
        {/* Central timeline line */}
        <div className="relative py-4">
          {/* The line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-400 via-purple-400 to-blue-500" />

          {/* Timeline nodes */}
          <div className="space-y-8">
            {roles.map((role, idx) => {
              const startYear = role.start_date ? new Date(role.start_date).getFullYear() : null
              const endYear = role.end_date ? new Date(role.end_date).getFullYear() : null
              const isEven = idx % 2 === 0

              return (
                <div key={role.id} className="relative">
                  {/* Timeline node circle */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 top-6">
                    <div className="w-4 h-4 bg-white border-4 border-blue-500 rounded-full shadow-lg" />
                  </div>

                  {/* Card container - left or right based on index */}
                  <div className={`w-5/12 ${isEven ? 'mr-auto' : 'ml-auto'}`}>
                    <div
                      onClick={() => onRoleClick?.(role)}
                      className={`bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg p-5 border-2 border-gray-200 hover:border-blue-400 transition shadow-md h-full cursor-pointer hover:shadow-lg`}
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
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile: Vertical timeline */}
      <div className="md:hidden space-y-4">
        {roles.map((role, idx) => {
          const startYear = role.start_date ? new Date(role.start_date).getFullYear() : null
          const endYear = role.end_date ? new Date(role.end_date).getFullYear() : null

          return (
            <div key={role.id} className="relative pl-8">
              {/* Timeline line and node */}
              <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-blue-400 to-purple-400" />
              <div className="absolute left-0 top-2 -translate-x-2.5 w-5 h-5 bg-white border-4 border-blue-500 rounded-full shadow-lg" />

              {/* Card */}
              <div
                onClick={() => onRoleClick?.(role)}
                className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg p-5 border-2 border-gray-200 hover:border-blue-400 transition shadow-md cursor-pointer hover:shadow-lg"
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
                  <p className="text-sm text-gray-700 mb-3">
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
}
