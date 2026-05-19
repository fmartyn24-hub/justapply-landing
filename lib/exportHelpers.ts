import { Document, Packer, Paragraph, TextRun } from 'docx'
import PDFDocument from 'pdfkit'
import type { ExportTemplate } from './exportTemplates'

// Helper to detect if a line is a section header (all caps with 3+ words, or common section names)
function isHeader(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false

  const commonHeaders = [
    'PROFESSIONAL SUMMARY',
    'PROFESSIONAL EXPERIENCE',
    'EXPERIENCE',
    'SKILLS',
    'EDUCATION',
    'CERTIFICATIONS',
    'LANGUAGES',
    'PROJECTS',
    'ACHIEVEMENTS',
    'CORE COMPETENCIES',
    'KEY SKILLS',
    'TECHNICAL SKILLS',
    'TECHNICAL EXPERTISE',
  ]

  const upperTrimmed = trimmed.toUpperCase()
  if (commonHeaders.some((h) => upperTrimmed === h)) return true

  // Check if all caps and 3+ words
  if (trimmed === upperTrimmed && trimmed.split(/\s+/).length >= 2 && trimmed.length > 10) {
    return true
  }

  return false
}

export async function generateDocxBuffer(
  content: string,
  jobTitle: string,
  company: string,
  template: ExportTemplate,
  documentType: 'cv' | 'coverLetter'
): Promise<Buffer> {
  const paragraphs: Paragraph[] = []

  const lines = content.split('\n')

  lines.forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed) {
      // Empty line
      paragraphs.push(new Paragraph({ text: '', spacing: { after: 100 } }))
      return
    }

    if (isHeader(trimmed)) {
      // Section header
      const headingSize = template.fonts.headingSize * 2
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed,
              size: headingSize,
              bold: true,
              color: template.colors.heading,
            }),
          ],
          spacing: { after: 200, before: 200 },
        })
      )
    } else {
      // Body text
      const bodySize = template.fonts.bodySize * 2
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed,
              size: bodySize,
              color: template.colors.text,
            }),
          ],
          spacing: { after: 100, line: template.fonts.lineHeight * 2 },
        })
      )
    }
  })

  const doc = new Document({
    sections: [
      {
        children: paragraphs,
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  return buffer
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0]
}

export function generatePdfBuffer(
  content: string,
  jobTitle: string,
  company: string,
  template: ExportTemplate,
  documentType: 'cv' | 'coverLetter'
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []

    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
    })

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const lines = content.split('\n')
    const textRgb = hexToRgb(template.colors.text)
    const headingRgb = hexToRgb(template.colors.heading)

    lines.forEach((line, idx) => {
      const trimmed = line.trim()
      if (!trimmed) {
        doc.moveDown(0.3)
        return
      }

      if (isHeader(trimmed)) {
        // Section header
        doc
          .fontSize(template.fonts.headingSize)
          .font('Helvetica-Bold')
          .fillColor(headingRgb)
          .text(trimmed, {
            align: 'left',
            width: 495,
          })
        doc.moveDown(0.4)
      } else {
        // Body text
        doc
          .fontSize(template.fonts.bodySize)
          .font('Helvetica')
          .fillColor(textRgb)
          .text(trimmed, {
            align: 'left',
            width: 495,
            lineGap: template.fonts.lineHeight / 100,
          })
        doc.moveDown(0.15)
      }
    })

    doc.end()
  })
}
