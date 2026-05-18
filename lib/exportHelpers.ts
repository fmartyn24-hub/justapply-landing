import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import PDFDocument from 'pdfkit'

export async function generateDocxBuffer(
  cv: string,
  coverLetter: string,
  jobTitle: string,
  company: string
): Promise<Buffer> {
  const sections = []

  // Header with job info
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${jobTitle} at ${company}`,
          bold: true,
          size: 28,
          color: '1F2937',
        }),
      ],
      spacing: { after: 200 },
    })
  )

  // CV Section
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Resume / CV',
          bold: true,
          size: 24,
          color: '374151',
        }),
      ],
      spacing: { before: 200, after: 100 },
    })
  )

  // Add CV content with proper formatting (preserve line breaks)
  cv.split('\n').forEach((line) => {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: line || ' ', // Empty lines become space to preserve structure
            size: 22,
            color: '1F2937',
          }),
        ],
        spacing: { line: 240 },
      })
    )
  })

  // Cover Letter Section
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Cover Letter',
          bold: true,
          size: 24,
          color: '374151',
        }),
      ],
      spacing: { before: 400, after: 100 },
    })
  )

  // Add cover letter content
  coverLetter.split('\n').forEach((line) => {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: line || ' ',
            size: 22,
            color: '1F2937',
          }),
        ],
        spacing: { line: 240 },
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

export function generatePdfBuffer(
  cv: string,
  coverLetter: string,
  jobTitle: string,
  company: string
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

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text(`${jobTitle} at ${company}`, { align: 'left' })
    doc.moveDown(0.3)

    // Divider
    doc.strokeColor('#D1D5DB').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    doc.moveDown(0.3)

    // CV Section
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#374151').text('Resume / CV')
    doc.moveDown(0.2)

    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#1F2937')
      .text(cv, {
        align: 'left',
        width: 495,
        wordSpacing: 0,
        lineGap: 3,
      })

    doc.moveDown(0.5)

    // Cover Letter Section
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#374151').text('Cover Letter')
    doc.moveDown(0.2)

    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#1F2937')
      .text(coverLetter, {
        align: 'left',
        width: 495,
        wordSpacing: 0,
        lineGap: 3,
      })

    doc.end()
  })
}
