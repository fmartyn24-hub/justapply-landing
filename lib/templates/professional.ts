import { Document, Packer, Paragraph, TextRun, convertInchesToTwip } from 'docx'
import PDFDocument from 'pdfkit'

// Professional template: Conservative, minimal color, traditional layout
// Used for finance, law, healthcare, government, academia

interface ProfessionalTemplateConfig {
  colors: {
    primary: string // #1E3A8A (navy)
    heading: string // #1F2937 (dark gray)
    text: string // #374151 (medium gray)
  }
  fonts: {
    nameSize: number // 16pt
    headerSize: number // 11pt
    bodySize: number // 10pt
    contactSize: number // 9pt
  }
}

const PROFESSIONAL_CONFIG: ProfessionalTemplateConfig = {
  colors: {
    primary: '1E3A8A',
    heading: '1F2937',
    text: '374151',
  },
  fonts: {
    nameSize: 16,
    headerSize: 11,
    bodySize: 10,
    contactSize: 9,
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

export async function generateProfessionalDocx(
  cvData: CVData,
  documentType: 'cv' | 'coverLetter',
  clData?: CoverLetterData
): Promise<Buffer> {
  const paragraphs: Paragraph[] = []

  if (documentType === 'cv') {
    // Header
    if (cvData.header?.name) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cvData.header.name,
              size: PROFESSIONAL_CONFIG.fonts.nameSize * 2,
              bold: true,
              color: PROFESSIONAL_CONFIG.colors.primary,
            }),
          ],
          spacing: { after: 100 },
        })
      )
    }

    // Contact info (single line, minimal)
    const contactParts = []
    if (cvData.header?.email) contactParts.push(cvData.header.email)
    if (cvData.header?.phone) contactParts.push(cvData.header.phone)
    if (cvData.header?.location) contactParts.push(cvData.header.location)

    if (contactParts.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: contactParts.join(' | '),
              size: PROFESSIONAL_CONFIG.fonts.contactSize * 2,
              color: PROFESSIONAL_CONFIG.colors.text,
            }),
          ],
          spacing: { after: 150 },
        })
      )
    }

    // Professional Summary
    if (cvData.professional_summary) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'PROFESSIONAL SUMMARY',
              size: PROFESSIONAL_CONFIG.fonts.headerSize * 2,
              bold: true,
              color: PROFESSIONAL_CONFIG.colors.heading,
            }),
          ],
          spacing: { before: 150, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: cvData.professional_summary,
              size: PROFESSIONAL_CONFIG.fonts.bodySize * 2,
              color: PROFESSIONAL_CONFIG.colors.text,
            }),
          ],
          spacing: { after: 150, line: 260 },
        })
      )
    }

    // Skills
    if (cvData.skills && cvData.skills.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'SKILLS',
              size: PROFESSIONAL_CONFIG.fonts.headerSize * 2,
              bold: true,
              color: PROFESSIONAL_CONFIG.colors.heading,
            }),
          ],
          spacing: { before: 150, after: 100 },
        })
      )

      cvData.skills.forEach((skillGroup) => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: skillGroup.category,
                size: PROFESSIONAL_CONFIG.fonts.bodySize * 2,
                bold: true,
                color: PROFESSIONAL_CONFIG.colors.heading,
              }),
              new TextRun({
                text: ': ' + skillGroup.items.join(', '),
                size: PROFESSIONAL_CONFIG.fonts.bodySize * 2,
                color: PROFESSIONAL_CONFIG.colors.text,
              }),
            ],
            spacing: { after: 80 },
          })
        )
      })

      paragraphs.push(new Paragraph({ text: '', spacing: { after: 100 } }))
    }

    // Experience
    if (cvData.experience && cvData.experience.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'PROFESSIONAL EXPERIENCE',
              size: PROFESSIONAL_CONFIG.fonts.headerSize * 2,
              bold: true,
              color: PROFESSIONAL_CONFIG.colors.heading,
            }),
          ],
          spacing: { before: 150, after: 100 },
        })
      )

      cvData.experience.forEach((job) => {
        // Title and company on same line when possible
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: job.title,
                size: PROFESSIONAL_CONFIG.fonts.bodySize * 2,
                bold: true,
                color: PROFESSIONAL_CONFIG.colors.heading,
              }),
              new TextRun({
                text: ` | ${job.company}${job.location ? ` (${job.location})` : ''}`,
                size: PROFESSIONAL_CONFIG.fonts.bodySize * 2,
                color: PROFESSIONAL_CONFIG.colors.text,
              }),
            ],
            spacing: { after: 60 },
          })
        )

        if (job.start_date || job.end_date) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${job.start_date || ''} – ${job.end_date || 'Present'}`,
                  size: (PROFESSIONAL_CONFIG.fonts.bodySize - 1) * 2,
                  color: PROFESSIONAL_CONFIG.colors.text,
                }),
              ],
              spacing: { after: 80 },
            })
          )
        }

        if (job.description) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: job.description,
                  size: PROFESSIONAL_CONFIG.fonts.bodySize * 2,
                  color: PROFESSIONAL_CONFIG.colors.text,
                }),
              ],
              spacing: { after: 80 },
            })
          )
        }

        if (job.achievements && job.achievements.length > 0) {
          job.achievements.forEach((achievement) => {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: '• ' + achievement,
                    size: PROFESSIONAL_CONFIG.fonts.bodySize * 2,
                    color: PROFESSIONAL_CONFIG.colors.text,
                  }),
                ],
                spacing: { after: 60 },
              })
            )
          })
        }

        paragraphs.push(new Paragraph({ text: '', spacing: { after: 80 } }))
      })
    }

    // Education
    if (cvData.education && cvData.education.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'EDUCATION',
              size: PROFESSIONAL_CONFIG.fonts.headerSize * 2,
              bold: true,
              color: PROFESSIONAL_CONFIG.colors.heading,
            }),
          ],
          spacing: { before: 150, after: 100 },
        })
      )

      cvData.education.forEach((edu) => {
        const degreeText = edu.school ? `${edu.degree}, ${edu.school}` : edu.degree
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: degreeText,
                size: PROFESSIONAL_CONFIG.fonts.bodySize * 2,
                bold: true,
                color: PROFESSIONAL_CONFIG.colors.heading,
              }),
            ],
            spacing: { after: 60 },
          })
        )

        if (edu.graduation_date) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Graduated: ${edu.graduation_date}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}`,
                  size: (PROFESSIONAL_CONFIG.fonts.bodySize - 1) * 2,
                  color: PROFESSIONAL_CONFIG.colors.text,
                }),
              ],
              spacing: { after: 80 },
            })
          )
        }
      })
    }

    // Certifications
    if (cvData.certifications && cvData.certifications.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'CERTIFICATIONS',
              size: PROFESSIONAL_CONFIG.fonts.headerSize * 2,
              bold: true,
              color: PROFESSIONAL_CONFIG.colors.heading,
            }),
          ],
          spacing: { before: 150, after: 100 },
        })
      )

      cvData.certifications.forEach((cert) => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '• ' + cert,
                size: PROFESSIONAL_CONFIG.fonts.bodySize * 2,
                color: PROFESSIONAL_CONFIG.colors.text,
              }),
            ],
            spacing: { after: 80 },
          })
        )
      })
    }
  } else if (documentType === 'coverLetter' && clData) {
    // Cover Letter - Professional tone
    if (clData.opening) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: clData.opening,
              size: PROFESSIONAL_CONFIG.fonts.bodySize * 2,
              color: PROFESSIONAL_CONFIG.colors.text,
            }),
          ],
          spacing: { after: 150, line: 260 },
        })
      )
    }

    if (clData.body_paragraphs && clData.body_paragraphs.length > 0) {
      clData.body_paragraphs.forEach((paragraph) => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: paragraph,
                size: PROFESSIONAL_CONFIG.fonts.bodySize * 2,
                color: PROFESSIONAL_CONFIG.colors.text,
              }),
            ],
            spacing: { after: 150, line: 260 },
          })
        )
      })
    }

    if (clData.closing) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: clData.closing,
              size: PROFESSIONAL_CONFIG.fonts.bodySize * 2,
              color: PROFESSIONAL_CONFIG.colors.text,
            }),
          ],
          spacing: { after: 150, line: 260 },
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
        children: paragraphs,
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  return buffer
}

