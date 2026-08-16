import { useState, useEffect } from 'react'
import { Button } from '@/components/common/Button'
import { ExportTemplateSelector } from './ExportTemplateSelector'
import { APPLICATION_STATUSES, type ApplicationStatus } from '@/lib/applicationStatus'

interface ApplicationPreviewProps {
  id?: string
  cv: string
  coverLetter: string
  jobTitle?: string
  company?: string
  jobDescription?: string
  jobUrl?: string
  deadline?: string
  personsOfInterest?: string
  status?: ApplicationStatus
  onSave?: (id: string, data: { generated_cv: string; generated_cover_letter: string; job_title?: string; company_name?: string; job_description?: string; job_url?: string; deadline?: string; persons_of_interest?: string; status?: ApplicationStatus }) => Promise<void>
  onStatusChange?: (status: ApplicationStatus) => Promise<void>
  onClose: () => void
  saving?: boolean
  authToken?: string
}

export function ApplicationPreview({
  id,
  cv,
  coverLetter,
  jobTitle,
  company,
  jobDescription,
  jobUrl,
  deadline,
  personsOfInterest,
  status,
  onSave,
  onStatusChange,
  onClose,
  saving,
  authToken,
}: ApplicationPreviewProps) {
  const [activeTab, setActiveTab] = useState<'cv' | 'coverLetter' | 'details'>('cv')
  const [editedCv, setEditedCv] = useState(cv)
  const [editedCoverLetter, setEditedCoverLetter] = useState(coverLetter)
  const [editedJobTitle, setEditedJobTitle] = useState(jobTitle || '')
  const [editedCompany, setEditedCompany] = useState(company || '')
  const [editedJobDescription, setEditedJobDescription] = useState(jobDescription || '')
  const [editedJobUrl, setEditedJobUrl] = useState(jobUrl || '')
  const [editedDeadline, setEditedDeadline] = useState(deadline || '')
  const [editedPersonsOfInterest, setEditedPersonsOfInterest] = useState(personsOfInterest || '')
  const [editedStatus, setEditedStatus] = useState<ApplicationStatus>(status || 'draft')
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [selectedDocumentType, setSelectedDocumentType] = useState<'cv' | 'coverLetter'>('cv')

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout)

    // Don't auto-save if nothing has changed
    if (
      editedCv === cv &&
      editedCoverLetter === coverLetter &&
      editedJobTitle === (jobTitle || '') &&
      editedCompany === (company || '') &&
      editedJobDescription === (jobDescription || '') &&
      editedJobUrl === jobUrl &&
      editedDeadline === deadline &&
      editedPersonsOfInterest === personsOfInterest &&
      editedStatus === (status || 'draft')
    ) {
      return
    }

    setAutoSaveStatus('saving')

    const timeout = setTimeout(async () => {
      if (onSave && id) {
        try {
          await onSave(id, {
            generated_cv: editedCv,
            generated_cover_letter: editedCoverLetter,
            job_title: editedJobTitle || undefined,
            company_name: editedCompany || undefined,
            job_description: editedJobDescription || undefined,
            job_url: editedJobUrl || undefined,
            deadline: editedDeadline || undefined,
            persons_of_interest: editedPersonsOfInterest || undefined,
            status: editedStatus,
          })
          setAutoSaveStatus('saved')
          setTimeout(() => setAutoSaveStatus('idle'), 2000)
        } catch (err) {
          console.error('Auto-save error:', err)
          setAutoSaveStatus('idle')
        }
      }
    }, 1500) // Wait 1.5s after user stops typing before saving

    setAutoSaveTimeout(timeout)

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [editedCv, editedCoverLetter, editedJobTitle, editedCompany, editedJobDescription, editedJobUrl, editedDeadline, editedPersonsOfInterest, editedStatus])

  const inputClass =
    'w-full px-4 py-2 bg-navy-900 border border-navy-600 rounded-lg text-white focus:outline-none focus:border-blue-500'

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
            onClick={() => setActiveTab('cv')}
            className={`px-4 py-2 font-medium transition border-b-2 ${
              activeTab === 'cv'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-navy-300 hover:text-white'
            }`}
          >
            CV/Resume
          </button>
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
          {activeTab === 'cv' && (
            <textarea
              value={editedCv}
              onChange={(e) => setEditedCv(e.target.value)}
              className="w-full h-full bg-navy-800 text-white p-6 rounded-lg border border-navy-600 font-mono text-sm resize-none focus:outline-none focus:border-blue-500"
              placeholder="Edit your CV..."
            />
          )}

          {activeTab === 'coverLetter' && (
            <textarea
              value={editedCoverLetter}
              onChange={(e) => setEditedCoverLetter(e.target.value)}
              className="w-full h-full bg-navy-800 text-white p-6 rounded-lg border border-navy-600 text-sm resize-none focus:outline-none focus:border-blue-500"
              placeholder="Edit your cover letter..."
            />
          )}

          {activeTab === 'details' && (
            <div className="bg-navy-800 border border-navy-600 p-6 rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-200 mb-2">
                  Status
                </label>
                <select
                  value={editedStatus}
                  onChange={(e) => setEditedStatus(e.target.value as ApplicationStatus)}
                  className={inputClass}
                >
                  {APPLICATION_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

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
                  placeholder="Paste the job description here for your own reference"
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
            <Button
              onClick={() => {
                setSelectedDocumentType('cv')
                setShowTemplateSelector(true)
              }}
              disabled={showTemplateSelector || !id || !authToken}
              className="flex-1"
            >
              📄 Export CV
            </Button>

            <button
              onClick={() => {
                setSelectedDocumentType('coverLetter')
                setShowTemplateSelector(true)
              }}
              disabled={showTemplateSelector || !id || !authToken}
              className="flex-1 px-4 py-2 rounded-lg font-semibold border border-navy-600 text-navy-200 hover:bg-navy-700 hover:text-white disabled:opacity-50 transition"
            >
              📝 Export Cover Letter
            </button>
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
          documentType={selectedDocumentType}
          applicationId={id || ''}
          onChangeDocumentType={setSelectedDocumentType}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </div>
  )
}
