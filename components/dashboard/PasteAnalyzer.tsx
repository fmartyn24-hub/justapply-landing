import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/lib/context/AuthContext'

interface PasteAnalyzerProps {
  onAnalyze: (text: string) => void
  analyzing: boolean
}

export function PasteAnalyzer({ onAnalyze, analyzing }: PasteAnalyzerProps) {
  const [text, setText] = useState('')
  const [charCount, setCharCount] = useState(0)

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setText(newText)
    setCharCount(newText.length)
  }

  const handleAnalyze = () => {
    if (text.trim().length > 50) {
      onAnalyze(text)
      setText('')
      setCharCount(0)
    }
  }

  const handleClear = () => {
    setText('')
    setCharCount(0)
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Paste your experience
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Add your CV, cover letter, or job descriptions
        </p>
      </div>

      {/* Textarea Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Experience information
        </label>
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Paste your CV, cover letter, job descriptions, or any experience-related information here..."
          className="w-full h-40 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-300 resize-none transition font-mono text-sm placeholder-gray-400"
        />
        <div className="flex justify-between items-center text-xs text-gray-500">
          <p>
            {charCount} characters {charCount < 50 ? `(need ${50 - charCount} more)` : ''}
          </p>
          {text && (
            <button
              onClick={handleClear}
              className="text-gray-500 hover:text-gray-700 transition font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Action Button */}
      <Button
        onClick={handleAnalyze}
        disabled={charCount < 50 || analyzing}
        loading={analyzing}
        className="w-full"
      >
        Analyze
      </Button>

      {/* Trust/Safety Message */}
      <div className="rounded-lg p-3 border border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-600">
          <span className="font-semibold text-gray-700">Your data is safe.</span> Everything stays private and is only used to build your profile.
        </p>
      </div>

      {/* Tips Section */}
      <div className="space-y-2 border-t border-gray-200 pt-3">
        <p className="text-xs font-medium text-gray-700">Tips for best results:</p>
        <ul className="text-xs text-gray-600 space-y-1">
          <li className="flex gap-2">
            <span className="text-gray-400 flex-shrink-0">•</span>
            <span>Include dates, job titles, and company names</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-400 flex-shrink-0">•</span>
            <span>Add achievements, metrics, and skills</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-400 flex-shrink-0">•</span>
            <span>You can paste multiple times to enrich your profile</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-400 flex-shrink-0">•</span>
            <span>Edit any component to fine-tune the details</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