export function generateProfessionalPdf(
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

    const primaryRgb = hexToRgb(PROFESSIONAL_CONFIG.colors.primary)
    const headingRgb = hexToRgb(PROFESSIONAL_CONFIG.colors.heading)
    const textRgb = hexToRgb(PROFESSIONAL_CONFIG.colors.text)

    if (documentType === 'cv') {
      // Header
      if (cvData.header?.name) {
        doc
          .fontSize(PROFESSIONAL_CONFIG.fonts.nameSize)
          .font('Helvetica-Bold')
          .fillColor(primaryRgb)
          .text(cvData.header.name, { width: 495 })
        doc.moveDown(0.15)
      }

      // Contact info
      const contactParts = []
      if (cvData.header?.email) contactParts.push(cvData.header.email)
      if (cvData.header?.phone) contactParts.push(cvData.header.phone)
      if (cvData.header?.location) contactParts.push(cvData.header.location)

      if (contactParts.length > 0) {
        doc
          .fontSize(PROFESSIONAL_CONFIG.fonts.contactSize)
          .font('Helvetica')
          .fillColor(textRgb)
          .text(contactParts.join(' | '), { width: 495 })
        doc.moveDown(0.35)
      }

      // Professional Summary
      if (cvData.professional_summary) {
        doc
          .fontSize(PROFESSIONAL_CONFIG.fonts.headerSize)
          .font('Helvetica-Bold')
          .fillColor(headingRgb)
          .text('PROFESSIONAL SUMMARY', { width: 495 })
        doc.moveDown(0.15)

        doc
          .fontSize(PROFESSIONAL_CONFIG.fonts.bodySize)
          .font('Helvetica')
          .fillColor(textRgb)
          .text(cvData.professional_summary, { width: 495 })
        doc.moveDown(0.35)
      }

      // Skills
      if (cvData.skills && cvData.skills.length > 0) {
        doc
          .fontSize(PROFESSIONAL_CONFIG.fonts.headerSize)
          .font('Helvetica-Bold')
          .fillColor(headingRgb)
          .text('SKILLS', { width: 495 })
        doc.moveDown(0.15)

        cvData.skills.forEach((skillGroup) => {
          doc
            .fontSize(PROFESSIONAL_CONFIG.fonts.bodySize)
            .font('Helvetica-Bold')
            .fillColor(headingRgb)
            .text(skillGroup.category + ': ', { continued: true })
            .font('Helvetica')
            .fillColor(textRgb)
            .text(skillGroup.items.join(', '), { width: 495 })
          doc.moveDown(0.1)
        })
        doc.moveDown(0.2)
      }

      // Experience
      if (cvData.experience && cvData.experience.length > 0) {
        doc
          .fontSize(PROFESSIONAL_CONFIG.fonts.headerSize)
          .font('Helvetica-Bold')
          .fillColor(headingRgb)
          .text('PROFESSIONAL EXPERIENCE', { width: 495 })
        doc.moveDown(0.15)

        cvData.experience.forEach((job) => {
          doc
            .fontSize(PROFESSIONAL_CONFIG.fonts.bodySize)
            .font('Helvetica-Bold')
            .fillColor(headingRgb)
            .text(job.title, { continued: true })
            .font('Helvetica')
            .fillColor(textRgb)
            .text(` | ${job.company}${job.location ? ` (${job.location})` : ''}`, { width: 495 })

          if (job.start_date || job.end_date) {
            doc
              .fontSize(PROFESSIONAL_CONFIG.fonts.bodySize - 1)
              .text(`${job.start_date || ''} – ${job.end_date || 'Present'}`)
              .moveDown(0.05)
          }

          if (job.description) {
            doc
              .fontSize(PROFESSIONAL_CONFIG.fonts.bodySize)
              .text(job.description, { width: 495 })
          }

          if (job.achievements && job.achievements.length > 0) {
            job.achievements.forEach((achievement) => {
              doc
                .fontSize(PROFESSIONAL_CONFIG.fonts.bodySize)
                .text('• ' + achievement, { width: 495 })
            })
          }

          doc.moveDown(0.2)
        })
      }

      // Education
      if (cvData.education && cvData.education.length > 0) {
        doc
          .fontSize(PROFESSIONAL_CONFIG.fonts.headerSize)
          .font('Helvetica-Bold')
          .fillColor(headingRgb)
          .text('EDUCATION', { width: 495 })
        doc.moveDown(0.15)

        cvData.education.forEach((edu) => {
          const degreeText = edu.school ? `${edu.degree}, ${edu.school}` : edu.degree
          doc
            .fontSize(PROFESSIONAL_CONFIG.fonts.bodySize)
            .font('Helvetica-Bold')
            .fillColor(headingRgb)
            .text(degreeText, { width: 495 })

          if (edu.graduation_date) {
            doc
              .fontSize(PROFESSIONAL_CONFIG.fonts.bodySize - 1)
              .font('Helvetica')
              .fillColor(textRgb)
              .text(`Graduated: ${edu.graduation_date}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}`)
          }

          doc.moveDown(0.15)
        })
      }

      // Certifications
      if (cvData.certifications && cvData.certifications.length > 0) {
        doc
          .fontSize(PROFESSIONAL_CONFIG.fonts.headerSize)
          .font('Helvetica-Bold')
          .fillColor(headingRgb)
          .text('CERTIFICATIONS', { width: 495 })
        doc.moveDown(0.15)

        cvData.certifications.forEach((cert) => {
          doc
            .fontSize(PROFESSIONAL_CONFIG.fonts.bodySize)
            .font('Helvetica')
            .fillColor(textRgb)
            .text('• ' + cert, { width: 495 })
        })
      }
    } else if (documentType === 'coverLetter' && clData) {
      // Cover Letter
      if (clData.opening) {
        doc
          .fontSize(PROFESSIONAL_CONFIG.fonts.bodySize)
          .font('Helvetica')
          .fillColor(textRgb)
          .text(clData.opening, { width: 495 })
        doc.moveDown(0.3)
      }

      if (clData.body_paragraphs && clData.body_paragraphs.length > 0) {
        clData.body_paragraphs.forEach((paragraph) => {
          doc
            .fontSize(PROFESSIONAL_CONFIG.fonts.bodySize)
            .font('Helvetica')
            .fillColor(textRgb)
            .text(paragraph, { width: 495 })
          doc.moveDown(0.3)
        })
      }

      if (clData.closing) {
        doc
          .fontSize(PROFESSIONAL_CONFIG.fonts.bodySize)
          .font('Helvetica')
          .fillColor(textRgb)
          .text(clData.closing, { width: 495 })
      }
    }

    doc.end()
  })
}
