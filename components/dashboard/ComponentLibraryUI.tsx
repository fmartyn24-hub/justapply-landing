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

const UNGROUPED = 'Other'

export function ComponentLibraryUI({
  components,
  onEdit,
  onDelete,
  onAdd,
  onImport,
  isDeleting,
}: ComponentLibraryUIProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

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

  // Group by organization so the library reads as sections instead of one
  // endless scroll — each group sorted by most recent activity.
  const groups = useMemo(() => {
    const byOrg = new Map<string, CareerComponent[]>()
    filteredComponents.forEach((comp) => {
      const key = comp.organization_name?.trim() || UNGROUPED
      if (!byOrg.has(key)) byOrg.set(key, [])
      byOrg.get(key)!.push(comp)
    })
    const entries = Array.from(byOrg.entries())
    entries.forEach(([, comps]) =>
      comps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    )
    entries.sort(([orgA, compsA], [orgB, compsB]) => {
      if (orgA === UNGROUPED) return 1
      if (orgB === UNGROUPED) return -1
      const latestA = Math.max(...compsA.map((c) => new Date(c.created_at).getTime()))
      const latestB = Math.max(...compsB.map((c) => new Date(c.created_at).getTime()))
      return latestB - latestA
    })
    return entries
  }, [filteredComponents])

  const toggleType = (type: string) => {
    const newTypes = new Set(selectedTypes)
    if (newTypes.has(type)) {
      newTypes.delete(type)
    } else {
      newTypes.add(type)
    }
    setSelectedTypes(newTypes)
  }

  const toggleGroup = (org: string) => {
    const next = new Set(collapsedGroups)
    if (next.has(org)) next.delete(org)
    else next.add(org)
    setCollapsedGroups(next)
  }

  return (
    <div>
      {/* Sticky filter bar — stays visible while scrolling through groups */}
      <div className="sticky top-0 z-10 bg-navy-900 pt-1 pb-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Career components</h2>
            <p className="text-sm text-navy-300 mt-1">
              {filteredComponents.length} of {components.length}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={onImport} variant="outline" className="text-sm">
              Import context
            </Button>
            <Button onClick={onAdd} className="text-sm">
              Add component
            </Button>
          </div>
        </div>

        <input
          type="text"
          placeholder="Search by title, description, or tags"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-navy-800 border border-navy-600 rounded-md text-white placeholder-navy-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300 transition"
        />

        <div className="flex flex-wrap gap-2">
          {types.map((type) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-all ${
                selectedTypes.has(type)
                  ? 'bg-primary text-white'
                  : 'bg-navy-800 text-navy-200 border border-navy-600 hover:bg-navy-700 hover:border-blue-400'
              }`}
            >
              {typeConfig[type].label}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped component list */}
      {filteredComponents.length === 0 ? (
        <div className="text-center py-8 bg-navy-800 rounded-lg border border-navy-700">
          <p className="text-white font-medium">No components found</p>
          <p className="text-navy-300 text-sm mt-1">
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
        <div className="space-y-6">
          {groups.map(([org, comps]) => {
            const isCollapsed = collapsedGroups.has(org)
            return (
              <div key={org}>
                <button
                  onClick={() => toggleGroup(org)}
                  className="w-full flex items-center gap-2 mb-3 text-left group/header"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`text-navy-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <h3 className="text-sm font-semibold text-navy-200 uppercase tracking-wide group-hover/header:text-white transition">
                    {org}
                  </h3>
                  <span className="text-xs text-navy-400">{comps.length}</span>
                  <div className="flex-1 h-px bg-navy-700" />
                </button>

                {!isCollapsed && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {comps.map((component) => {
                      const config = typeConfig[component.type]
                      if (!config) {
                        console.warn(`Invalid component type: "${component.type}" for component:`, component)
                        return null
                      }
                      const isDeletingComponent = isDeleting?.(component.id)

                      return (
                        <div
                          key={component.id}
                          className="bg-navy-800 rounded-lg p-3 border border-navy-700 hover:border-blue-400 hover:shadow-sm transition group cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-white text-sm">{component.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-navy-300">{config.label}</p>
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button
                                onClick={() => onEdit(component)}
                                className="p-1 hover:bg-navy-700 rounded text-sm text-navy-400 hover:text-white transition"
                                title="Edit"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => onDelete(component.id)}
                                disabled={isDeletingComponent}
                                className="p-1 hover:bg-navy-700 rounded text-sm text-navy-400 hover:text-red-400 disabled:opacity-50 transition"
                                title="Delete"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          {component.description && (
                            <p className="text-xs text-navy-300 mb-2 line-clamp-2">{component.description}</p>
                          )}

                          {(component.start_date || component.end_date) && (
                            <p className="text-xs text-navy-400 mb-2">
                              {component.start_date && new Date(component.start_date).getFullYear()}
                              {component.end_date && ` - ${new Date(component.end_date).getFullYear()}`}
                            </p>
                          )}

                          {component.primary_location && (
                            <p className="text-xs text-navy-400 mb-2">{component.primary_location}</p>
                          )}

                          {component.impact_metrics && (
                            <p className="text-xs text-navy-200 font-medium mb-2">{component.impact_metrics}</p>
                          )}

                          {(component as any).tone_keywords && (
                            <p className="text-xs text-navy-300 mb-2">
                              <span className="text-navy-400">Tone:</span> {(component as any).tone_keywords}
                            </p>
                          )}

                          {(component as any).related_terms && (
                            <p className="text-xs text-navy-300 mb-2">
                              <span className="text-navy-400">Explains:</span> {(component as any).related_terms}
                            </p>
                          )}

                          {component.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {component.tags.slice(0, 2).map((tag) => (
                                <span key={tag} className="px-2 py-0.5 bg-navy-700 text-navy-200 text-xs rounded">
                                  {tag}
                                </span>
                              ))}
                              {component.tags.length > 2 && (
                                <span className="text-navy-400 text-xs">+{component.tags.length - 2}</span>
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
          })}
        </div>
      )}
    </div>
  )
}
