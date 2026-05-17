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
  const [settingsTab, setSettingsTab] = useState<'profile' | 'security'>('profile')
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
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
  const [showImportModal, setShowImportModal] = useState(false)
  const [importTab, setImportTab] = useState<'paste' | 'upload'>('paste')
  const [expandedRole, setExpandedRole] = useState<CareerComponent | null>(null)
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.access_token || !user?.email) return

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage('Passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage('Password must be at least 6 characters')
      return
    }

    setSavingPassword(true)
    setPasswordMessage('')
    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: user.email,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setPasswordMessage('✅ Password changed successfully!')
      setTimeout(() => setPasswordMessage(''), 4000)
    } catch (err) {
      console.error('Password change error:', err)
      setPasswordMessage(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setSavingPassword(false)
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
              <img src="/logo-light.svg" alt="justapply" className="h-14" />
            </button>
            <div className="flex gap-4 items-center">
              <button
                onClick={() => setShowSettings(true)}
                className="text-gray-600 hover:text-gray-900 font-medium transition text-sm"
              >
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 font-medium transition text-sm rounded"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="w-full space-y-8">
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
                    onImport={() => setShowImportModal(true)}
                    isDeleting={(id) => deletingComponent === id}
                  />
                )}

                {/* Career Timeline */}
                {activeTab === 'timeline' && (
                  <CareerTimeline
                    components={components}
                    expandedRole={expandedRole}
                    onRoleClick={setExpandedRole}
                  />
                )}
              </div>
            )}

            {/* Empty State for Components */}
            {!loading && components.length === 0 && (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 space-y-6">
                <div>
                  <p className="text-gray-600 text-lg font-medium mb-2">Ready to build your profile?</p>
                  <p className="text-gray-500 text-sm mb-6">
                    Add your experience information to get started. We'll intelligently extract your roles, achievements, skills, and experience.
                  </p>
                </div>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => setShowImportModal(true)} className="bg-blue-600 hover:bg-blue-700">
                    ⬆️ Import your experience
                  </Button>
                  <Button onClick={() => setShowAddForm(true)} variant="outline">
                    + Add component
                  </Button>
                </div>
              </div>
            )}
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-4 border-b border-gray-200">
                <button
                  onClick={() => setSettingsTab('profile')}
                  className={`px-4 py-2 font-medium transition border-b-2 ${
                    settingsTab === 'profile'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setSettingsTab('security')}
                  className={`px-4 py-2 font-medium transition border-b-2 ${
                    settingsTab === 'security'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Security
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Success Message */}
              {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                  {successMessage}
                </div>
              )}
              {passwordMessage && (
                <div className={`rounded-lg p-3 text-sm ${
                  passwordMessage.includes('✅')
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {passwordMessage}
                </div>
              )}

              {/* Profile Tab */}
              {settingsTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Email Display */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">This is the email you signed up with</p>
                  </div>

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

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Button type="submit" loading={savingProfile} className="flex-1">
                      Save Profile
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSettings(false)}
                      className="flex-1"
                    >
                      Close
                    </Button>
                  </div>
                </form>
              )}

              {/* Security Tab */}
              {settingsTab === 'security' && (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Current Password *
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      New Password *
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Button type="submit" loading={savingPassword} className="flex-1">
                      Change Password
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSettings(false)}
                      className="flex-1"
                    >
                      Close
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Import your information</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 mb-6">
              <button
                onClick={() => setImportTab('paste')}
                className={`px-4 py-3 font-medium transition border-b-2 ${
                  importTab === 'paste'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Paste Information
              </button>
              <button
                onClick={() => setImportTab('upload')}
                className={`px-4 py-3 font-medium transition border-b-2 ${
                  importTab === 'upload'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Upload File
              </button>
            </div>

            {/* Paste Tab */}
            {importTab === 'paste' && (
              <PasteAnalyzer onAnalyze={handleAnalyzeText} analyzing={analyzing} />
            )}

            {/* Upload Tab */}
            {importTab === 'upload' && (
              <div className="text-center py-12 space-y-4">
                <div className="text-5xl mb-4">📁</div>
                <h3 className="text-lg font-semibold text-gray-900">Upload your CV or documents</h3>
                <p className="text-gray-600">
                  Upload your CV, cover letter, or other documents. We'll extract and analyze your experience.
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
                  <p className="text-sm text-gray-500 mb-4">
                    Upload functionality coming soon. For now, use the paste option above.
                  </p>
                  <button
                    disabled
                    className="px-6 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
                  >
                    Choose file
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expanded Role Modal */}
      {expandedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">💼</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{expandedRole.title}</h2>
                  {expandedRole.start_date && (
                    <p className="text-sm text-gray-600">
                      {new Date(expandedRole.start_date).getFullYear()}
                      {expandedRole.end_date
                        ? ` - ${new Date(expandedRole.end_date).getFullYear()}`
                        : ' - Present'}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setExpandedRole(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Description */}
              {expandedRole.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{expandedRole.description}</p>
                </div>
              )}

              {/* Impact Metrics */}
              {expandedRole.impact_metrics && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">📈 Impact & Metrics</h3>
                  <p className="text-gray-700">{expandedRole.impact_metrics}</p>
                </div>
              )}

              {/* Tags */}
              {expandedRole.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills & Technologies</h3>
                  <div className="flex flex-wrap gap-2">
                    {expandedRole.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <Button
                  onClick={() => setExpandedRole(null)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
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
