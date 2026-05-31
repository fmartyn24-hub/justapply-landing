import { useState, useEffect } from 'react'
import { Button } from '@/components/common/Button'
import { ExportTemplateSelector } from './ExportTemplateSelector'

interface ApplicationPreviewProps {
  id?: string
  cv: string
  coverLetter: string
  jobTitle?: string
  company?: string
  jobUrl?: string
  deadline?: string
  personsOfInterest?: string
  onSave?: (id: string, data: { generated_cv: string; generated_cover_letter: string; job_url?: string; deadline?: string; persons_of_interest?: string }) => Promise<void>
  onStatusChange?: (status: 'draft' | 'applied') => Promise<void>
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
  jobUrl,
  deadline,
  personsOfInterest,
  onSave,
  onStatusChange,
  onClose,
  saving,
  authToken,
}: ApplicationPreviewProps) {
  const [activeTab, setActiveTab] = useState<'cv' | 'coverLetter' | 'details'>('cv')
  const [editedCv, setEditedCv] = useState(cv)
  const [editedCoverLetter, setEditedCoverLetter] = useState(coverLetter)
  const [editedJobUrl, setEditedJobUrl] = useState(jobUrl || '')
  const [editedDeadline, setEditedDeadline] = useState(deadline || '')
  const [editedPersonsOfInterest, setEditedPersonsOfInterest] = useState(personsOfInterest || '')
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
            generated_cv: editedCv,
            generated_cover_letter: editedCoverLetter,
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
    }, 1500) // Wait 1.5s after user stops typing before saving

    setAutoSaveTimeout(timeout)

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [editedCv, editedCoverLetter, editedJobUrl, editedDeadline, editedPersonsOfInterest])

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 m-0">
      <div className="bg-white rounded-lg w-[95vw] h-[95vh] max-w-7xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Edit Application</h2>
            {jobTitle && company && (
              <p className="text-gray-600 mt-1">
                {jobTitle} at {company}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {autoSaveStatus === 'saving' && (
              <p className="text-sm text-gray-500">Saving...</p>
            )}
            {autoSaveStatus === 'saved' && (
              <p className="text-sm text-green-600">Saved</p>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 px-6 pt-4">
          <button
            onClick={() => setActiveTab('cv')}
            className={`px-4 py-2 font-medium transition border-b-2 ${
              activeTab === 'cv'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            CV/Resume
          </button>
          <button
            onClick={() => setActiveTab('coverLetter')}
            className={`px-4 py-2 font-medium transition border-b-2 ${
              activeTab === 'coverLetter'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Cover Letter
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 font-medium transition border-b-2 ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Details
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {activeTab === 'cv' && (
            <textarea
              value={editedCv}
              onChange={(e) => setEditedCv(e.target.value)}
              className="w-full h-full bg-white p-6 rounded-lg border border-gray-200 font-mono text-sm resize-none focus:outline-none focus:border-blue-500"
              placeholder="Edit your CV..."
            />
          )}

          {activeTab === 'coverLetter' && (
            <textarea
              value={editedCoverLetter}
              onChange={(e) => setEditedCoverLetter(e.target.value)}
              className="w-full h-full bg-white p-6 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:border-blue-500"
              placeholder="Edit your cover letter..."
            />
          )}

          {activeTab === 'details' && (
            <div className="bg-white p-6 rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job URL (Optional)
                </label>
                <input
                  type="url"
                  value={editedJobUrl}
                  onChange={(e) => setEditedJobUrl(e.target.value)}
                  placeholder="https://company.com/careers/job-title"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={editedDeadline}
                  onChange={(e) => setEditedDeadline(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Persons of Interest (Optional)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Names, titles, and/or emails of people at the company you'd like to address
                </p>
                <textarea
                  value={editedPersonsOfInterest}
                  onChange={(e) => setEditedPersonsOfInterest(e.target.value)}
                  placeholder="e.g., John Smith (Hiring Manager, john@company.com)&#10;Sarah Johnson (VP Engineering, sarah@company.com)"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm"
                  rows={5}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 p-6 border-t border-gray-200 bg-white">
          <div className="flex gap-3">
            {onStatusChange && (
              <>
                <Button
                  onClick={() => onStatusChange('draft')}
                  variant="outline"
                  disabled={saving}
                  className="flex-1"
                >
                  Save as Draft
                </Button>
                <Button
                  onClick={() => onStatusChange('applied')}
                  disabled={saving}
                  loading={saving}
                  className="flex-1"
                >
                  Mark as Applied
                </Button>
              </>
            )}
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

            <Button
              onClick={() => {
                setSelectedDocumentType('coverLetter')
                setShowTemplateSelector(true)
              }}
              disabled={showTemplateSelector || !id || !authToken}
              variant="outline"
              className="flex-1"
            >
              📝 Export Cover Letter
            </Button>
            <Button onClick={onClose} variant="outline" disabled={saving} className="flex-1">
              Close
            </Button>
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
