// Shared DOCX cover-letter builder.
//
// Every template's Word cover letter is rendered here so that all seven share a
// consistent, professional structure — a branded letterhead (name + contact)
// matching the paired CV, the date, an optional "Re:" line, the body, and a
// "Sincerely," + name signature — differentiated only by the template's colour
// palette. This mirrors the HTML/PDF cover-letter design in lib/templates/*Html.ts.

import { Document, Packer, Paragraph, TextRun, convertInchesToTwip, BorderStyle } from 'docx'
import type { ExportTemplate } from '../exportTemplates'

interface Contact {
  name?: string
  email?: string
  phone?: string
  location?: string
  portfolio_url?: string
  linkedin_url?: string
}

export interface CoverLetterDocxData {
  opening?: string
  body_paragraphs?: string[]
  closing?: string
  contact?: Contact
  date?: string
  recipient?: { jobTitle?: string; company?: string }
}

export async function generateCoverLetterDocx(
  clData: CoverLetterDocxData,
  template: ExportTemplate
): Promise<Buffer> {
  const FONT = 'Calibri'
  const primary = template.colors.primary
  const heading = template.colors.heading
  const text = template.colors.text

  const c = clData.contact || {}
  const contactLine = [c.email, c.phone, c.location, c.portfolio_url, c.linkedin_url]
    .filter(Boolean)
    .join('  •  ')
  const reLine = clData.recipient?.jobTitle
    ? `Re: Application for ${clData.recipient.jobTitle}${
        clData.recipient.company ? ` at ${clData.recipient.company}` : ''
      }`
    : ''

  const children: Paragraph[] = []

  // --- Letterhead: name ---
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: c.name || 'Your Name', size: 40, bold: true, color: primary, font: FONT }),
      ],
      spacing: { after: contactLine ? 60 : 200 },
    })
  )

  // --- Letterhead: contact line (with a coloured bottom rule) ---
  if (contactLine) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: contactLine, size: 20, color: text, font: FONT })],
        spacing: { after: 300 },
        border: { bottom: { color: primary, space: 4, style: BorderStyle.SINGLE, size: 12 } },
      })
    )
  }

  // --- Date ---
  if (clData.date) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: clData.date, size: 20, color: text, font: FONT })],
        spacing: { after: 240 },
      })
    )
  }

  // --- Re: line ---
  if (reLine) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: reLine, size: 22, bold: true, color: heading, font: FONT })],
        spacing: { after: 240 },
      })
    )
  }

  // --- Body: opening, paragraphs, closing ---
  const bodyParas = [clData.opening, ...(clData.body_paragraphs || []), clData.closing].filter(
    Boolean
  ) as string[]
  bodyParas.forEach((para) => {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: para, size: 22, color: text, font: FONT })],
        spacing: { after: 200, line: 360 },
      })
    )
  })

  // --- Signature ---
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Sincerely,', size: 22, color: text, font: FONT })],
      spacing: { before: 200, after: 60 },
    })
  )
  if (c.name) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: c.name, size: 22, bold: true, color: primary, font: FONT })],
      })
    )
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        children,
      },
    ],
  })

  return Packer.toBuffer(doc)
}
