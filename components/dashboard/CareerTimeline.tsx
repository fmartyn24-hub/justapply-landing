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

const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
  achievement: { icon: '⭐', color: 'from-yellow-100 to-yellow-50', label: 'Achievement' },
  skill: { icon: '🛠️', color: 'from-blue-100 to-blue-50', label: 'Skill' },
  role: { icon: '💼', color: 'from-purple-100 to-purple-50', label: 'Role' },
  project: { icon: '🚀', color: 'from-green-100 to-green-50', label: 'Project' },
  kpi: { icon: '📊', color: 'from-orange-100 to-orange-50', label: 'KPI' },
  voice: { icon: '🎤', color: 'from-pink-100 to-pink-50', label: 'Voice' },
}

interface TimelineEvent {
  year: string
  items: TimelineComponent[]
}

function groupByYear(components: TimelineComponent[]): TimelineEvent[] {
  const groups: Record<string, TimelineComponent[]> = {}

  // Sort components by start_date (most recent first initially, then we'll reverse)
  const sorted = [...components].sort((a, b) => {
    const dateA = a.start_date ? new Date(a.start_date).getTime() : 0
    const dateB = b.start_date ? new Date(b.start_date).getTime() : 0
    return dateB - dateA // Descending
  })

  sorted.forEach((comp) => {
    if (comp.start_date) {
      const year = new Date(comp.start_date).getFullYear().toString()
      if (!groups[year]) {
        groups[year] = []
      }
      groups[year].push(comp)
    } else {
      // Components without dates go into "Undated"
      if (!groups['Undated']) {
        groups['Undated'] = []
      }
      groups['Undated'].push(comp)
    }
  })

  // Convert to array and sort by year (descending)
  return Object.entries(groups)
    .map(([year, items]) => ({ year, items }))
    .sort((a, b) => {
      if (a.year === 'Undated') return 1
      if (b.year === 'Undated') return -1
      return parseInt(b.year) - parseInt(a.year)
    })
}

export function CareerTimeline({ components }: CareerTimelineProps) {
  const timelineEvents = useMemo(() => groupByYear(components), [components])

  if (components.length === 0) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-600 text-lg">No career events yet.</p>
        <p className="text-gray-500 text-sm mt-1">
          Add components to visualize your career timeline.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Your Career Timeline</h2>
        <p className="text-gray-600 mt-1">
          Visualize your career journey chronologically
        </p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400 md:transform md:-translate-x-1/2"></div>

        {/* Timeline events */}
        <div className="space-y-12 md:space-y-16">
          {timelineEvents.map((event, eventIdx) => (
            <div key={event.year} className="relative">
              {/* Year marker */}
              <div className="flex items-center justify-between md:justify-center mb-8">
                <div className="md:absolute md:left-1/2 md:transform md:-translate-x-1/2">
                  <div className="bg-white px-6 py-2 rounded-full font-bold text-lg text-blue-600 border-2 border-blue-400 shadow-md">
                    {event.year}
                  </div>
                </div>
              </div>

              {/* Items for this year */}
              <div className="space-y-6 md:space-y-8">
                {event.items.map((item, itemIdx) => {
                  const config = typeConfig[item.type]
                  // Skip components with invalid types
                  if (!config) return null

                  const isLeft = itemIdx % 2 === 0
                  const startYear = item.start_date ? new Date(item.start_date).getFullYear() : null
                  const endYear = item.end_date ? new Date(item.end_date).getFullYear() : null

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 md:gap-8 ${isLeft ? 'md:flex-row-reverse' : 'md:flex-row'}`}
                    >
                      {/* Content */}
                      <div className={`w-full md:w-1/2 ${isLeft ? 'md:text-right' : 'md:text-left'}`}>
                        <div
                          className={`bg-gradient-to-br ${config.color} rounded-lg p-5 border-2 border-gray-200 hover:border-blue-400 transition shadow-sm`}
                        >
                          {/* Header */}
                          <div className="flex items-start gap-3 mb-3">
                            <span className="text-2xl">{config.icon}</span>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{item.title}</p>
                              <p className="text-xs text-gray-600">{config.label}</p>

                              {/* Date range */}
                              {(startYear || endYear) && (
                                <p className="text-xs text-gray-600 mt-1 font-medium">
                                  {startYear}
                                  {endYear && startYear !== endYear
                                    ? ` - ${endYear}`
                                    : endYear && startYear === endYear
                                      ? ''
                                      : ''}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          {item.description && (
                            <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                              {item.description}
                            </p>
                          )}

                          {/* Impact metrics */}
                          {item.impact_metrics && (
                            <p className="text-sm font-medium text-gray-800 mb-3">
                              📈 {item.impact_metrics}
                            </p>
                          )}

                          {/* Tags */}
                          {item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 bg-white bg-opacity-60 text-gray-700 text-xs rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                              {item.tags.length > 3 && (
                                <span className="px-2 py-1 text-gray-600 text-xs">
                                  +{item.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Dot on timeline */}
                      <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 w-5 h-5 bg-white border-4 border-blue-400 rounded-full z-10"></div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
