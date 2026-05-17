import { useState, useEffect } from 'react'
import Link from 'next/link'
import { withAuth } from '@/lib/middleware/withAuth'
import { useAuth } from '@/lib/context/AuthContext'
import { Button } from '@/components/common/Button'
import { PasteAnalyzer } from '@/components/dashboard/PasteAnalyzer'
import { ComponentLibraryUI } from '@/components/dashboard/ComponentLibraryUI'
import { CareerTimeline } from '@/components/dashboard/CareerTimeline'
import { normalizeComponentType } from '@/lib/componentTypeMapping'
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
  created_at: string
}

interface CV {
  id: string
  filename: string
  file_size_bytes: number
  created_at: string
  storage_path: string
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

function Dashboard() {
  const [components, setComponents] = useState<CareerComponent[]>([])
  const [cvs, setCvs] = useState<CV[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deletingComponent, setDeletingComponent] = useState<string | null>(null)
  const [deleteConfirmComponent, setDeleteConfirmComponent] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
  })
  const [formData, setFormData] = useState<NewComponent>({
    type: 'achievement',
    title: '',
    description: '',
    tags: [],
  })
  const [analyzing, setAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState<'library' | 'timeline' | 'paste'>('library')
  const [editingComponent, setEditingComponent] = useState<CareerComponent | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<CareerComponent>>({})
  const [savingEdit, setSavingEdit] = useState(false)
  const { user, signOut } = useAuth()
  const { session } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.access_token) return

    setSavingProfile(true)
    try {
      const response = await fetch('/api/save-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(profileData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save profile')
      }

      setShowSettings(false)
      setSuccessMessage('Profile updated!')
      setTimeout(() => setSuccessMessage(''), 4000)
    } catch (err) {
      console.error('Save error:', err)
      alert(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  // Fetch components, CVs, and user profile
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, phone, address')
        .eq('id', session.user.id)
        .single()

      if (profileData) {
        setProfileData({
          firstName: profileData.first_name || '',
          lastName: profileData.last_name || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
        })
      }

      // Fetch components
      const { data: componentData } = await supabase
        .from('career_components')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (componentData) {
        // Normalize component types from database format to app format
        const normalizedComponents = componentData.map((comp: any) => ({
          ...comp,
          type: normalizeComponentType(comp.type),
        }))
        setComponents(normalizedComponents)
      }

      // Fetch CVs
      const { data: cvData } = await supabase
        .from('cvs')
        .select('id, filename, file_size_bytes, created_at, storage_path')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (cvData) {
        setCvs(cvData)
      }

      setLoading(false)
    }

    fetchData()
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
          const normalizedComponents = updatedComponents.map((comp: any) => ({
            ...comp,
            type: normalizeComponentType(comp.type),
          }))
          setComponents(normalizedComponents)
        }
      }

      alert(`✅ Extracted ${data.componentsAdded} components from your documents!`)
    } catch (err) {
      console.error('Extraction error:', err)
      alert(err instanceof Error ? err.message : 'Failed to extract components')
    } finally {
      setExtracting(false)
    }
  }

  const handleDeleteCV = async (cvId: string, storagePath: string) => {
    if (!session?.user?.id) return

    setDeleting(cvId)
    try {
      await supabase.storage.from('cvs').remove([storagePath])
      await supabase.from('cvs').delete().eq('id', cvId)
      setCvs(cvs.filter((cv) => cv.id !== cvId))
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete CV')
    } finally {
      setDeleting(null)
    }
  }

  const handleDeleteComponent = async (componentId: string) => {
    if (!session?.user?.id) return

    setDeletingComponent(componentId)
    try {
      await supabase.from('career_components').delete().eq('id', componentId)
      setComponents(components.filter((c) => c.id !== componentId))
      setDeleteConfirmComponent(null)
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete component')
    } finally {
      setDeletingComponent(null)
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
      })

      if (!error) {
        const { data } = await supabase
          .from('career_components')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })

        if (data) {
          setComponents(data)
        }

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

  const handleAnalyzeText = async (text: string) => {
    if (!session?.access_token || !session?.user?.id) return

    setAnalyzing(true)
    try {
      const response = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Analysis failed')
      }

      const data = await response.json()

      // The API endpoint handles all insertion/updates, so just refetch components
      const { data: updatedComponents } = await supabase
        .from('career_components')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (updatedComponents) {
        const normalizedComponents = updatedComponents.map((comp: any) => ({
          ...comp,
          type: normalizeComponentType(comp.type),
        }))
        setComponents(normalizedComponents)

        alert(`✅ Analysis complete! Your career components have been updated.`)
        setActiveTab('library')
      }
    } catch (err) {
      console.error('Analysis error:', err)
      alert(err instanceof Error ? err.message : 'Failed to analyze text')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleEditComponent = (component: CareerComponent) => {
    setEditingComponent(component)
    setEditFormData({
      type: component.type as any,
      title: component.title,
      description: component.description,
      start_date: component.start_date,
      end_date: component.end_date,
      impact_metrics: component.impact_metrics,
      tags: component.tags || [],
    })
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id || !editingComponent?.id) return

    setSavingEdit(true)
    try {
      const { error } = await supabase
        .from('career_components')
        .update({
          type: editFormData.type,
          title: editFormData.title,
          description: editFormData.description || null,
          start_date: editFormData.start_date || null,
          end_date: editFormData.end_date || null,
          impact_metrics: editFormData.impact_metrics || null,
          tags: editFormData.tags || [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingComponent.id)

      if (!error) {
        // Refetch components
        const { data } = await supabase
          .from('career_components')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })

        if (data) {
          const normalizedComponents = data.map((comp: any) => ({
            ...comp,
            type: normalizeComponentType(comp.type),
          }))
          setComponents(normalizedComponents)
        }

        setEditingComponent(null)
        setEditFormData({})
      }
    } catch (err) {
      console.error('Error updating component:', err)
      alert('Failed to update component')
    } finally {
      setSavingEdit(false)
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => {
                /* Stay on dashboard */
              }}
              className="cursor-default"
            >
              <img src="/logo-light.svg" alt="justapply" className="h-10" />
            </button>
            <div className="flex gap-4 items-center">
              <Link href="/dashboard/upload">
                <Button variant="outline" size="sm">
                  + Upload More Information
                </Button>
              </Link>
              <button
                onClick={() => setShowSettings(true)}
                className="text-gray-600 hover:text-gray-900 font-medium transition text-sm"
              >
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 font-medium transition text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Career Profile (3/4 width) */}
          <div className="lg:col-span-3 space-y-8">
            {/* Success Banner */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800">✅ {successMessage}</p>
              </div>
            )}

            {/* Welcome */}
            <div>
              <h1 className="text-5xl font-bold text-gray-900 mb-2">
                Welcome{profileData.firstName ? ` back, ${profileData.firstName}` : ' to JustApply'}
              </h1>
              <p className="text-xl text-gray-600">
                Build your professional story, then apply smarter.
              </p>
            </div>

            {/* Tell Us More About You - if first name not set */}
            {!profileData.firstName && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="font-semibold text-purple-900 mb-2">Tell us more about you</h3>
                <p className="text-purple-800 text-sm mb-4">
                  Add your name and contact info to personalize your experience and make applications smoother.
                </p>
                <Button onClick={() => setShowSettings(true)} variant="outline">
                  Complete Your Profile
                </Button>
              </div>
            )}

            {/* Tabs for Library and Timeline */}
            {components.length > 0 && (
              <div className="space-y-6">
                <div className="flex gap-4 border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('library')}
                    className={`px-4 py-3 font-medium transition border-b-2 ${
                      activeTab === 'library'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Component Library
                  </button>
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className={`px-4 py-3 font-medium transition border-b-2 ${
                      activeTab === 'timeline'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Timeline View
                  </button>
                </div>

                {/* Component Library */}
                {activeTab === 'library' && (
                  <ComponentLibraryUI
                    components={components}
                    onEdit={handleEditComponent}
                    onDelete={handleDeleteComponent}
                    onAdd={() => setShowAddForm(true)}
                    isDeleting={(id) => deletingComponent === id}
                  />
                )}

                {/* Career Timeline */}
                {activeTab === 'timeline' && (
                  <CareerTimeline components={components} />
                )}
              </div>
            )}

            {/* Empty State for Components */}
            {!loading && components.length === 0 && (
              <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-600 text-lg mb-2">Ready to build your career profile?</p>
                <p className="text-gray-500 text-sm mb-6">
                  Paste your CV or cover letter in the sidebar to get started. We'll intelligently extract your roles, achievements, skills, and experience.
                </p>
              </div>
            )}
          </div>

          {/* Right Sidebar - Paste Analyzer + Files (1/4 width) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Paste & Analyze Section */}
              <PasteAnalyzer onAnalyze={handleAnalyzeText} analyzing={analyzing} />

              {/* Files Section */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Files You've Uploaded</h3>
                {cvs.length === 0 ? (
                  <p className="text-sm text-gray-600">No files yet</p>
                ) : (
                  <div className="space-y-2">
                    {cvs.map((cv) => (
                      <div key={cv.id} className="border border-gray-200 rounded p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {cv.filename}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(cv.file_size_bytes / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          {deleteConfirm === cv.id ? (
                            <div className="flex flex-col gap-1">
                              <input
                                type="text"
                                placeholder='Type "delete"'
                                onKeyDown={(e) => {
                                  if (
                                    e.currentTarget.value === 'delete' &&
                                    e.key === 'Enter'
                                  ) {
                                    handleDeleteCV(cv.id, cv.storage_path)
                                  }
                                }}
                                className="w-20 px-2 py-1 text-xs border border-red-300 rounded"
                                autoFocus
                              />
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(cv.id)}
                              className="text-xs text-red-600 hover:text-red-700 whitespace-nowrap"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Profile</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Address
                </label>
                <textarea
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button type="submit" loading={savingProfile} className="flex-1">
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSettings(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Component Modal */}
      {editingComponent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit {getComponentIcon(editFormData.type || 'achievement')} {editFormData.type}</h2>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Type *
                  </label>
                  <select
                    value={editFormData.type || 'achievement'}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="achievement">Achievement</option>
                    <option value="skill">Skill</option>
                    <option value="role">Role</option>
                    <option value="project">Project</option>
                    <option value="kpi">KPI</option>
                    <option value="voice">Voice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={editFormData.title || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Description
                </label>
                <textarea
                  value={editFormData.description || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editFormData.start_date || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={editFormData.end_date || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Impact Metrics
                </label>
                <input
                  type="text"
                  value={editFormData.impact_metrics || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, impact_metrics: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Increased sales by 40%"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  value={(editFormData.tags || []).join(', ')}
                  onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value.split(',').map(t => t.trim()) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="e.g., React, TypeScript, Performance"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button type="submit" loading={savingEdit} className="flex-1">
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingComponent(null)
                    setEditFormData({})
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default withAuth(Dashboard)
