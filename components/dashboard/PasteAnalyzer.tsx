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
    <div className="bg-navy-900 rounded-lg p-6 border border-navy-700 space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-white">
            Paste your experience
          </h2>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-primary/20 text-blue-300 border border-primary/40">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
              <path d="M13 2 3 14h7l-1 8 11-14h-7l0-6Z" />
            </svg>
            AI Powered
          </span>
        </div>
        <p className="text-navy-300 text-sm mt-1">
          Add your CV, cover letter, or job descriptions
        </p>
      </div>

      {/* Textarea Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-navy-200">
          Experience information
        </label>
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Paste your CV, cover letter, job descriptions, or any experience-related information here..."
          className="w-full h-40 px-4 py-3 bg-navy-800 border border-navy-600 rounded-lg text-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300 resize-none transition font-mono text-sm placeholder-navy-400"
        />
        <div className="flex justify-between items-center text-xs text-navy-400">
          <p>
            {charCount} characters {charCount < 50 ? `(need ${50 - charCount} more)` : ''}
          </p>
          {text && (
            <button
              onClick={handleClear}
              className="text-navy-400 hover:text-white transition font-medium"
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
      <div className="rounded-lg p-3 border border-navy-700 bg-navy-800">
        <p className="text-xs text-navy-300">
          <span className="font-semibold text-navy-200">Your data is safe.</span> Everything stays private and is only used to build your profile.
        </p>
      </div>

      {/* Tips Section */}
      <div className="space-y-2 border-t border-navy-700 pt-3">
        <p className="text-xs font-medium text-navy-200">Tips for best results:</p>
        <ul className="text-xs text-navy-300 space-y-1">
          <li className="flex gap-2">
            <span className="text-navy-500 flex-shrink-0">•</span>
            <span>Include dates, job titles, and company names</span>
          </li>
          <li className="flex gap-2">
            <span className="text-navy-500 flex-shrink-0">•</span>
            <span>Add achievements, metrics, and skills</span>
          </li>
          <li className="flex gap-2">
            <span className="text-navy-500 flex-shrink-0">•</span>
            <span>You can paste multiple times to enrich your profile</span>
          </li>
          <li className="flex gap-2">
            <span className="text-navy-500 flex-shrink-0">•</span>
            <span>Edit any component to fine-tune the details</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
