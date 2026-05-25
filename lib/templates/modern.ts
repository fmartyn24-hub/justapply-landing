import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, BorderStyle, WidthType, UnderlineType, convertInchesToTwip, VerticalAlign } from 'docx'
import PDFDocument from 'pdfkit'

// Modern template design spec:
// - Colorful header with accent colors and visual blocks
// - Modern sans-serif fonts (Calibri)
// - Generous spacing with visual separators
// - Colored accent bars for sections
// - Colored background blocks for key sections

interface ModernTemplateConfig {
  colors: {
    primary: string // #2563EB (blue)
    accent: string // #FF6B35 (orange)
    heading: string // #1F2937 (dark gray)
    text: string // #374151 (medium gray)
    background: string // #F3F4F6 (light gray)
    lightBg: string // #EFF6FF (very light blue)
  }
  fonts: {
    nameSize: number // 18-20pt
    headerSize: number // 12pt
    bodySize: number // 10-11pt
    contactSize: number // 10pt
  }
}

const MODERN_CONFIG: ModernTemplateConfig = {
  colors: {
    primary: '2563EB',
    accent: 'FF6B35',
    heading: '1F2937',
    text: '374151',
    background: 'F3F4F6',
    lightBg: 'EFF6FF',
  },
  fonts: {
    nameSize: 20,
    headerSize: 12,
    bodySize: 11,
    contactSize: 10,
  },
}

interface CVData {
  header?: {
    name?: string
    email?: string
    phone?: string
    location?: string
    portfolio_url?: string
    linkedin_url?: string
  }
  professional_summary?: string
  skills?: Array<{ category: string; items: string[] }>
  experience?: Array<{
    title: string
    company: string
    location?: string
    start_date?: string
    end_date?: string
    description?: string
    achievements?: string[]
  }>
  education?: Array<{
    degree: string
    school?: string
    graduation_date?: string
    gpa?: string
  }>
  certifications?: string[]
  additional?: string
}

interface CoverLetterData {
  opening?: string
  body_paragraphs?: string[]
  closing?: string
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0]
}

