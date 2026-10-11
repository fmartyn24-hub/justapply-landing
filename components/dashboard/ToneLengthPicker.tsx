import { TONE_OPTIONS, LENGTH_OPTIONS, type CoverLetterTone, type CoverLetterLength } from '@/lib/coverLetterOptions'

interface ToneLengthPickerProps {
  tone: CoverLetterTone
  length: CoverLetterLength
  onToneChange: (tone: CoverLetterTone) => void
  onLengthChange: (length: CoverLetterLength) => void
  className?: string
}

// Lets the candidate steer the draft's tone and length before generating,
// instead of every cover letter coming out in the same fixed voice/length.
export function ToneLengthPicker({ tone, length, onToneChange, onLengthChange, className = '' }: ToneLengthPickerProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-navy-200 mb-2">Tone</label>
        <div className="flex flex-wrap gap-2">
          {TONE_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => onToneChange(t.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition text-left ${
                tone === t.value
                  ? 'border-blue-500 bg-primary/10 text-white'
                  : 'border-navy-600 bg-navy-900 text-navy-300 hover:border-navy-500 hover:text-white'
              }`}
            >
              <span className="block">{t.label}</span>
              <span className="block text-xs text-navy-400">{t.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-200 mb-2">Length</label>
        <div className="flex flex-wrap gap-2">
          {LENGTH_OPTIONS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => onLengthChange(l.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition text-left ${
                length === l.value
                  ? 'border-blue-500 bg-primary/10 text-white'
                  : 'border-navy-600 bg-navy-900 text-navy-300 hover:border-navy-500 hover:text-white'
              }`}
            >
              <span className="block">{l.label}</span>
              <span className="block text-xs text-navy-400">{l.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
