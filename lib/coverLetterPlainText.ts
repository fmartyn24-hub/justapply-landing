// Shared plain-text rendering of a cover letter, used by both the TXT and
// ODT exports so the two stay in sync.

interface CoverLetterData {
  opening?: string
  body_paragraphs?: string[]
  closing?: string
  contact?: { name?: string; email?: string; phone?: string; location?: string }
  date?: string
  recipient?: { jobTitle?: string; company?: string }
}

export function coverLetterToLines(clData: CoverLetterData): string[] {
  const lines: string[] = []
  const c = clData.contact

  if (c?.name) lines.push(c.name)
  const contactLine = [c?.email, c?.phone, c?.location].filter(Boolean).join('  |  ')
  if (contactLine) lines.push(contactLine)
  if (c?.name || contactLine) lines.push('')

  if (clData.date) {
    lines.push(clData.date)
    lines.push('')
  }

  const reLine = [clData.recipient?.jobTitle, clData.recipient?.company]
    .filter(Boolean)
    .join(' at ')
  if (reLine) {
    lines.push(`Re: ${reLine}`)
    lines.push('')
  }

  if (clData.opening) {
    lines.push(clData.opening)
    lines.push('')
  }
  ;(clData.body_paragraphs || []).forEach((p) => {
    lines.push(p)
    lines.push('')
  })
  if (clData.closing) {
    lines.push(clData.closing)
    lines.push('')
  }

  lines.push('Sincerely,')
  if (c?.name) lines.push(c.name)

  return lines
}

export function coverLetterToPlainText(clData: CoverLetterData): string {
  return coverLetterToLines(clData).join('\n').trim() + '\n'
}