// Helper function to create section headers with colored left accent bar
function createSectionHeader(title: string): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 5, type: WidthType.PERCENTAGE },
            shading: { fill: MODERN_CONFIG.colors.accent },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [new Paragraph({ text: '' })],
          }),
          new TableCell({
            width: { size: 95, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            margins: { top: 100, bottom: 100, left: 150, right: 0 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: title,
                    size: MODERN_CONFIG.fonts.headerSize * 2,
                    bold: true,
                    color: MODERN_CONFIG.colors.primary,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

export async function generateModernDocx(
  cvData: CVData,
  documentType: 'cv' | 'coverLetter',
  clData?: CoverLetterData
): Promise<Buffer> {
  const children: (Paragraph | Table)[] = []

  if (documentType === 'cv') {
    // Header with colored accent bar
    const headerTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 100, type: WidthType.PERCENTAGE },
              shading: { fill: MODERN_CONFIG.colors.primary },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              margins: { top: 200, bottom: 200, left: 200, right: 200 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cvData.header?.name || 'YOUR NAME',
                      size: MODERN_CONFIG.fonts.nameSize * 2,
                      bold: true,
                      color: 'FFFFFF',
                    }),
                  ],
                  spacing: { after: 100 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cvData.header?.email || '',
                      size: MODERN_CONFIG.fonts.contactSize * 2,
                      color: 'FFFFFF',
                    }),
                  ],
                  spacing: { after: 50 },
                }),
              ],
            }),
          ],
        }),
      ],
    })

    children.push(headerTable)

    // Contact info with accent
    const contactParts = []
    if (cvData.header?.phone) contactParts.push(cvData.header.phone)
    if (cvData.header?.location) contactParts.push(cvData.header.location)
    if (cvData.header?.portfolio_url) contactParts.push(cvData.header.portfolio_url)
    if (cvData.header?.linkedin_url) contactParts.push(cvData.header.linkedin_url)

    if (contactParts.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: contactParts.join('  •  '),
              size: MODERN_CONFIG.fonts.contactSize * 2,
              color: MODERN_CONFIG.colors.text,
            }),
          ],
          spacing: { before: 100, after: 300 },
        })
      )
    }

    // Professional Summary with accent bar
    if (cvData.professional_summary) {
      // Section header with colored left bar
      const summaryHeaderTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 5, type: WidthType.PERCENTAGE },
                shading: { fill: MODERN_CONFIG.colors.accent },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                margins: { top: 0, bottom: 0, left: 0, right: 0 },
                children: [new Paragraph({ text: '' })],
              }),
              new TableCell({
                width: { size: 95, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                margins: { top: 100, bottom: 100, left: 150, right: 0 },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'PROFESSIONAL SUMMARY',
                        size: MODERN_CONFIG.fonts.headerSize * 2,
                        bold: true,
                        color: MODERN_CONFIG.colors.primary,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      })

      children.push(summaryHeaderTable)

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cvData.professional_summary,
              size: MODERN_CONFIG.fonts.bodySize * 2,
              color: MODERN_CONFIG.colors.text,
            }),
          ],
          spacing: { before: 100, after: 200, line: 300 },
        })
      )
    }

    // Skills with accent bar
    if (cvData.skills && cvData.skills.length > 0) {
      children.push(createSectionHeader('SKILLS'))
      children.push(new Paragraph({ text: '', spacing: { before: 50, after: 100 } }))

      cvData.skills.forEach((skillGroup) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: skillGroup.category,
                size: MODERN_CONFIG.fonts.bodySize * 2,
                bold: true,
                color: MODERN_CONFIG.colors.primary,
              }),
              new TextRun({
                text: ': ' + skillGroup.items.join(', '),
                size: MODERN_CONFIG.fonts.bodySize * 2,
                color: MODERN_CONFIG.colors.text,
              }),
            ],
            spacing: { after: 100 },
          })
        )
      })

      children.push(new Paragraph({ text: '', spacing: { after: 150 } }))
    }

    // Experience with accent bar
    if (cvData.experience && cvData.experience.length > 0) {
      children.push(createSectionHeader('PROFESSIONAL EXPERIENCE'))
      children.push(new Paragraph({ text: '', spacing: { before: 50, after: 100 } }))

      cvData.experience.forEach((job) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: job.title,
                size: MODERN_CONFIG.fonts.bodySize * 2,
                bold: true,
                color: MODERN_CONFIG.colors.heading,
              }),
              new TextRun({
                text: ` at ${job.company}${job.location ? ` (${job.location})` : ''}`,
                size: MODERN_CONFIG.fonts.bodySize * 2,
                color: MODERN_CONFIG.colors.primary,
              }),
            ],
            spacing: { after: 50 },
          })
        )

        if (job.start_date || job.end_date) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${job.start_date || ''} ${job.end_date || 'Present'}`,
                  size: (MODERN_CONFIG.fonts.bodySize - 1) * 2,
                  color: MODERN_CONFIG.colors.text,
                  italics: true,
                }),
              ],
              spacing: { after: 100 },
            })
          )
        }

        if (job.description) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: job.description,
                  size: MODERN_CONFIG.fonts.bodySize * 2,
                  color: MODERN_CONFIG.colors.text,
                }),
              ],
              spacing: { after: 100 },
            })
          )
        }

        if (job.achievements && job.achievements.length > 0) {
          job.achievements.forEach((achievement) => {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: '• ' + achievement,
                    size: MODERN_CONFIG.fonts.bodySize * 2,
                    color: MODERN_CONFIG.colors.text,
                  }),
                ],
                spacing: { after: 80, before: 0 },
              })
            )
          })
        }

        children.push(new Paragraph({ text: '', spacing: { after: 150 } }))
      })
    }

    // Education with accent bar
    if (cvData.education && cvData.education.length > 0) {
      children.push(createSectionHeader('EDUCATION'))
      children.push(new Paragraph({ text: '', spacing: { before: 50, after: 100 } }))

      cvData.education.forEach((edu) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: edu.degree,
                size: MODERN_CONFIG.fonts.bodySize * 2,
                bold: true,
                color: MODERN_CONFIG.colors.heading,
              }),
              ...(edu.school
                ? [
                    new TextRun({
                      text: ` from ${edu.school}`,
                      size: MODERN_CONFIG.fonts.bodySize * 2,
                      color: MODERN_CONFIG.colors.text,
                    }),
                  ]
                : []),
            ],
            spacing: { after: 50 },
          })
        )

        if (edu.graduation_date) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Graduated: ${edu.graduation_date}`,
                  size: (MODERN_CONFIG.fonts.bodySize - 1) * 2,
                  color: MODERN_CONFIG.colors.text,
                }),
              ],
              spacing: { after: 100 },
            })
          )
        }

        if (edu.gpa) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `GPA: ${edu.gpa}`,
                  size: (MODERN_CONFIG.fonts.bodySize - 1) * 2,
                  color: MODERN_CONFIG.colors.text,
                }),
              ],
              spacing: { after: 100 },
            })
          )
        }
      })
    }

    // Certifications with accent bar
    if (cvData.certifications && cvData.certifications.length > 0) {
      children.push(createSectionHeader('CERTIFICATIONS'))
      children.push(new Paragraph({ text: '', spacing: { before: 50, after: 100 } }))

      cvData.certifications.forEach((cert) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '• ' + cert,
                size: MODERN_CONFIG.fonts.bodySize * 2,
                color: MODERN_CONFIG.colors.text,
              }),
            ],
            spacing: { after: 100 },
          })
        )
      })
    }
  } else if (documentType === 'coverLetter' && clData) {
    // Cover Letter
    if (clData.opening) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: clData.opening,
              size: MODERN_CONFIG.fonts.bodySize * 2,
              color: MODERN_CONFIG.colors.text,
            }),
          ],
          spacing: { after: 200, line: 300 },
        })
      )
    }

    if (clData.body_paragraphs && clData.body_paragraphs.length > 0) {
      clData.body_paragraphs.forEach((paragraph) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: paragraph,
                size: MODERN_CONFIG.fonts.bodySize * 2,
                color: MODERN_CONFIG.colors.text,
              }),
            ],
            spacing: { after: 200, line: 300 },
          })
        )
      })
    }

    if (clData.closing) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: clData.closing,
              size: MODERN_CONFIG.fonts.bodySize * 2,
              color: MODERN_CONFIG.colors.text,
            }),
          ],
          spacing: { after: 200, line: 300 },
        })
      )
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(0.75),
              right: convertInchesToTwip(0.75),
            },
          },
        },
        children: children,
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  return buffer
}

