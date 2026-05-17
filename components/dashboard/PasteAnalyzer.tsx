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
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Paste <span className="font-normal text-gray-700">your experience</span>
        </h2>
        <p className="text-gray-600 text-sm">
          Add your CV, cover letter, or job descriptions
        </p>
      </div>

      {/* Textarea Section */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Experience information
        </label>
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Paste your CV, cover letter, job descriptions, or any experience-related information here..."
          className="w-full h-48 px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none transition font-mono text-sm placeholder-gray-400"
        />
        <div className="flex justify-between items-center text-sm">
          <p className={`${charCount < 50 ? 'text-gray-400' : 'text-green-600 font-medium'}`}>
            {charCount} characters {charCount < 50 ? `(need ${50 - charCount} more)` : '✓'}
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
        {analyzing ? 'Analyzing...' : 'Analyze'}
      </Button>

      {/* Trust/Safety Message */}
      <div className="bg-white bg-opacity-60 rounded-lg p-4 border border-blue-100">
        <p className="text-xs text-gray-600">
          <span className="font-semibold text-gray-700">🔒 Your data is safe.</span> Everything stays private and is only used to build your profile.
        </p>
      </div>

      {/* Tips Section */}
      <div className="space-y-3 border-t border-blue-100 pt-4">
        <p className="text-sm font-medium text-gray-700">Tips for best results:</p>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex gap-2">
            <span className="text-blue-500 flex-shrink-0">•</span>
            <span>Include dates, job titles, and company names</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-500 flex-shrink-0">•</span>
            <span>Add achievements, metrics, and skills</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-500 flex-shrink-0">•</span>
            <span>You can paste multiple times to enrich your profile</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-500 flex-shrink-0">•</span>
            <span>Edit any component to fine-tune the details</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
