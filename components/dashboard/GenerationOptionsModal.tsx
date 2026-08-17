import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { CvPicker } from './CvPicker'
import { ToneLengthPicker } from './ToneLengthPicker'
import { DEFAULT_TONE, DEFAULT_LENGTH, type CoverLetterTone, type CoverLetterLength } from '@/lib/coverLetterOptions'

interface LibraryComponent {
  id: string
  type: string
  title: string
  organization_name?: string
}

const TYPE_LABELS: Record<string, string> = {
  role: 'Role',
  skill: 'Skill',
  achievement: 'Achievement',
  project: 'Project',
  kpi: 'KPI',
  voice: 'Voice',
  context: 'Context',
  education: 'Education',
  certification: 'Certification',
  program: 'Program',
  volunteer: 'Volunteer',
}

export interface GenerationChoices {
  selectedComponentIds?: string[]
  cvId?: string | null
  tone: CoverLetterTone
  length: CoverLetterLength
}

interface GenerationOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (choices: GenerationChoices) => void
  components: LibraryComponent[]
  authToken?: string
  generating?: boolean
  title?: string
}

// The "draft selection step" before generating/regenerating a cover letter
// (and its paired CV advice) — which components to emphasize, which CV to
// advise against, and the tone/length of the draft. Used both for the first
// generation on a manually-created application and for regenerating one.
export function GenerationOptionsModal({
  isOpen,
  onClose,
  onGenerate,
  components,
  authToken,
  generating,
  title = 'Generate options',
}: GenerationOptionsModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [cvId, setCvId] = useState<string | null>(null)
  const [tone, setTone] = useState<CoverLetterTone>(DEFAULT_TONE)
  const [length, setLength] = useState<CoverLetterLength>(DEFAULT_LENGTH)

  if (!isOpen) return null

  const toggle = (componentId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(componentId)) next.delete(componentId)
      else next.add(componentId)
      return next
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[110] p-4">
      <div className="bg-navy-800 border border-navy-600 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-navy-300 hover:text-white text-2xl leading-none"
        >
          ×
        </button>
        <div className="flex items-center gap-2 pr-8">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-primary/20 text-blue-300 border border-primary/40 flex-shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
              <path d="M13 2 3 14h7l-1 8 11-14h-7l0-6Z" />
            </svg>
            AI Powered
          </span>
        </div>

        <CvPicker authToken={authToken} value={cvId} onChange={setCvId} />

        {components.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-navy-200 mb-2">
              Components to emphasize <span className="text-navy-400 font-normal">(optional — leave blank to use your full library)</span>
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 border border-navy-600 rounded-lg p-2">
              {components.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-navy-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(c.id)}
                    onChange={() => toggle(c.id)}
                    className="accent-blue-600 flex-shrink-0"
                  />
                  <span className="text-sm text-white truncate">{c.title}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-navy-400 flex-shrink-0">
                    {TYPE_LABELS[c.type] || c.type}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <ToneLengthPicker tone={tone} length={length} onToneChange={setTone} onLengthChange={setLength} />

        <div className="flex gap-3 pt-2">
          <Button
            onClick={() =>
              onGenerate({
                selectedComponentIds: selectedIds.size > 0 ? Array.from(selectedIds) : undefined,
                cvId,
                tone,
                length,
              })
            }
            loading={generating}
            className="flex-1"
          >
            Generate
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg font-semibold border border-navy-600 text-navy-200 hover:bg-navy-700 hover:text-white transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
