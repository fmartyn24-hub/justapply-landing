// Shared between the pre-generation options step (UI) and the generation
// prompt (backend) so the values and their meaning never drift apart.

export type CoverLetterTone = 'professional' | 'warm' | 'direct' | 'bold'
export type CoverLetterLength = 'concise' | 'standard' | 'detailed'

interface ToneOption {
  value: CoverLetterTone
  label: string
  description: string
  promptInstruction: string
}

interface LengthOption {
  value: CoverLetterLength
  label: string
  description: string
  wordRange: string
  minWords: number
  maxWords: number
}

export const TONE_OPTIONS: ToneOption[] = [
  {
    value: 'professional',
    label: 'Professional',
    description: 'Polished and measured',
    promptInstruction: 'Professional and measured — confident, polished, no slang. The default corporate-appropriate register.',
  },
  {
    value: 'warm',
    label: 'Warm',
    description: 'Personable and human',
    promptInstruction: 'Warm and personable — still professional, but conversational and human, like a thoughtful colleague rather than a formal letter.',
  },
  {
    value: 'direct',
    label: 'Direct',
    description: 'Short sentences, no fluff',
    promptInstruction: 'Direct and confident — short, punchy sentences, no hedging language, gets straight to the point.',
  },
  {
    value: 'bold',
    label: 'Bold',
    description: 'Distinctive, makes a case',
    promptInstruction: 'Bold and distinctive — makes a strong, memorable case for the candidate with more personality than a typical cover letter, while staying credible and grounded in real facts.',
  },
]

export const LENGTH_OPTIONS: LengthOption[] = [
  {
    value: 'concise',
    label: 'Concise',
    description: '~150–200 words',
    wordRange: '150–200 words',
    minWords: 150,
    maxWords: 200,
  },
  {
    value: 'standard',
    label: 'Standard',
    description: '~200–280 words, one page',
    wordRange: '200–280 words',
    minWords: 200,
    maxWords: 280,
  },
  {
    value: 'detailed',
    label: 'Detailed',
    description: '~280–350 words',
    wordRange: '280–350 words',
    minWords: 280,
    maxWords: 350,
  },
]

export const DEFAULT_TONE: CoverLetterTone = 'professional'
export const DEFAULT_LENGTH: CoverLetterLength = 'standard'

export function getToneOption(value?: string | null): ToneOption {
  return TONE_OPTIONS.find((t) => t.value === value) || TONE_OPTIONS.find((t) => t.value === DEFAULT_TONE)!
}

export function getLengthOption(value?: string | null): LengthOption {
  return LENGTH_OPTIONS.find((l) => l.value === value) || LENGTH_OPTIONS.find((l) => l.value === DEFAULT_LENGTH)!
}
