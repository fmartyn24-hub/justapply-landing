import { useState, useEffect } from 'react'
import { Button } from '@/components/common/Button'
import { ExportTemplateSelector } from './ExportTemplateSelector'
import { type ApplicationStatus } from '@/lib/applicationStatus'
import { StatusSelect } from '@/components/common/StatusSelect'
import { GenerationOptionsModal, type GenerationChoices } from './GenerationOptionsModal'

const ONE_PAGE_WORD_LIMIT = 320

interface LibraryComponent {
  id: string
  type: string
  title: string
  organization_name?: string
}

interface ApplicationPreviewProps {
  id?: string
  coverLetter: string
  cvAdvice?: string
  jobTitle?: string
  company?: string
  jobDescription?: string
  jobUrl?: string
  deadline?: string
  personsOfInterest?: string
  status?: ApplicationStatus
  components?: LibraryComponent[]
  onSave?: (id: string, data: { generated_cover_letter: string; job_title?: string; company_name?: string; job_description?: string; job_url?: string; deadline?: string; persons_of_interest?: string; status?: ApplicationStatus }) => Promise<void>
  onStatusChange?: (status: ApplicationStatus) => Promise<void>
  onGenerated?: (id: string, data: { generated_cover_letter?: string; cv_advice?: string }) => void
  onClose: () => void
  saving?: boolean
  authToken?: string
}

function AiBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-primary/20 text-blue-300 border border-primary/40">
      <AiBoltIcon size={10} />
      AI Powered
    </span>
  )
}

// Same bolt used by the sidebar's "AI-Powered" section marker — a compact
// way to flag a control as an AI feature (one that would be gated behind a
// paid plan) without the full pill taking over a small toolbar button.
function AiBoltIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
      <path d="M13 2 3 14h7l-1 8 11-14h-7l0-6Z" />
    </svg>
  )
}