export function generateModernPdf(
  cvData: CVData,
  documentType: 'cv' | 'coverLetter',
  clData?: CoverLetterData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const doc = new PDFDocument({
      margin: 54, // 0.75 inches
      size: 'A4',
    })

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const primaryRgb = hexToRgb(MODERN_CONFIG.colors.primary)
    const accentRgb = hexToRgb(MODERN_CONFIG.colors.accent)
    const headingRgb = hexToRgb(MODERN_CONFIG.colors.heading)
    const textRgb = hexToRgb(MODERN_CONFIG.colors.text)
    const bgRgb = hexToRgb(MODERN_CONFIG.colors.lightBg)

    // Helper function to draw a section header with accent bar
    const drawSectionHeader = (title: string, yPos: number) => {
      // Orange accent bar on the left
      doc.rect(54, yPos - 5, 6, 20).fill(accentRgb)

      // Section title
      doc
        .fontSize(MODERN_CONFIG.fonts.headerSize)
        .font('Helvetica-Bold')
        .fillColor(primaryRgb)
        .text(title, 70, yPos, { width: 460 })

      doc.moveDown(0.3)
    }

    if (documentType === 'cv') {
      // Header with blue background
      const headerHeight = 70
      doc
        .rect(54, 54, 495, headerHeight)
        .fill(primaryRgb)

      // Name in white on blue background
      doc
        .fontSize(MODERN_CONFIG.fonts.nameSize)
        .font('Helvetica-Bold')
        .fillColor('FFFFFF')
        .text(cvData.header?.name || 'YOUR NAME', 70, 65, { width: 463 })

      // Email in white
      doc
        .fontSize(MODERN_CONFIG.fonts.contactSize)
        .font('Helvetica')
        .fillColor('FFFFFF')
        .text(cvData.header?.email || '', 70, doc.y, { width: 463 })

      doc.moveDown(0.8)

      // Contact info below header
      const contactParts = []
      if (cvData.header?.phone) contactParts.push(cvData.header.phone)
      if (cvData.header?.location) contactParts.push(cvData.header.location)
      if (cvData.header?.portfolio_url) contactParts.push(cvData.header.portfolio_url)
      if (cvData.header?.linkedin_url) contactParts.push(cvData.header.linkedin_url)

      if (contactParts.length > 0) {
        doc
          .fontSize(MODERN_CONFIG.fonts.contactSize - 1)
          .font('Helvetica')
          .fillColor(textRgb)
          .text(contactParts.join('  •  '), { width: 495 })
        doc.moveDown(0.5)
      }

      // Professional Summary
      if (cvData.professional_summary) {
        drawSectionHeader('PROFESSIONAL SUMMARY', doc.y)
        doc
          .fontSize(MODERN_CONFIG.fonts.bodySize)
          .font('Helvetica')
          .fillColor(textRgb)
          .text(cvData.professional_summary, { width: 495 })
        doc.moveDown(0.4)
      }

      // Skills
      if (cvData.skills && cvData.skills.length > 0) {
        drawSectionHeader('SKILLS', doc.y)

        cvData.skills.forEach((skillGroup) => {
          doc
            .fontSize(MODERN_CONFIG.fonts.bodySize)
            .font('Helvetica-Bold')
            .fillColor(primaryRgb)
            .text(skillGroup.category + ': ', { continued: true })
            .font('Helvetica')
            .fillColor(textRgb)
            .text(skillGroup.items.join(', '), { width: 495 })
        })
        doc.moveDown(0.3)
      }

      // Experience
      if (cvData.experience && cvData.experience.length > 0) {
        drawSectionHeader('PROFESSIONAL EXPERIENCE', doc.y)

        cvData.experience.forEach((job) => {
          doc
            .fontSize(MODERN_CONFIG.fonts.bodySize)
            .font('Helvetica-Bold')
            .fillColor(headingRgb)
            .text(job.title, { continued: true })
            .font('Helvetica')
            .fillColor(primaryRgb)
            .text(` at ${job.company}${job.location ? ` (${job.location})` : ''}`, { width: 495 })

          if (job.start_date || job.end_date) {
            doc
              .fontSize(MODERN_CONFIG.fonts.bodySize - 1)
              .font('Helvetica-Oblique')
              .fillColor(textRgb)
              .text(`${job.start_date || ''} ${job.end_date || 'Present'}`)
          }

          if (job.description) {
            doc
              .fontSize(MODERN_CONFIG.fonts.bodySize)
              .font('Helvetica')
              .fillColor(textRgb)
              .text(job.description, { width: 495 })
          }

          if (job.achievements && job.achievements.length > 0) {
            job.achievements.forEach((achievement) => {
              doc
                .fontSize(MODERN_CONFIG.fonts.bodySize)
                .text('• ' + achievement, { width: 495 })
            })
          }

          doc.moveDown(0.3)
        })
      }

      // Education
      if (cvData.education && cvData.education.length > 0) {
        drawSectionHeader('EDUCATION', doc.y)

        cvData.education.forEach((edu) => {
          doc
            .fontSize(MODERN_CONFIG.fonts.bodySize)
            .font('Helvetica-Bold')
            .fillColor(headingRgb)
            .text(edu.degree, { continued: edu.school ? true : false })
            .font('Helvetica')
            .fillColor(textRgb)
            .text(edu.school ? ` from ${edu.school}` : '', { width: 495 })

          if (edu.graduation_date) {
            doc
              .fontSize(MODERN_CONFIG.fonts.bodySize - 1)
              .text(`Graduated: ${edu.graduation_date}`)
          }

          if (edu.gpa) {
            doc.text(`GPA: ${edu.gpa}`)
          }

          doc.moveDown(0.2)
        })
      }

      // Certifications
      if (cvData.certifications && cvData.certifications.length > 0) {
        drawSectionHeader('CERTIFICATIONS', doc.y)

        cvData.certifications.forEach((cert) => {
          doc
            .fontSize(MODERN_CONFIG.fonts.bodySize)
            .font('Helvetica')
            .fillColor(textRgb)
            .text('• ' + cert, { width: 495 })
        })
      }
    } else if (documentType === 'coverLetter' && clData) {
      // Cover Letter
      if (clData.opening) {
        doc
          .fontSize(MODERN_CONFIG.fonts.bodySize)
          .font('Helvetica')
          .fillColor(textRgb)
          .text(clData.opening, { width: 495 })
        doc.moveDown(0.4)
      }

      if (clData.body_paragraphs && clData.body_paragraphs.length > 0) {
        clData.body_paragraphs.forEach((paragraph) => {
          doc
            .fontSize(MODERN_CONFIG.fonts.bodySize)
            .font('Helvetica')
            .fillColor(textRgb)
            .text(paragraph, { width: 495 })
          doc.moveDown(0.4)
        })
      }

      if (clData.closing) {
        doc
          .fontSize(MODERN_CONFIG.fonts.bodySize)
          .font('Helvetica')
          .fillColor(textRgb)
          .text(clData.closing, { width: 495 })
      }
    }

    doc.end()
  })
}
