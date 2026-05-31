import { useState, useEffect } from 'react'
import Link from 'next/link'
import { withAuth } from '@/lib/middleware/withAuth'
import { useAuth } from '@/lib/context/AuthContext'
import { Button } from '@/components/common/Button'
import { PasteAnalyzer } from '@/components/dashboard/PasteAnalyzer'
import { CVUploadZone } from '@/components/upload/CVUploadZone'
import { ComponentLibraryUI } from '@/components/dashboard/ComponentLibraryUI'
import { CareerTimeline } from '@/components/dashboard/CareerTimeline'
import { JustApplyTab } from '@/components/dashboard/JustApplyTab'
import { MyApplicationsTab } from '@/components/dashboard/MyApplicationsTab'
import { CandidateBoard } from '@/components/dashboard/CandidateBoard'
import { normalizeComponentType } from '@/lib/componentTypeMapping'
import { supabase } from '@/lib/supabaseClient'

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
  tone_keywords?: string
  related_terms?: string
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
  type: 'kpi' | 'project' | 'achievement' | 'skill' | 'role' | 'voice' | 'context'
  title: string
  description: string
  organization_name?: string
  start_date?: string
  end_date?: string
  impact_metrics?: string
  primary_location?: string
  tags: string[]
  tone_keywords?: string
  related_terms?: string
}

interface ExtractedComponentPreview {
  type: string
  title: string
  organization_name?: string | null
  start_date?: string | null
  end_date?: string | null
  primary_location?: string | null
  description?: string | null
  impact_metrics?: string | null
  tags: string[]
  // True when a component matching this one already exists in the library, so
  // the review UI can flag it as "Already in library" and skip it by default.
  isExisting?: boolean
}

interface Application {
  id: string
  job_title: string
  company_name: string
  job_description?: string
  job_url?: string
  generated_cv: string
  generated_cover_letter: string
  generated_cv_json?: any
  generated_cover_letter_json?: any
  deadline?: string
  persons_of_interest?: string
  status: 'draft' | 'applied'
  created_at: string
  updated_at: string
}

// Format a role's start/end dates ("YYYY-MM-DD") into a year range like
// "2015 – 2018" or "2018 – Present". Years are parsed from the string directly
// to avoid timezone off-by-one issues with Date().
function formatComponentDateRange(start?: string | null, end?: string | null): string {
  const year = (d?: string | null) => (d && /^\d{4}/.test(d) ? d.slice(0, 4) : null)
  const sy = year(start)
  const ey = year(end)
  if (sy && ey) return `${sy} – ${ey}`
  if (sy && !ey) return `${sy} – Present`
  if (!sy && ey) return ey
  return ''
}

// A normalized identity key for a component, used to detect whether an
// extracted component already exists in the library (so re-uploading a CV
// surfaces only what's genuinely new). Roles are keyed by title + organization
// so multiple positions at the same company are treated as distinct.
function componentMatchKey(c: {
  type: string
  title?: string | null
  organization_name?: string | null
}): string {
  const norm = (s?: string | null) => (s || '').trim().toLowerCase()
  return `${norm(c.type)}::${norm(c.title)}::${norm(c.organization_name)}`
}

