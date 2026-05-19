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

  const bodySize = template.fonts.bodySize * 2

  // Add content with proper formatting (preserve line breaks)
  content.split('\n').forEach((line) => {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: line || ' ',
            size: bodySize,
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

    // Content
    const textRgb = hexToRgb(template.colors.text)
    doc
      .fontSize(template.fonts.bodySize)
      .font('Helvetica')
      .fillColor(textRgb)
      .text(content, {
        align: 'left',
        width: 495,
        wordSpacing: 0,
        lineGap: template.fonts.lineHeight / 100,
      })

    doc.end()
  })
}
