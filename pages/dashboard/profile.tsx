import { useState, useEffect } from 'react'
import Link from 'next/link'
import { withAuth } from '@/lib/middleware/withAuth'
import { useAuth } from '@/lib/context/AuthContext'
import { Button } from '@/components/common/Button'
import { supabase } from '@/lib/supabaseClient'

interface CareerComponent {
  id: string
  type: string
  title: string
  description?: string
  start_date?: string
  end_date?: string
  impact_metrics?: string
  tags: string[]
  source: string
  created_at: string
}

interface NewComponent {
  type: 'kpi' | 'project' | 'achievement' | 'skill' | 'role' | 'voice'
  title: string
  description: string
  start_date?: string
  end_date?: string
  impact_metrics?: string
  tags: string[]
}

function ProfilePage() {
  const [components, setComponents] = useState<CareerComponent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedType, setSelectedType] = useState<NewComponent['type']>('achievement')
  const [formData, setFormData] = useState<NewComponent>({
    type: 'achievement',
    title: '',
    description: '',
    tags: [],
  })
  const [saving, setSaving] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const { session } = useAuth()

  // Fetch components
  useEffect(() => {
    const fetchComponents = async () => {
      if (!session?.user?.id) return

      const { data, error } = await supabase
        .from('career_components')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setComponents(data)
      }
      setLoading(false)
    }

    fetchComponents()
  }, [session])

  const handleExtractComponents = async () => {
    if (!session?.access_token) return

    setExtracting(true)
    try {
      const response = await fetch('/api/extract-components', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Extraction failed')
      }

      const data = await response.json()

      // Refetch components
      if (session?.user?.id) {
        const { data: updatedComponents } = await supabase
          .from('career_components')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })

        if (updatedComponents) {
          setComponents(updatedComponents)
        }
      }

      // Show success message
      alert(`✅ Extracted ${data.componentsAdded} components from your documents!`)
    } catch (err) {
      console.error('Extraction error:', err)
      alert(err instanceof Error ? err.message : 'Failed to extract components')
    } finally {
      setExtracting(false)
    }
  }

  const handleAddComponent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id) return

    setSaving(true)
    try {
      const { error } = await supabase.from('career_components').insert({
        user_id: session.user.id,
        type: formData.type,
        title: formData.title,
        description: formData.description,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        impact_metrics: formData.impact_metrics || null,
        tags: formData.tags,
        source: 'manual',
      } as any)

      if (!error) {
        // Refetch components
        const { data } = await supabase
          .from('career_components')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })

        if (data) {
          setComponents(data)
        }

        // Reset form
        setFormData({
          type: 'achievement',
          title: '',
          description: '',
          tags: [],
        })
        setShowAddForm(false)
      }
    } catch (err) {
      console.error('Error adding component:', err)
    } finally {
      setSaving(false)
    }
  }

  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'kpi':
        return '📊'
      case 'project':
        return '🚀'
      case 'achievement':
        return '⭐'
      case 'skill':
        return '🛠️'
      case 'role':
        return '💼'
      case 'voice':
        return '🎤'
      default:
        return '📝'
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center mb-4">
            <Link href="/">
              <img src="/logo-light.svg" alt="justapply" className="h-10" />
            </Link>
            <button
              onClick={() => {
                supabase.auth.signOut()
              }}
              className="text-gray-600 hover:text-gray-900 font-medium transition text-sm"
            >
              Sign Out
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex gap-6 border-t border-gray-100 pt-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-primary transition">
              Home
            </Link>
            <Link href="/dashboard/upload" className="text-gray-600 hover:text-primary transition">
              Upload More Information
            </Link>
            <Link href="/dashboard/profile" className="text-gray-900 font-medium hover:text-primary transition">
              My Career Profile
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Your Career Profile
              </h1>
              <p className="text-xl text-gray-600">
                Build your professional story with achievements, skills, and impact.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleExtractComponents}
                loading={extracting}
                variant="outline"
              >
                🤖 Extract from Documents
              </Button>
              <Button onClick={() => setShowAddForm(!showAddForm)} size="lg">
                + Add Component
              </Button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900 text-sm">
              💡 <strong>Tip:</strong> Click "Extract from Documents" to automatically analyze your CV and generate career components. Or manually add components one by one.
            </p>
          </div>

          {/* Add Component Form */}
          {showAddForm && (
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Career Component</h2>
              <form onSubmit={handleAddComponent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      setFormData({ ...formData, type: e.target.value as NewComponent['type'] })
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="achievement">Achievement</option>
                    <option value="project">Project</option>
                    <option value="kpi">KPI / Metric</option>
                    <option value="skill">Skill</option>
                    <option value="role">Role / Position</option>
                    <option value="voice">Voice / Communication Style</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Led product redesign, Built payment system"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tell us more about this achievement..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Start Date (optional)
                    </label>
                    <input
                      type="date"
                      value={formData.start_date || ''}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      End Date (optional)
                    </label>
                    <input
                      type="date"
                      value={formData.end_date || ''}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Impact / Metrics (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.impact_metrics || ''}
                    onChange={(e) => setFormData({ ...formData, impact_metrics: e.target.value })}
                    placeholder="e.g., Increased conversion by 40%, Saved $200k/year"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" loading={saving}>
                    Add Component
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Components List */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Components</h2>

            {loading ? (
              <div className="text-gray-600">Loading your career profile...</div>
            ) : components.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-600 mb-4">No components yet. Start building your career profile!</p>
                <Button onClick={() => setShowAddForm(true)}>Add Your First Component</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {components.map((component) => (
                  <div
                    key={component.id}
                    className="border border-gray-200 rounded-lg p-6 hover:border-primary transition"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-2xl">{getComponentIcon(component.type)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{component.title}</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          {component.type}
                        </p>
                      </div>
                    </div>

                    {component.description && (
                      <p className="text-gray-600 text-sm mb-3">{component.description}</p>
                    )}

                    {component.impact_metrics && (
                      <p className="text-sm font-medium text-primary mb-3">
                        📈 {component.impact_metrics}
                      </p>
                    )}

                    {(component.start_date || component.end_date) && (
                      <p className="text-xs text-gray-500 mb-3">
                        {component.start_date && new Date(component.start_date).toLocaleDateString()}
                        {component.start_date && component.end_date && ' — '}
                        {component.end_date && new Date(component.end_date).toLocaleDateString()}
                      </p>
                    )}

                    {component.tags && component.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {component.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default withAuth(ProfilePage)
