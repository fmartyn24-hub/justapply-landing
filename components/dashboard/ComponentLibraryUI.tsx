import { useState, useMemo } from 'react'
import { Button } from '@/components/common/Button'

interface CareerComponent {
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

interface ComponentLibraryUIProps {
  components: CareerComponent[]
  onEdit: (component: CareerComponent) => void
  onDelete: (componentId: string) => void
  onAdd: () => void
  isDeleting?: (id: string) => boolean
}

const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
  achievement: { icon: '⭐', color: 'from-yellow-100 to-yellow-50', label: 'Achievement' },
  skill: { icon: '🛠️', color: 'from-blue-100 to-blue-50', label: 'Skill' },
  role: { icon: '💼', color: 'from-purple-100 to-purple-50', label: 'Role' },
  project: { icon: '🚀', color: 'from-green-100 to-green-50', label: 'Project' },
  kpi: { icon: '📊', color: 'from-orange-100 to-orange-50', label: 'KPI' },
  voice: { icon: '🎤', color: 'from-pink-100 to-pink-50', label: 'Voice' },
}

export function ComponentLibraryUI({
  components,
  onEdit,
  onDelete,
  onAdd,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Your Career Components</h2>
          <p className="text-gray-600 mt-1">
            {filteredComponents.length} of {components.length} components
          </p>
        </div>
        <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700">
          + Add Component
        </Button>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search components by title, description, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => toggleType(type)}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              selectedTypes.has(type)
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {typeConfig[type].icon} {typeConfig[type].label}
          </button>
        ))}
      </div>

      {/* Component Grid */}
      {filteredComponents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600 text-lg">No components yet.</p>
          <p className="text-gray-500 text-sm mt-1">
            {components.length === 0
              ? 'Paste your CV above or add your first component manually.'
              : 'Try adjusting your search or filters.'}
          </p>
          {components.length === 0 && (
            <Button onClick={onAdd} variant="outline" className="mt-4">
              Add Your First Component
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredComponents.map((component) => {
            const config = typeConfig[component.type]
            const isDeleting = isDeleting?.(component.id)

            return (
              <div
                key={component.id}
                className={`bg-gradient-to-br ${config.color} rounded-lg p-5 border-2 border-gray-200 hover:border-blue-400 transition group cursor-pointer`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{component.title}</p>
                      <p className="text-xs text-gray-600">{config.label}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => onEdit(component)}
                      className="p-2 hover:bg-white rounded transition text-gray-600 hover:text-gray-900"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(component.id)}
                      disabled={isDeleting}
                      className="p-2 hover:bg-white rounded transition text-gray-600 hover:text-red-600 disabled:opacity-50"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Description */}
                {component.description && (
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                    {component.description}
                  </p>
                )}

                {/* Dates */}
                {(component.start_date || component.end_date) && (
                  <p className="text-xs text-gray-600 mb-2">
                    {component.start_date && new Date(component.start_date).getFullYear()}
                    {component.end_date && ` - ${new Date(component.end_date).getFullYear()}`}
                  </p>
                )}

                {/* Impact Metrics */}
                {component.impact_metrics && (
                  <p className="text-sm font-medium text-gray-800 mb-3">
                    📈 {component.impact_metrics}
                  </p>
                )}

                {/* Tags */}
                {component.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {component.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-white bg-opacity-60 text-gray-700 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {component.tags.length > 3 && (
                      <span className="px-2 py-1 text-gray-600 text-xs">
                        +{component.tags.length - 3}
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
