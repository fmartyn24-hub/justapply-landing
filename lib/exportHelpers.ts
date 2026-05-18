import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, WidthType, BorderStyle, ShadingType } from 'docx'
import PDFDocument from 'pdfkit'
import type { ExportTemplate } from './exportTemplates'

export async function generateDocxBuffer(
  content: string,
  jobTitle: string,
  company: string,
  template: ExportTemplate,
  documentType: 'cv' | 'coverLetter'
): Promise<Buffer> {
  const sections: Paragraph[] = []

  // Template indicator (to verify which template is used)
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `[${template.name} Template]`,
          italics: true,
          size: 16,
          color: '999999',
        }),
      ],
      spacing: { after: 300 },
    })
  )

  // Header with job info
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${jobTitle} at ${company}`,
          bold: true,
          size: template.fonts.headingSize * 2,
          color: template.colors.heading,
        }),
      ],
      spacing: { after: 200 },
    })
  )

  // Section title
  const sectionTitle = documentType === 'cv' ? 'Resume / CV' : 'Cover Letter'
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: sectionTitle,
          bold: true,
          size: template.fonts.headingSize * 2,
          color: template.colors.heading,
        }),
      ],
      spacing: { before: 200, after: 150 },
    })
  )

  // Add content with proper formatting (preserve line breaks)
  content.split('\n').forEach((line) => {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: line || ' ',
            size: template.fonts.bodySize * 2,
            color: template.colors.text,
          }),
        ],
        spacing: { line: template.fonts.lineHeight },
      })
    )
  })

  const doc = new Document({
    sections: [
      {
        children: sections,
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  return buffer
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ] : [0, 0, 0]
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

    // Template indicator
    doc
      .fontSize(9)
      .fillColor('#999999')
      .text(`[${template.name} Template]`, { align: 'left' })
    doc.moveDown(0.3)

    // Header
    const fontSize = template.fonts.headingSize
    const headingRgb = hexToRgb(template.colors.heading)
    doc
      .fontSize(fontSize + 6)
      .font('Helvetica-Bold')
      .rgb(headingRgb[0], headingRgb[1], headingRgb[2])
      .text(`${jobTitle} at ${company}`, { align: 'left' })
    doc.moveDown(0.3)

    // Divider (only for non-ATS templates)
    if (template.id !== 'ats') {
      const dividerRgb = hexToRgb('D1D5DB')
      doc.rgb(dividerRgb[0], dividerRgb[1], dividerRgb[2]).lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke()
      doc.moveDown(0.3)
    }

    // Section title
    const sectionTitle = documentType === 'cv' ? 'Resume / CV' : 'Cover Letter'
    const sectionRgb = hexToRgb(template.colors.heading)
    doc
      .fontSize(fontSize)
      .font('Helvetica-Bold')
      .rgb(sectionRgb[0], sectionRgb[1], sectionRgb[2])
      .text(sectionTitle)
    doc.moveDown(0.2)

    // Content
    const textRgb = hexToRgb(template.colors.text)
    doc
      .fontSize(template.fonts.bodySize)
      .font('Helvetica')
      .rgb(textRgb[0], textRgb[1], textRgb[2])
      .text(content, {
        align: 'left',
        width: 495,
        wordSpacing: 0,
        lineGap: template.fonts.lineHeight / 100,
      })

    doc.end()
  })
}
