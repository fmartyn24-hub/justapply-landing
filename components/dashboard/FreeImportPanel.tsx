import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { AiBoltIcon } from '@/components/common/AiFeatureTeaser'

interface FreeImportPanelProps {
  onReadWithoutAi: (text: string) => void
  // Present only while the account still has a free AI import.
  onFreeAiImport?: (text: string) => void
  freeRemaining: number
  busy?: boolean
}

// Free-tier paste import: read pasted CV text into draft components with the
// rule-based parser, or spend the account's free AI import on it.
export function FreeImportPanel({ onReadWithoutAi, onFreeAiImport, freeRemaining, busy }: FreeImportPanelProps) {
  const [text, setText] = useState('')
  const ready = text.trim().length >= 50

  return (
    <div className="bg-navy-900 rounded-lg p-6 border border-navy-700 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white">Paste your CV</h3>
        <p className="text-navy-300 text-sm mt-1">
          Paste the text of your CV or LinkedIn profile. We&apos;ll turn it into draft roles, education and skills
          for you to check before anything is saved.
        </p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        placeholder={'WORK EXPERIENCE\nMarketing Coordinator\nNorthwind, London\nJan 2022 – Present\n• Grew newsletter from 5,000 to 18,000 subscribers'}
        className="w-full px-4 py-3 bg-navy-800 border border-navy-600 rounded-lg text-white text-sm placeholder-navy-500 focus:outline-none focus:ring-2 focus:ring-primary resize-y"
      />
      <div className="flex flex-col sm:flex-row gap-2">
        <Button onClick={() => onReadWithoutAi(text)} disabled={!ready || busy} className="flex-1">
          Read my CV
        </Button>
        {onFreeAiImport && freeRemaining > 0 && (
          <button
            onClick={() => onFreeAiImport(text)}
            disabled={!ready || busy}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold border border-primary/50 text-blue-200 bg-primary/10 hover:bg-primary/20 disabled:opacity-50 transition"
          >
            <AiBoltIcon />
            {busy ? 'Reading with AI…' : `Use free AI import (${freeRemaining} left)`}
          </button>
        )}
      </div>
      <p className="text-xs text-navy-400">
        &ldquo;Read my CV&rdquo; works without AI and is unlimited. The AI import understands messy layouts better.
      </p>
    </div>
  )
}
