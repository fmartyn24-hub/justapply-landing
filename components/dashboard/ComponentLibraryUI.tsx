import { useState, useMemo } from 'react'
import { Button } from '@/components/common/Button'

interface CareerComponent {
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

interface ComponentLibraryUIProps {
  components: CareerComponent[]
  onEdit: (component: CareerComponent) => void
  onDelete: (componentId: string) => void
  onAdd: () => void
  onImport: () => void
  onEnrichProfile?: () => void
  isDeleting?: (id: string) => boolean
}

const typeConfig: Record<string, { label: string }> = {
  achievement: { label: 'Achievement' },
  skill: { label: 'Skill' },
  role: { label: 'Role' },
  project: { label: 'Project' },
  kpi: { label: 'KPI' },
  voice: { label: 'Voice' },
  context: { label: 'Context' },
}

export function ComponentLibraryUI({
  components,
  onEdit,
  onDelete,
  onAdd,
  onImport,
  onEnrichProfile,
  isDeleting,
}: ComponentLibraryUIProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())

  const types = Object.keys(typeConfig)

  const filteredComponents = useMemo(() => {
    return components.filter((comp) => {
      const matchesSearch =
        comp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesType = selectedTypes.size === 0 || selectedTypes.has(comp.type)

      return matchesSearch && matchesType
    })
  }, [components, searchQuery, selectedTypes])

  const toggleType = (type: string) => {
    const newTypes = new Set(selectedTypes)
    if (newTypes.has(type)) {
      newTypes.delete(type)
    } else {
      newTypes.add(type)
    }
    setSelectedTypes(newTypes)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Career components</h2>
          <p className="text-sm text-gray-500 mt-1">
            {filteredComponents.length} of {components.length}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onImport} variant="outline" className="text-sm">
            Import context
          </Button>
          {onEnrichProfile && (
            <Button onClick={onEnrichProfile} variant="outline" className="text-sm">
              Enrich profile
            </Button>
          )}
          <Button onClick={onAdd} className="text-sm">
            Add component
          </Button>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by title, description, or tags"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-300 transition"
      />

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {types.map((type, idx) => {
          const secondaryColors = ['#FE6F09', '#90055D', '#052790']
          const accentColor = secondaryColors[idx % secondaryColors.length]
          const isMagenta = accentColor === '#90055D'
          const isOrange = accentColor === '#FE6F09'

          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-all ${
                selectedTypes.has(type)
                  ? `${isOrange ? 'bg-orange-600' : isMagenta ? 'bg-magenta-600' : 'bg-blue-700'} text-white`
                  : `bg-gray-100 text-gray-700 border border-gray-200 ${isOrange ? 'hover:bg-orange-50 hover:border-orange-200' : isMagenta ? 'hover:bg-magenta-50 hover:border-magenta-200' : 'hover:bg-blue-50 hover:border-blue-200'}`
              }`}
            >
              {typeConfig[type].label}
            </button>
          )
        })}
      </div>

      {/* Component Grid */}
      {filteredComponents.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-700 font-medium">No components found</p>
          <p className="text-gray-500 text-sm mt-1">
            {components.length === 0
              ? 'Paste your CV above or add your first component manually.'
              : 'Try adjusting your search or filters.'}
          </p>
          {components.length === 0 && (
            <Button onClick={onAdd} variant="outline" className="mt-3 text-sm">
              Add component
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredComponents.map((component) => {
            const config = typeConfig[component.type]

            // Log invalid types for debugging
            if (!config) {
              console.warn(`Invalid component type: "${component.type}" for component:`, component)
              return null
            }

            const isDeletingComponent = isDeleting?.(component.id)

            return (
              <div
                key={component.id}
                className="bg-white rounded-lg p-3 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition group cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{component.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500">{config.label}</p>
                      {component.organization_name && (
                        <p className="text-xs text-gray-400">· {component.organization_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => onEdit(component)}
                      className="p-1 hover:bg-gray-100 rounded text-sm text-gray-400 hover:text-gray-700 transition"
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(component.id)}
                      disabled={isDeletingComponent}
                      className="p-1 hover:bg-gray-100 rounded text-sm text-gray-400 hover:text-red-600 disabled:opacity-50 transition"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Description */}
                {component.description && (
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {component.description}
                  </p>
                )}

                {/* Dates */}
                {(component.start_date || component.end_date) && (
                  <p className="text-xs text-gray-500 mb-2">
                    {component.start_date && new Date(component.start_date).getFullYear()}
                    {component.end_date && ` - ${new Date(component.end_date).getFullYear()}`}
                  </p>
                )}

                {/* Location (for roles) */}
                {component.primary_location && (
                  <p className="text-xs text-gray-500 mb-2">
                    {component.primary_location}
                  </p>
                )}

                {/* Impact Metrics */}
                {component.impact_metrics && (
                  <p className="text-xs text-gray-700 font-medium mb-2">
                    {component.impact_metrics}
                  </p>
                )}

                {/* Tone Keywords (for Voice components) */}
                {(component as any).tone_keywords && (
                  <p className="text-xs text-gray-600 mb-2">
                    <span className="text-gray-500">Tone:</span> {(component as any).tone_keywords}
                  </p>
                )}

                {/* Related Terms (for Context components) */}
                {(component as any).related_terms && (
                  <p className="text-xs text-gray-600 mb-2">
                    <span className="text-gray-500">Explains:</span> {(component as any).related_terms}
                  </p>
                )}

                {/* Tags */}
                {component.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {component.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {component.tags.length > 2 && (
                      <span className="text-gray-500 text-xs">
                        +{component.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
