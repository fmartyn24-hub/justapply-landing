import { useState } from 'react'
import { Button } from '@/components/common/Button'

interface ApplicationPreviewProps {
  cv: string
  coverLetter: string
  jobTitle?: string
  company?: string
  onSave: (status: 'draft' | 'applied') => Promise<void>
  onClose: () => void
  saving?: boolean
}

export function ApplicationPreview({
  cv,
  coverLetter,
  jobTitle,
  company,
  onSave,
  onClose,
  saving,
}: ApplicationPreviewProps) {
  const [activeTab, setActiveTab] = useState<'cv' | 'coverLetter'>('cv')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Application Preview</h2>
            {jobTitle && company && (
              <p className="text-gray-600 mt-1">
                {jobTitle} at {company}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {activeTab === 'cv' ? (
            <div className="bg-white p-6 rounded-lg whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
              {cv}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
              {coverLetter}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-white">
          <Button
            onClick={() => onSave('draft')}
            variant="outline"
            disabled={saving}
            className="flex-1"
          >
            Save as Draft
          </Button>
          <Button
            onClick={() => onSave('applied')}
            disabled={saving}
            loading={saving}
            className="flex-1"
          >
            Mark as Applied
          </Button>
          <Button onClick={onClose} variant="outline" disabled={saving} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
