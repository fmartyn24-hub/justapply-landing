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
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Paste Your Career Information
        </h2>
        <p className="text-gray-600">
          Copy and paste your CV, cover letter, or any career information. We'll analyze it and extract your achievements, skills, and experience.
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your CV or Cover Letter
        </label>
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Paste your CV, cover letter, or career details here... (minimum 50 characters)"
          className="w-full h-40 px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none transition font-mono text-sm"
        />
        <div className="mt-2 flex justify-between items-center">
          <p className={`text-sm ${charCount < 50 ? 'text-gray-400' : 'text-green-600 font-medium'}`}>
            {charCount} characters {charCount < 50 ? `(need ${50 - charCount} more)` : '✓'}
          </p>
          {text && (
            <button
              onClick={handleClear}
              className="text-sm text-gray-500 hover:text-gray-700 transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleAnalyze}
          disabled={charCount < 50 || analyzing}
          loading={analyzing}
          className="flex-1"
        >
          {analyzing ? 'Analyzing...' : '🤖 Analyze with Claude'}
        </Button>
      </div>

      <div className="mt-6 pt-6 border-t border-blue-100">
        <p className="text-sm text-gray-600 mb-3 font-medium">Quick Tips:</p>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>✓ Paste your full CV or cover letter</li>
          <li>✓ Include dates, achievements, and metrics</li>
          <li>✓ We'll extract skills, roles, achievements, and KPIs</li>
          <li>✓ You can always edit or add components manually</li>
        </ul>
      </div>
    </div>
  )
}
