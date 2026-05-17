import { useState } from 'react'
import { Button } from '@/components/common/Button'

interface JustApplyTabProps {
  onSubmit: (jobDescription: string, jobTitle?: string, company?: string) => Promise<void>
  loading?: boolean
}

export function JustApplyTab({ onSubmit, loading }: JustApplyTabProps) {
  const [inputMode, setInputMode] = useState<'paste' | 'url'>('paste')
  const [jobDescription, setJobDescription] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!jobDescription.trim()) {
      setError('Please enter a job description')
      return
    }

    try {
      await onSubmit(jobDescription, jobTitle || undefined, company || undefined)
      // Reset form on success
      setJobDescription('')
      setJobTitle('')
      setCompany('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate application')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Just Apply</h2>
        <p className="text-gray-600 mt-1">
          Enter a job description, and we'll generate a tailored CV and cover letter for you.
        </p>
      </div>

      {/* Input Mode Selector */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setInputMode('paste')}
          className={`px-4 py-3 font-medium transition border-b-2 ${
            inputMode === 'paste'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Paste Job Posting
        </button>
        <button
          onClick={() => setInputMode('url')}
          className={`px-4 py-3 font-medium transition border-b-2 ${
            inputMode === 'url'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Job URL (Coming Soon)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-blue-50 rounded-lg p-6 border border-blue-100">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Optional Job Info */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Job Details (Optional)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Senior React Developer"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., Acme Inc"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Job Description Input */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Job Description *</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job posting here..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none h-64"
          />
          <p className="text-xs text-gray-500 mt-2">Minimum 50 characters required</p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || jobDescription.trim().length < 50}
          loading={loading}
          className="w-full"
        >
          {loading ? 'Generating your documents...' : 'Generate CV & Cover Letter'}
        </Button>

        <p className="text-xs text-gray-600 bg-white rounded p-3 border border-gray-200">
          Tip: Include the full job description for better results. We'll tailor your CV and cover letter to match the requirements.
        </p>
      </form>
    </div>
  )
}