export function ApplicationPreview({
  id,
  coverLetter,
  cvAdvice,
  jobTitle,
  company,
  jobDescription,
  jobUrl,
  deadline,
  personsOfInterest,
  status,
  components = [],
  onSave,
  onStatusChange,
  onGenerated,
  onClose,
  saving,
  authToken,
}: ApplicationPreviewProps) {
  const [activeTab, setActiveTab] = useState<'coverLetter' | 'cvAdvice' | 'details'>('coverLetter')
  const [editedCoverLetter, setEditedCoverLetter] = useState(coverLetter)
  const [currentCvAdvice, setCurrentCvAdvice] = useState(cvAdvice || '')
  const [editedJobTitle, setEditedJobTitle] = useState(jobTitle || '')
  const [editedCompany, setEditedCompany] = useState(company || '')
  const [editedJobDescription, setEditedJobDescription] = useState(jobDescription || '')
  const [editedJobUrl, setEditedJobUrl] = useState(jobUrl || '')
  const [editedDeadline, setEditedDeadline] = useState(deadline || '')
  const [editedPersonsOfInterest, setEditedPersonsOfInterest] = useState(personsOfInterest || '')
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)
  const [generating, setGenerating] = useState<'coverLetter' | 'cvAdvice' | null>(null)
  const [generateError, setGenerateError] = useState('')
  const [showGenerationOptions, setShowGenerationOptions] = useState(false)

  // Auto-save functionality — cover letter text + details fields only. Status
  // changes save immediately on select (see handleStatusChange); CV advice
  // is AI output, not something typed character-by-character, so it isn't
  // part of this debounce.
  useEffect(() => {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout)

    if (
      editedCoverLetter === coverLetter &&
      editedJobTitle === (jobTitle || '') &&
      editedCompany === (company || '') &&
      editedJobDescription === (jobDescription || '') &&
      editedJobUrl === jobUrl &&
      editedDeadline === deadline &&
      editedPersonsOfInterest === personsOfInterest
    ) {
      return
    }

    setAutoSaveStatus('saving')

    const timeout = setTimeout(async () => {
      if (onSave && id) {
        try {
          await onSave(id, {
            generated_cover_letter: editedCoverLetter,
            job_title: editedJobTitle || undefined,
            company_name: editedCompany || undefined,
            job_description: editedJobDescription || undefined,
            job_url: editedJobUrl || undefined,
            deadline: editedDeadline || undefined,
            persons_of_interest: editedPersonsOfInterest || undefined,
          })
          setAutoSaveStatus('saved')
          setTimeout(() => setAutoSaveStatus('idle'), 2000)
        } catch (err) {
          console.error('Auto-save error:', err)
          setAutoSaveStatus('idle')
        }
      }
    }, 1500)

    setAutoSaveTimeout(timeout)

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [editedCoverLetter, editedJobTitle, editedCompany, editedJobDescription, editedJobUrl, editedDeadline, editedPersonsOfInterest])

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!onStatusChange) return
    setChangingStatus(true)
    try {
      await onStatusChange(newStatus)
    } finally {
      setChangingStatus(false)
    }
  }

  const handleGenerate = async (choices: GenerationChoices) => {
    if (!id || !authToken) return
    if (!editedJobDescription.trim()) {
      setGenerateError('Add a job description in Details first — generation needs it to tailor the content.')
      setActiveTab('details')
      setShowGenerationOptions(false)
      return
    }
    setGenerateError('')
    setGenerating('coverLetter')
    try {
      const res = await fetch(`/api/applications/${id}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(choices),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Generation failed')
      setEditedCoverLetter(body.data.generated_cover_letter || '')
      setCurrentCvAdvice(body.data.cv_advice || '')
      onGenerated?.(id, { generated_cover_letter: body.data.generated_cover_letter, cv_advice: body.data.cv_advice })
      setShowGenerationOptions(false)
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(null)
    }
  }

  const inputClass =
    'w-full px-4 py-2 bg-navy-900 border border-navy-600 rounded-lg text-white focus:outline-none focus:border-blue-500'

  const wordCount = editedCoverLetter.trim() ? editedCoverLetter.trim().split(/\s+/).length : 0

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 m-0">
      <div className="bg-navy-800 border border-navy-600 rounded-lg w-[95vw] h-[95vh] max-w-7xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-navy-600">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">Edit Application</h2>
            {jobTitle && company && (
              <p className="text-navy-300 mt-1">
                {jobTitle} at {company}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {autoSaveStatus === 'saving' && (
              <p className="text-sm text-navy-300">Saving...</p>
            )}
            {autoSaveStatus === 'saved' && (
              <p className="text-sm text-green-400">Saved</p>
            )}
            {onStatusChange && (
              <StatusSelect
                value={status || 'draft'}
                onChange={handleStatusChange}
                disabled={changingStatus}
              />
            )}
            <button
              onClick={onClose}
              className="text-navy-300 hover:text-white text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-navy-600 px-6 pt-4">
          <button
            onClick={() => setActiveTab('coverLetter')}
            className={`px-4 py-2 font-medium transition border-b-2 ${
              activeTab === 'coverLetter'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-navy-300 hover:text-white'
            }`}
          >
            Cover Letter
          </button>
          <button
            onClick={() => setActiveTab('cvAdvice')}
            className={`px-4 py-2 font-medium transition border-b-2 ${
              activeTab === 'cvAdvice'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-navy-300 hover:text-white'
            }`}
          >
            CV/Resume Advice
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 font-medium transition border-b-2 ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-navy-300 hover:text-white'
            }`}
          >
            Details
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-navy-900">
          {generateError && (
            <div className="mb-4 bg-red-500/10 border border-red-400/40 rounded-lg p-3 text-sm text-red-300">
              {generateError}
            </div>
          )}

          {activeTab === 'coverLetter' && (
            editedCoverLetter ? (
              <div className="h-full flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${wordCount > ONE_PAGE_WORD_LIMIT ? 'text-amber-400' : 'text-navy-400'}`}>
                    {wordCount} words {wordCount > ONE_PAGE_WORD_LIMIT ? '— likely over one page, consider trimming' : '(fits one page)'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowGenerationOptions(true)}
                      disabled={generating === 'coverLetter'}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-navy-600 text-navy-200 hover:bg-navy-700 hover:text-white disabled:opacity-50 transition"
                    >
                      <AiBoltIcon />
                      Regenerate
                    </button>
                    <button
                      onClick={() => setShowTemplateSelector(true)}
                      disabled={showTemplateSelector || !id || !authToken}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-navy-600 text-navy-200 hover:bg-navy-700 hover:text-white disabled:opacity-50 transition"
                    >
                      Word / PDF
                    </button>
                    <a
                      href={id && authToken ? undefined : undefined}
                      onClick={async (e) => {
                        e.preventDefault()
                        if (!id || !authToken) return
                        const res = await fetch(`/api/applications/export-txt?id=${id}`, { headers: { Authorization: `Bearer ${authToken}` } })
                        const blob = await res.blob()
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = 'CoverLetter.txt'
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-navy-600 text-navy-200 hover:bg-navy-700 hover:text-white transition cursor-pointer"
                    >
                      TXT
                    </a>
                    <a
                      onClick={async (e) => {
                        e.preventDefault()
                        if (!id || !authToken) return
                        const res = await fetch(`/api/applications/export-odt?id=${id}`, { headers: { Authorization: `Bearer ${authToken}` } })
                        const blob = await res.blob()
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = 'CoverLetter.odt'
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-navy-600 text-navy-200 hover:bg-navy-700 hover:text-white transition cursor-pointer"
                    >
                      ODT
                    </a>
                  </div>
                </div>
                <textarea
                  value={editedCoverLetter}
                  onChange={(e) => setEditedCoverLetter(e.target.value)}
                  className="w-full flex-1 bg-navy-800 text-white p-6 rounded-lg border border-navy-600 text-sm resize-none focus:outline-none focus:border-blue-500"
                  placeholder="Edit your cover letter..."
                />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                <AiBadge />
                <p className="text-navy-300 max-w-sm">
                  No cover letter yet. Generate one tailored to this job description and your career library.
                </p>
                <Button onClick={() => setShowGenerationOptions(true)} loading={generating === 'coverLetter'}>
                  Generate Cover Letter
                </Button>
              </div>
            )
          )}

          {activeTab === 'cvAdvice' && (
            currentCvAdvice ? (
              <div className="bg-navy-800 border border-navy-600 rounded-lg p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">Advice for your uploaded CV</h3>
                  <button
                    onClick={() => setShowGenerationOptions(true)}
                    disabled={generating === 'coverLetter'}
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium disabled:opacity-50"
                  >
                    <AiBoltIcon size={10} />
                    Regenerate
                  </button>
                </div>
                <p className="text-xs text-navy-400">
                  We don't rewrite your CV — this is guidance on what to change in the document you already have.
                </p>
                <div className="space-y-2">
                  {currentCvAdvice.split('\n').filter(Boolean).map((line, i) => (
                    <p key={i} className="text-navy-100 text-sm leading-relaxed">{line}</p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                <AiBadge />
                <p className="text-navy-300 max-w-sm">
                  No advice yet. Pick a CV and we'll compare this job description against it and suggest specific changes.
                </p>
                <Button onClick={() => setShowGenerationOptions(true)} loading={generating === 'coverLetter'}>
                  Generate CV Advice
                </Button>
              </div>
            )
          )}

          {activeTab === 'details' && (
            <div className="bg-navy-800 border border-navy-600 p-6 rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-200 mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={editedJobTitle}
                    onChange={(e) => setEditedJobTitle(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-200 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    value={editedCompany}
                    onChange={(e) => setEditedCompany(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-200 mb-2">
                  Job Description (Optional)
                </label>
                <textarea
                  value={editedJobDescription}
                  onChange={(e) => setEditedJobDescription(e.target.value)}
                  placeholder="Paste the job description here — needed for Generate Cover Letter / CV Advice"
                  className={`${inputClass} text-sm`}
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-200 mb-2">
                  Job URL (Optional)
                </label>
                <input
                  type="url"
                  value={editedJobUrl}
                  onChange={(e) => setEditedJobUrl(e.target.value)}
                  placeholder="https://company.com/careers/job-title"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-200 mb-2">
                  Application Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={editedDeadline}
                  onChange={(e) => setEditedDeadline(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-200 mb-2">
                  Persons of Interest (Optional)
                </label>
                <p className="text-xs text-navy-400 mb-2">
                  Names, titles, and/or emails of people at the company you'd like to address
                </p>
                <textarea
                  value={editedPersonsOfInterest}
                  onChange={(e) => setEditedPersonsOfInterest(e.target.value)}
                  placeholder="e.g., John Smith (Hiring Manager, john@company.com)&#10;Sarah Johnson (VP Engineering, sarah@company.com)"
                  className={`${inputClass} font-mono text-sm`}
                  rows={5}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 p-6 border-t border-navy-600 bg-navy-800">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg font-semibold border border-navy-600 text-navy-200 hover:bg-navy-700 hover:text-white disabled:opacity-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <ExportTemplateSelector
          isOpen={showTemplateSelector}
          applicationId={id || ''}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}

      <GenerationOptionsModal
        isOpen={showGenerationOptions}
        onClose={() => setShowGenerationOptions(false)}
        onGenerate={handleGenerate}
        components={components}
        authToken={authToken}
        generating={generating === 'coverLetter'}
        title={editedCoverLetter ? 'Regenerate cover letter & CV advice' : 'Generate cover letter & CV advice'}
      />
    </div>
  )
}