function Dashboard() {
  const [components, setComponents] = useState<CareerComponent[]>([])
  const [cvs, setCvs] = useState<CV[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [reviewComponents, setReviewComponents] = useState<ExtractedComponentPreview[]>([])
  const [reviewSelected, setReviewSelected] = useState<boolean[]>([])
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [approvingComponents, setApprovingComponents] = useState(false)
  // Voice tone keywords detected during the Analyze flow, applied (create/update
  // the "My Voice" component) only when the user approves the review.
  const [pendingVoice, setPendingVoice] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deletingComponent, setDeletingComponent] = useState<string | null>(null)
  const [deleteConfirmComponent, setDeleteConfirmComponent] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  // Status shown INSIDE the Import modal while/after analyzing pasted text,
  // so feedback appears where the user is working rather than as a banner on
  // the page behind the modal.
  const [analyzeStatus, setAnalyzeStatus] = useState<{ text: string; variant: 'info' | 'success' | 'error' } | null>(null)
  const [settingsTab, setSettingsTab] = useState<'profile' | 'security'>('profile')
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    basedIn: '',
    openToRelocation: false,
    relocationLocations: '',
    remotePreference: '',
    website: '',
    linkedinUrl: '',
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
    tone_keywords: '',
    related_terms: '',
    organization_name: '',
    start_date: '',
    end_date: '',
    impact_metrics: '',
    primary_location: '',
  })
  const [analyzing, setAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState<'library' | 'timeline' | 'justApply' | 'myApplications' | 'candidateBoard'>('library')
  const [editingComponent, setEditingComponent] = useState<CareerComponent | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<CareerComponent>>({})
  const [savingEdit, setSavingEdit] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importTab, setImportTab] = useState<'paste' | 'upload'>('paste')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importUploading, setImportUploading] = useState(false)
  const [importUploadError, setImportUploadError] = useState('')
  const [importUploadSuccess, setImportUploadSuccess] = useState(false)
  const [expandedRole, setExpandedRole] = useState<CareerComponent | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [generatingApplication, setGeneratingApplication] = useState(false)
  const [savingApplicationStatus, setSavingApplicationStatus] = useState<string | null>(null)
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
      const { data: rawProfileData } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, phone, address, based_in, open_to_relocation, relocation_locations, remote_preference, website, linkedin_url')
        .eq('id', session.user.id)
        .single()

      if (rawProfileData) {
        const profileData = rawProfileData as any
        setProfileData({
          firstName: profileData.first_name || '',
          lastName: profileData.last_name || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          // Fall back to the legacy free-text address so existing users keep
          // their location until they re-save with the structured field.
          basedIn: profileData.based_in || profileData.address || '',
          openToRelocation: !!profileData.open_to_relocation,
          relocationLocations: profileData.relocation_locations || '',
          remotePreference: profileData.remote_preference || '',
          website: profileData.website || '',
          linkedinUrl: profileData.linkedin_url || '',
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

      // Fetch applications
      const { data: applicationData } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (applicationData) {
        setApplications(applicationData)
      }

      setLoading(false)
    }

    fetchData()
  }, [session])

  // Normalize raw extracted components from the API into review previews and
  // flag any that already exist in the current library.
  const prepareReviewComponents = (raw: any[]): ExtractedComponentPreview[] => {
    const existingKeys = new Set(components.map((c) => componentMatchKey(c)))
    return (raw || []).map((c: any) => {
      const type = normalizeComponentType(c.type)
      const title = c.title || 'Untitled'
      const organization_name = c.organization_name || null
      return {
        type,
        title,
        organization_name,
        start_date: c.start_date || null,
        end_date: c.end_date || null,
        primary_location: c.primary_location || null,
        description: c.description || null,
        impact_metrics: c.impact_metrics || null,
        tags: Array.isArray(c.tags) ? c.tags : [],
        isExisting: existingKeys.has(componentMatchKey({ type, title, organization_name })),
      }
    })
  }

  // Open the review modal with new (non-duplicate) components pre-selected.
  const openReviewModal = (extracted: ExtractedComponentPreview[]) => {
    setReviewComponents(extracted)
    setReviewSelected(extracted.map((c) => !c.isExisting))
    setShowReviewModal(true)
  }

  const handleExtractComponents = async () => {
    if (!session?.access_token) return

    setExtracting(true)
    try {
      // Preview mode: get the extracted components back WITHOUT saving them,
      // so the user can review and approve/deny before they hit the library.
      const response = await fetch('/api/extract-components?preview=1', {
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
      const extracted = prepareReviewComponents(data.components || [])

      if (extracted.length === 0) {
        alert('No components could be extracted from your documents. Try uploading a more detailed CV.')
        return
      }

      // Close the import modal (if open) and open the review modal. Pre-select
      // only the components that aren't already in the library so re-extracting
      // surfaces the update loop instead of duplicating everything.
      setShowImportModal(false)
      setImportUploadSuccess(false)
      setImportFile(null)
      openReviewModal(extracted)
    } catch (err) {
      console.error('Extraction error:', err)
      alert(err instanceof Error ? err.message : 'Failed to extract components')
    } finally {
      setExtracting(false)
    }
  }

  const toggleReviewComponent = (index: number) => {
    setReviewSelected((prev) => prev.map((sel, i) => (i === index ? !sel : sel)))
  }

  const setAllReviewSelected = (value: boolean) => {
    setReviewSelected(reviewComponents.map(() => value))
  }

  const closeReviewModal = () => {
    setShowReviewModal(false)
    setReviewComponents([])
    setReviewSelected([])
    setPendingVoice(null)
  }

  // Approve: insert the selected components into the library.
  const handleApproveComponents = async () => {
    if (!session?.user?.id) return

    const approved = reviewComponents.filter((_, i) => reviewSelected[i])
    if (approved.length === 0) {
      alert('Select at least one component to add, or discard them all.')
      return
    }

    setApprovingComponents(true)
    try {
      const { error: insertError } = await (supabase.from('career_components') as any).insert(
        approved.map((c) => ({
          user_id: session.user.id,
          type: c.type,
          title: c.title,
          organization_name: c.organization_name || null,
          start_date: c.start_date || null,
          end_date: c.end_date || null,
          primary_location: c.primary_location || null,
          description: c.description || null,
          impact_metrics: c.impact_metrics || null,
          tags: c.tags || [],
          source: 'parsed_from_documents',
        }))
      )

      if (insertError) throw new Error(insertError.message)

      // Apply any voice detected during analysis (create or update "My Voice").
      let voiceApplied = false
      if (pendingVoice) {
        const existingVoice = components.find((c) => c.type === 'voice')
        if (existingVoice) {
          await (supabase.from('career_components') as any)
            .update({
              tone_keywords: pendingVoice,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingVoice.id)
        } else {
          await (supabase.from('career_components') as any).insert({
            user_id: session.user.id,
            type: 'voice',
            title: 'My Voice',
            description: 'Your communication style and tone extracted from cover letters',
            tone_keywords: pendingVoice,
            tags: [],
            source: 'auto-extracted',
          })
        }
        voiceApplied = true
      }

      // Refetch components so the library reflects the additions.
      const { data: updatedComponents } = await supabase
        .from('career_components')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (updatedComponents) {
        setComponents(
          updatedComponents.map((comp: any) => ({
            ...comp,
            type: normalizeComponentType(comp.type),
          }))
        )
      }

      closeReviewModal()
      setActiveTab('library')
      const voiceMsg = voiceApplied ? ' + Voice profile updated' : ''
      setSuccessMessage(`✅ Added ${approved.length} component${approved.length !== 1 ? 's' : ''} to your library${voiceMsg}`)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error('Approve components error:', err)
      alert(err instanceof Error ? err.message : 'Failed to add components')
    } finally {
      setApprovingComponents(false)
    }
  }

  // Deny: discard the extracted components without saving anything.
  const handleDenyComponents = () => {
    closeReviewModal()
  }

  const refetchCvs = async () => {
    if (!session?.user?.id) return
    const { data: cvData } = await supabase
      .from('cvs')
      .select('id, filename, file_size_bytes, created_at, storage_path')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    if (cvData) {
      setCvs(cvData)
    }
  }

  const handleImportUpload = async () => {
    if (!importFile) {
      setImportUploadError('Please select a file')
      return
    }
    if (!session?.access_token) {
      setImportUploadError('Authentication failed. Please log in again.')
      return
    }

    setImportUploading(true)
    setImportUploadError('')
    setImportUploadSuccess(false)

    try {
      const arrayBuffer = await importFile.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      const response = await fetch('/api/upload-cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Filename': importFile.name,
          'X-Mime-Type': importFile.type,
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: uint8Array.buffer,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Upload failed')
      }

      const uploadResult = await response.json().catch(() => ({} as any))
      await refetchCvs()
      setImportUploadSuccess(true)
      setImportFile(null)

      // Don't leave the user at a dead-end: immediately extract components from
      // the file they just uploaded and surface them in the review modal.
      const uploadedText: string = uploadResult?.extractedText || ''
      if (uploadedText.trim().length > 0) {
        await extractAndReviewFromText(uploadedText)
      }
    } catch (err) {
      console.error('Import upload error:', err)
      setImportUploadError(err instanceof Error ? err.message : 'An error occurred during upload')
    } finally {
      setImportUploading(false)
    }
  }

  // Extract components (preview) from a single chunk of text and open the review
  // modal. Shared by the file-upload and paste-analyze flows.
  const extractAndReviewFromText = async (text: string) => {
    if (!session?.access_token) return
    try {
      const r = await fetch('/api/extract-components?preview=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ text }),
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        throw new Error(d.error || 'Extraction failed')
      }
      const d = await r.json()
      const extracted = prepareReviewComponents(d.components || [])
      if (extracted.length === 0) {
        setSuccessMessage('Uploaded — but we couldn’t pull any components out of that file.')
        setTimeout(() => setSuccessMessage(''), 4000)
        return
      }
      setShowImportModal(false)
      setImportUploadSuccess(false)
      openReviewModal(extracted)
    } catch (err) {
      console.error('Extract-after-upload error:', err)
      // Non-fatal: the CV is saved; the user can still use "Extract components now".
      setSuccessMessage('Uploaded. Click “Extract components now” to add components.')
      setTimeout(() => setSuccessMessage(''), 4000)
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
        organization_name: formData.organization_name || null,
        description: formData.description,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        impact_metrics: formData.impact_metrics || null,
        primary_location: formData.primary_location || null,
        tags: formData.tags,
        tone_keywords: formData.tone_keywords || null,
        related_terms: formData.related_terms || null,
        source: 'manual',
      } as any)

      if (!error) {
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

        setFormData({
          type: 'achievement',
          title: '',
          description: '',
          tags: [],
          tone_keywords: '',
          related_terms: '',
          primary_location: '',
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
    setAnalyzeStatus({
      text: '✨ Analyzing your documents… This can take a moment.',
      variant: 'info',
    })

    try {
      // Step 1: Classify and split the pasted text into documents + voice.
      const classifyResponse = await fetch('/api/analyze-mixed-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!classifyResponse.ok) {
        const data = await classifyResponse.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to classify documents')
      }

      const { documents, voice } = await classifyResponse.json()

      if (!documents || documents.length === 0) {
        throw new Error('No documents found in the pasted text')
      }

      const docs = documents as Array<{ type: 'cv' | 'coverLetter'; content: string }>

      setAnalyzeStatus({
        text: '✨ Pulling out your roles, skills and achievements…',
        variant: 'info',
      })

      // Step 2: Extract components from EACH document in preview mode. The text
      // is passed in the request body so we extract from exactly what was
      // pasted (not stale stored CVs). Nothing is saved yet — the user reviews
      // and approves below.
      const previewResults = await Promise.all(
        docs.map(async (doc) => {
          try {
            const r = await fetch('/api/extract-components?preview=1', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ text: doc.content }),
            })
            if (!r.ok) {
              const d = await r.json().catch(() => ({}))
              throw new Error(d.error || `Extraction failed for a ${doc.type}`)
            }
            const d = await r.json()
            return (d.components || []) as any[]
          } catch (err) {
            console.error(`Failed to extract components from ${doc.type}:`, err)
            return [] as any[]
          }
        })
      )

      // Flatten, then de-duplicate within this batch (the same role can appear
      // in multiple pasted docs) by identity key.
      const seen = new Set<string>()
      const rawComponents: any[] = []
      for (const comp of previewResults.flat()) {
        const key = componentMatchKey({
          type: normalizeComponentType(comp.type),
          title: comp.title,
          organization_name: comp.organization_name,
        })
        if (seen.has(key)) continue
        seen.add(key)
        rawComponents.push(comp)
      }

      const extracted = prepareReviewComponents(rawComponents)

      if (extracted.length === 0) {
        setAnalyzeStatus({
          text: '⚠️ We couldn’t pull any components out of that text. Try pasting a more detailed CV.',
          variant: 'error',
        })
        return
      }

      // Stash voice so it's applied only if the user approves the review.
      setPendingVoice(voice?.toneKeywords || null)

      // Hand off to the review modal. The user sees exactly what was found
      // (including multiple roles at the same company) and what's new vs.
      // already in their library, then approves.
      setAnalyzeStatus(null)
      setShowImportModal(false)
      openReviewModal(extracted)
    } catch (err) {
      console.error('Analysis error:', err)
      setAnalyzeStatus({
        text: `❌ ${err instanceof Error ? err.message : 'Failed to analyze text'}`,
        variant: 'error',
      })
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
      primary_location: component.primary_location,
      tags: component.tags || [],
    })
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id || !editingComponent?.id) return

    setSavingEdit(true)
    try {
      const { error } = await (supabase
        .from('career_components') as any)
        .update({
          type: editFormData.type,
          title: editFormData.title,
          description: editFormData.description || null,
          start_date: editFormData.start_date || null,
          end_date: editFormData.end_date || null,
          impact_metrics: editFormData.impact_metrics || null,
          primary_location: editFormData.primary_location || null,
          tags: editFormData.tags || [],
          tone_keywords: editFormData.tone_keywords || null,
          related_terms: editFormData.related_terms || null,
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

  // Advice step: analyse a pasted job ad against the user's career library and
  // return employer keywords + recommended components to highlight. Errors
  // bubble up so the wizard can stay on the input step and show a message.
  const handleAnalyzeJob = async (
    jobDescription: string,
    jobTitle?: string,
    company?: string
  ) => {
    if (!session?.access_token) throw new Error('Not authenticated')

    const response = await fetch('/api/analyze-job', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ jobDescription, jobTitle, company }),
    })

    if (!response.ok) {
      const d = await response.json().catch(() => ({}))
      throw new Error(d.error || 'Failed to analyse job')
    }

    return response.json() as Promise<{
      success: boolean
      keywords: string[]
      thesis: string
      recommendations: Array<{ id: string; title: string; type: string; reason: string }>
    }>
  }

  const handleGenerateApplication = async (
    jobDescription: string,
    jobTitle?: string,
    company?: string,
    selectedComponentIds?: string[]
  ) => {
    if (!session?.access_token || !session?.user?.id) return

    setGeneratingApplication(true)
    try {
      const response = await fetch('/api/generate-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ jobDescription, jobTitle, company, selectedComponentIds }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate application')
      }

      const data = await response.json()

      // Insert the application into the database. We persist Claude's STRUCTURED
      // JSON (the source of truth for exports) alongside the flattened text, so
      // templates render real fields instead of regex-guessing them back.
      const { data: inserted, error } = await supabase
        .from('applications')
        .insert({
          user_id: session.user.id,
          job_title: jobTitle || 'Untitled Position',
          company_name: company || 'Unknown Company',
          job_description: jobDescription,
          generated_cv: data.cv,
          generated_cover_letter: data.coverLetter,
          generated_cv_json: data.cvStructured ?? null,
          generated_cover_letter_json: data.coverLetterStructured ?? null,
          status: 'draft',
        } as any)
        .select()
        .single()

      if (error) throw error

      // Refetch applications
      const { data: appData } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (appData) {
        setApplications(appData)
      }

      alert('✅ Application generated successfully!')
      return inserted
    } catch (err) {
      console.error('Generation error:', err)
      throw err
    } finally {
      setGeneratingApplication(false)
    }
  }

  const handleDeleteApplication = async (id: string) => {
    if (!session?.user?.id) return

    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id)

      if (error) throw error

      setApplications(applications.filter((app) => app.id !== id))
    } catch (err) {
      console.error('Delete error:', err)
      throw err
    }
  }

  const handleRegenerateApplication = async (id: string) => {
    if (!session?.access_token || !session?.user?.id) return
    const app = applications.find((a) => a.id === id)
    if (!app) return

    setGeneratingApplication(true)
    try {
      // Regenerate content for THIS application and update it in place. (The old
      // implementation called the create handler, which inserted a duplicate row
      // and left the original showing stale content.)
      const response = await fetch('/api/generate-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          jobDescription: app.job_description || '',
          jobTitle: app.job_title,
          company: app.company_name,
        }),
      })

      if (!response.ok) {
        const d = await response.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to regenerate application')
      }

      const data = await response.json()

      const { data: updated, error } = await (supabase.from('applications') as any)
        .update({
          generated_cv: data.cv,
          generated_cover_letter: data.coverLetter,
          generated_cv_json: data.cvStructured ?? null,
          generated_cover_letter_json: data.coverLetterStructured ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', session.user.id)
        .select()
        .single()

      if (error) throw error
      if (updated) {
        setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)))
      }
    } catch (err) {
      console.error('Regenerate error:', err)
      throw err
    } finally {
      setGeneratingApplication(false)
    }
  }

  const handleUpdateApplicationStatus = async (id: string, status: 'draft' | 'applied') => {
    if (!session?.access_token) return

    setSavingApplicationStatus(id)
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update application')
      }

      const data = await response.json()

      // Update local state
      setApplications(applications.map((app) => (app.id === id ? data.data : app)))
    } catch (err) {
      console.error('Update application error:', err)
      throw err
    } finally {
      setSavingApplicationStatus(null)
    }
  }

  const handleUpdateApplication = async (
    id: string,
    data: { generated_cv: string; generated_cover_letter: string; job_url?: string; deadline?: string; persons_of_interest?: string }
  ) => {
    if (!session?.access_token) return

    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const responseData = await response.json()
        throw new Error(responseData.error || 'Failed to update application')
      }

      const responseData = await response.json()

      // Update local state
      setApplications(applications.map((app) => (app.id === id ? responseData.data : app)))
    } catch (err) {
      console.error('Update application error:', err)
      throw err
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start gap-8">
            <Link href="/" className="flex-shrink-0">
              <img src="/logo-light.svg" alt="justapply" className="h-12" />
            </Link>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome{profileData.firstName ? ` back, ${profileData.firstName}` : ' to JustApply'}
              </h1>
              <p className="text-gray-600 mt-1">
                Build your professional story, then apply smarter.
              </p>
            </div>

            <div className="flex gap-3 items-center flex-shrink-0">
              <Button
                onClick={() => setActiveTab('justApply')}
                className="whitespace-nowrap flex items-center gap-2 py-2 px-4"
              >
                <svg width="18" height="18" viewBox="100 50 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                  <path d="M288 228.005H266.667V126.079C266.667 122.286 264.691 118.573 263.704 117.19L244.741 99.4124C242.784 97.5782 237.235 96.2519 234.667 95.8568H157.63V74.5235C179.358 74.1285 225.778 73.5754 237.63 74.5235C249.481 75.4717 257.185 80.4494 259.556 82.8198L276.741 99.4124C282.549 105.02 288 111.857 288 117.19V133.19V228.005Z" fill="white" stroke="white"/>
                  <path d="M234.074 109.556C236.445 109.556 244.741 117.852 244.741 117.852C244.782 117.893 252.444 125.562 252.444 127.926V256.519H140.444L208.593 188.963V218H224V163.482C224 161.111 221.629 158.74 219.852 158.74H165.333V175.333H194.37L128 240.519V109.556H234.074Z" fill="white"/>
                </svg>
                Just Apply
              </Button>
              <button
                onClick={() => setShowSettings(true)}
                className="text-gray-600 hover:text-gray-900 font-medium transition text-sm px-3 py-2"
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="w-full space-y-4">
            {/* Success Banner — hidden while any modal is open so status never
                appears on the dimmed page behind a pop-up; the modals surface
                their own in-context status instead. */}
            {successMessage &&
              !showImportModal &&
              !showSettings &&
              !showReviewModal &&
              !showAddForm &&
              !editingComponent &&
              !expandedRole && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                  <p className="text-orange-700">{successMessage}</p>
                </div>
              )}

            {/* Tell Us More About You - if first name not set */}
            {!profileData.firstName && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-1 text-sm">Complete your profile</h3>
                <p className="text-blue-800 text-xs mb-3">
                  Add your name and contact info to personalize your applications.
                </p>
                <Button onClick={() => setShowSettings(true)} variant="outline" className="text-sm">
                  Complete Profile
                </Button>
              </div>
            )}

            {/* Tabs for Library, Timeline, Just Apply, and My Applications */}
            <div className="space-y-4">
              <div className="flex gap-4 border-b border-gray-200 overflow-x-auto">
                {components.length > 0 && (
                  <>
                    <button
                      onClick={() => setActiveTab('library')}
                      className={`px-3 py-2 text-sm font-medium transition border-b-2 whitespace-nowrap ${
                        activeTab === 'library'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-orange-600'
                      }`}
                    >
                      Components
                    </button>
                    <button
                      onClick={() => setActiveTab('timeline')}
                      className={`px-3 py-2 text-sm font-medium transition border-b-2 whitespace-nowrap ${
                        activeTab === 'timeline'
                          ? 'border-magenta-500 text-magenta-600'
                          : 'border-transparent text-gray-600 hover:text-magenta-600'
                      }`}
                    >
                      Timeline
                    </button>
                  </>
                )}
                <button
                  onClick={() => setActiveTab('justApply')}
                  className={`px-3 py-2 text-sm font-medium transition border-b-2 whitespace-nowrap ${
                    activeTab === 'justApply'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-600 hover:text-gray-700'
                  }`}
                >
                  Just Apply
                </button>
                {applications.length > 0 && (
                  <>
                    <button
                      onClick={() => setActiveTab('myApplications')}
                      className={`px-3 py-2 text-sm font-medium transition border-b-2 whitespace-nowrap ${
                        activeTab === 'myApplications'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-blue-600'
                      }`}
                    >
                      Applications ({applications.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('candidateBoard')}
                      className={`px-3 py-2 text-sm font-medium transition border-b-2 whitespace-nowrap ${
                        activeTab === 'candidateBoard'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-700'
                      }`}
                    >
                      Candidate Board
                    </button>
                  </>
                )}
              </div>

              {/* Component Library */}
              {activeTab === 'library' && components.length > 0 && (
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
              {activeTab === 'timeline' && components.length > 0 && (
                <CareerTimeline
                  components={components}
                  expandedRole={expandedRole}
                  onRoleClick={setExpandedRole}
                />
              )}

              {/* Just Apply Tab */}
              {activeTab === 'justApply' && (
                <JustApplyTab
                  onAnalyze={handleAnalyzeJob}
                  onSubmit={handleGenerateApplication}
                  components={components}
                  loading={generatingApplication}
                />
              )}

              {/* My Applications Tab */}
              {activeTab === 'myApplications' && (
                <MyApplicationsTab
                  applications={applications}
                  onDelete={handleDeleteApplication}
                  onRegenerate={handleRegenerateApplication}
                  onSaveStatus={handleUpdateApplicationStatus}
                  onUpdateApplication={handleUpdateApplication}
                  loading={generatingApplication}
                  authToken={session?.access_token}
                />
              )}

              {/* Candidate Board Tab */}
              {activeTab === 'candidateBoard' && (
                <CandidateBoard
                  applications={applications}
                  onStatusChange={handleUpdateApplicationStatus}
                  onDelete={handleDeleteApplication}
                  onRegenerate={handleRegenerateApplication}
                  onUpdateApplication={handleUpdateApplication}
                  loading={generatingApplication}
                  authToken={session?.access_token}
                />
              )}
            </div>

            {/* Empty State for Components */}
            {!loading && components.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                <div>
                  <p className="text-gray-700 font-medium">Ready to build your profile?</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Add your experience information to get started. We'll intelligently extract your roles, achievements, skills, and experience.
                  </p>
                </div>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button onClick={() => setShowImportModal(true)}>
                    Import your experience
                  </Button>
                  <Button onClick={() => setShowAddForm(true)} variant="outline">
                    Add component
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

                  {/* About Me — Location. Two cards: where the user is based
                      (authoritative source for the CV header location) and
                      whether they're open to relocating. */}
                  <div className="pt-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">About Me</h3>
                    <div className="space-y-3">
                      {/* Card 1: Where are you based? */}
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">📍</span>
                          <label className="block text-sm font-medium text-gray-900">
                            Where are you based?
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          This is shown on your CV. Use the format “City, Country”.
                        </p>
                        <input
                          type="text"
                          value={profileData.basedIn}
                          onChange={(e) => setProfileData({ ...profileData, basedIn: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary"
                          placeholder="e.g., Brussels, Belgium"
                        />
                      </div>

                      {/* Card 2: Open to relocation? */}
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">✈️</span>
                            <label htmlFor="openToRelocation" className="block text-sm font-medium text-gray-900">
                              Open to relocation?
                            </label>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              id="openToRelocation"
                              type="checkbox"
                              className="sr-only peer"
                              checked={profileData.openToRelocation}
                              onChange={(e) => setProfileData({ ...profileData, openToRelocation: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                          </label>
                        </div>

                        {profileData.openToRelocation && (
                          <div className="mt-3 space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Where would you relocate to?
                              </label>
                              <input
                                type="text"
                                value={profileData.relocationLocations}
                                onChange={(e) => setProfileData({ ...profileData, relocationLocations: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary"
                                placeholder="e.g., London, Amsterdam, anywhere in the EU"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Work-location preference
                              </label>
                              <select
                                value={profileData.remotePreference}
                                onChange={(e) => setProfileData({ ...profileData, remotePreference: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary"
                              >
                                <option value="">No preference</option>
                                <option value="onsite">On-site</option>
                                <option value="hybrid">Hybrid</option>
                                <option value="remote">Remote</option>
                                <option value="flexible">Flexible</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Professional Website or Portfolio
                    </label>
                    <input
                      type="url"
                      value={profileData.website}
                      onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="https://yourportfolio.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="url"
                      value={profileData.linkedinUrl}
                      onChange={(e) => setProfileData({ ...profileData, linkedinUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="https://linkedin.com/in/yourprofile"
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
                onClick={() => {
                  setShowImportModal(false)
                  setImportFile(null)
                  setImportUploadError('')
                  setImportUploadSuccess(false)
                  setAnalyzeStatus(null)
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Analyze status — shown inside the modal so feedback stays where
                the user is working */}
            {analyzeStatus && (
              <div
                className={`rounded-lg p-3 text-sm mb-6 border ${
                  analyzeStatus.variant === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : analyzeStatus.variant === 'error'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-orange-50 border-orange-200 text-orange-700'
                }`}
              >
                {analyzeStatus.text}
              </div>
            )}

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
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Upload your CV or documents</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Upload PDF or DOCX files. We'll extract and analyze your experience.
                  </p>
                </div>

                {importUploadSuccess ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center space-y-4">
                    <div className="text-4xl">✓</div>
                    <div>
                      <p className="font-semibold text-green-900">CV uploaded successfully</p>
                      <p className="text-sm text-green-800 mt-1">
                        Turn it into career components, or upload another file.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        onClick={handleExtractComponents}
                        loading={extracting}
                      >
                        🤖 Extract components now
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setImportUploadSuccess(false)
                          setImportUploadError('')
                        }}
                      >
                        Upload another file
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <CVUploadZone
                      onFileSelect={(file) => {
                        setImportFile(file)
                        setImportUploadError('')
                      }}
                      isLoading={importUploading}
                    />

                    {importUploadError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                        {importUploadError}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        onClick={handleImportUpload}
                        loading={importUploading}
                        disabled={!importFile}
                        className="flex-1"
                      >
                        Upload CV
                      </Button>
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                      PDF or DOCX up to 10 MB. Not sure how to export your CV? Try the{' '}
                      <button onClick={() => setImportTab('paste')} className="text-blue-600 font-semibold hover:underline">
                        Paste Information
                      </button>{' '}
                      tab instead.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Extracted Components Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-8 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Review extracted components</h2>
                <p className="text-gray-600 text-sm mt-1">
                  {(() => {
                    const newCount = reviewComponents.filter((c) => !c.isExisting).length
                    const existingCount = reviewComponents.length - newCount
                    return (
                      <>
                        We found {reviewComponents.length} component{reviewComponents.length !== 1 ? 's' : ''} in your
                        document{reviewComponents.length !== 1 ? 's' : ''}
                        {existingCount > 0 ? (
                          <> — <span className="font-semibold text-green-700">{newCount} new</span> and {existingCount} already in your library</>
                        ) : (
                          <> — all new</>
                        )}
                        . New ones are pre-selected; uncheck anything you don't want.
                      </>
                    )
                  })()}
                </p>
              </div>
              <button
                onClick={handleDenyComponents}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold ml-4"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Select all / none */}
            <div className="flex items-center gap-4 text-sm mb-4">
              <span className="text-gray-700 font-medium">
                {reviewSelected.filter(Boolean).length} of {reviewComponents.length} selected
              </span>
              <button
                onClick={() => setAllReviewSelected(true)}
                className="text-blue-600 font-semibold hover:underline"
              >
                Select all
              </button>
              {reviewComponents.some((c) => c.isExisting) && (
                <button
                  onClick={() => setReviewSelected(reviewComponents.map((c) => !c.isExisting))}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Select new only
                </button>
              )}
              <button
                onClick={() => setAllReviewSelected(false)}
                className="text-blue-600 font-semibold hover:underline"
              >
                Select none
              </button>
            </div>

            {/* Component list */}
            <div className="flex-1 overflow-y-auto space-y-3 -mx-2 px-2">
              {reviewComponents.map((comp, index) => {
                const selected = reviewSelected[index]
                return (
                  <label
                    key={index}
                    className={`flex gap-3 p-4 rounded-lg border cursor-pointer transition ${
                      selected
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleReviewComponent(index)}
                      className="mt-1 h-4 w-4 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-block text-xs font-semibold uppercase tracking-wide text-blue-700 bg-blue-100 rounded px-2 py-0.5">
                          {comp.type}
                        </span>
                        {comp.isExisting ? (
                          <span className="inline-block text-xs font-semibold text-gray-600 bg-gray-200 rounded px-2 py-0.5">
                            Already in library
                          </span>
                        ) : (
                          <span className="inline-block text-xs font-semibold text-green-700 bg-green-100 rounded px-2 py-0.5">
                            New
                          </span>
                        )}
                        <span className="font-semibold text-gray-900">{comp.title}</span>
                      </div>
                      {(comp.organization_name || comp.start_date || comp.end_date || comp.primary_location) && (
                        <p className="text-sm text-gray-600 mt-0.5">
                          {[
                            comp.organization_name,
                            formatComponentDateRange(comp.start_date, comp.end_date),
                            comp.primary_location,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}
                      {comp.description && (
                        <p className="text-sm text-gray-700 mt-1">{comp.description}</p>
                      )}
                      {comp.impact_metrics && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Impact:</span> {comp.impact_metrics}
                        </p>
                      )}
                      {comp.tags && comp.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {comp.tags.map((tag, t) => (
                            <span
                              key={t}
                              className="text-xs text-gray-600 bg-gray-200 rounded-full px-2 py-0.5"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-gray-200">
              <Button
                onClick={handleApproveComponents}
                loading={approvingComponents}
                disabled={reviewSelected.filter(Boolean).length === 0}
                className="flex-1"
              >
                Add {reviewSelected.filter(Boolean).length || ''} to library
              </Button>
              <Button
                variant="outline"
                onClick={handleDenyComponents}
                disabled={approvingComponents}
                className="flex-1"
              >
                Discard all
              </Button>
            </div>
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
                    <option value="context">Context</option>
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

              {editFormData.type === 'role' && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editFormData.primary_location || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, primary_location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="e.g., San Francisco, CA or Remote or Hybrid - London"
                  />
                </div>
              )}

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

              {editFormData.type === 'voice' && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Tone Keywords
                  </label>
                  <input
                    type="text"
                    value={editFormData.tone_keywords || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, tone_keywords: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="e.g., direct, warm, analytical, storytelling-focused"
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated keywords describing your communication style</p>
                </div>
              )}

              {editFormData.type === 'context' && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Related Terms
                  </label>
                  <input
                    type="text"
                    value={editFormData.related_terms || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, related_terms: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Politico Pro, subscription strategy, B2B SaaS"
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated related concepts this term explains</p>
                </div>
              )}

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

      {/* Add Component Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Component</h2>
            <form onSubmit={handleAddComponent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="achievement">Achievement</option>
                    <option value="skill">Skill</option>
                    <option value="role">Role</option>
                    <option value="project">Project</option>
                    <option value="kpi">KPI</option>
                    <option value="voice">Voice</option>
                    <option value="context">Context</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    value={formData.start_date || ''}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date || ''}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
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
                  value={formData.impact_metrics || ''}
                  onChange={(e) => setFormData({ ...formData, impact_metrics: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Increased sales by 40%"
                />
              </div>

              {formData.type === 'role' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Company/Organization *
                    </label>
                    <input
                      type="text"
                      value={formData.organization_name || ''}
                      onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="e.g., Acme Corp, Google, Startup Inc"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.primary_location || ''}
                      onChange={(e) => setFormData({ ...formData, primary_location: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="e.g., San Francisco, CA or Remote"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="e.g., React, TypeScript, Performance"
                />
              </div>

              {formData.type === 'voice' && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Tone Keywords
                  </label>
                  <input
                    type="text"
                    value={formData.tone_keywords || ''}
                    onChange={(e) => setFormData({ ...formData, tone_keywords: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="e.g., direct, warm, analytical, storytelling-focused"
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated keywords describing your communication style</p>
                </div>
              )}

              {formData.type === 'context' && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Related Terms
                  </label>
                  <input
                    type="text"
                    value={formData.related_terms || ''}
                    onChange={(e) => setFormData({ ...formData, related_terms: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Politico Pro, subscription strategy, B2B SaaS"
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated related concepts this term explains</p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button type="submit" loading={saving} className="flex-1">
                  Add Component
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
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
