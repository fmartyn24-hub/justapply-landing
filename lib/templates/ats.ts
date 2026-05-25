import { Document, Packer, Paragraph, TextRun, convertInchesToTwip } from 'docx'
import PDFDocument from 'pdfkit'

// ATS Template: Plain text, maximum ATS compatibility
// No colors, no special formatting, standard fonts only
// Designed to pass through Applicant Tracking Systems without issues

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

export async function generateAtsDocx(
  cvData: CVData,
  documentType: 'cv' | 'coverLetter',
  clData?: CoverLetterData
): Promise<Buffer> {
  const paragraphs: Paragraph[] = []

  if (documentType === 'cv') {
    // Header - plain text
    if (cvData.header?.name) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cvData.header.name.toUpperCase(),
              size: 22,
              bold: true,
            }),
          ],
          spacing: { after: 100 },
        })
      )
    }

    // Contact info - plain text, each on own line for ATS
    if (cvData.header?.email) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: cvData.header.email, size: 22 })],
          spacing: { after: 50 },
        })
      )
    }

    if (cvData.header?.phone) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: cvData.header.phone, size: 22 })],
          spacing: { after: 50 },
        })
      )
    }

    if (cvData.header?.location) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: cvData.header.location, size: 22 })],
          spacing: { after: 100 },
        })
      )
    }

    // Professional Summary
    if (cvData.professional_summary) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: 'PROFESSIONAL SUMMARY', size: 22, bold: true })],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: cvData.professional_summary, size: 22 })],
          spacing: { after: 150 },
        })
      )
    }

    // Skills
    if (cvData.skills && cvData.skills.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: 'SKILLS', size: 22, bold: true })],
          spacing: { after: 100 },
        })
      )

      cvData.skills.forEach((skillGroup) => {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: `${skillGroup.category}: ${skillGroup.items.join(', ')}`, size: 22 })],
            spacing: { after: 100 },
          })
        )
      })

      paragraphs.push(new Paragraph({ text: '', spacing: { after: 100 } }))
    }

    // Experience
    if (cvData.experience && cvData.experience.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: 'PROFESSIONAL EXPERIENCE', size: 22, bold: true })],
          spacing: { after: 100 },
        })
      )

      cvData.experience.forEach((job) => {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: job.title, size: 22, bold: true })],
            spacing: { after: 0 },
          })
        )

        if (job.company) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: job.company, size: 22 })],
              spacing: { after: 0 },
            })
          )
        }

        if (job.location) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: job.location, size: 22 })],
              spacing: { after: 0 },
            })
          )
        }

        if (job.start_date || job.end_date) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: `${job.start_date || ''} - ${job.end_date || 'Present'}`, size: 22 })],
              spacing: { after: 100 },
            })
          )
        }

        if (job.description) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: job.description, size: 22 })],
              spacing: { after: 100 },
            })
          )
        }

        if (job.achievements && job.achievements.length > 0) {
          job.achievements.forEach((achievement) => {
            paragraphs.push(
              new Paragraph({
                children: [new TextRun({ text: `- ${achievement}`, size: 22 })],
                spacing: { after: 50 },
              })
            )
          })
        }

        paragraphs.push(new Paragraph({ text: '', spacing: { after: 100 } }))
      })
    }

    // Education
    if (cvData.education && cvData.education.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: 'EDUCATION', size: 22, bold: true })],
          spacing: { after: 100 },
        })
      )

      cvData.education.forEach((edu) => {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: edu.degree, size: 22, bold: true })],
            spacing: { after: 0 },
          })
        )

        if (edu.school) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: edu.school, size: 22 })],
              spacing: { after: 0 },
            })
          )
        }

        if (edu.graduation_date) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: `Graduated: ${edu.graduation_date}`, size: 22 })],
              spacing: { after: 0 },
            })
          )
        }

        if (edu.gpa) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: `GPA: ${edu.gpa}`, size: 22 })],
              spacing: { after: 100 },
            })
          )
        }

        paragraphs.push(new Paragraph({ text: '', spacing: { after: 50 } }))
      })
    }

    // Certifications
    if (cvData.certifications && cvData.certifications.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: 'CERTIFICATIONS', size: 22, bold: true })],
          spacing: { after: 100 },
        })
      )

      cvData.certifications.forEach((cert) => {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: `- ${cert}`, size: 22 })],
            spacing: { after: 100 },
          })
        )
      })
    }
  } else if (documentType === 'coverLetter' && clData) {
    // Cover Letter - plain text
    if (clData.opening) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: clData.opening, size: 22 })],
          spacing: { after: 150 },
        })
      )
    }

    if (clData.body_paragraphs && clData.body_paragraphs.length > 0) {
      clData.body_paragraphs.forEach((paragraph) => {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: paragraph, size: 22 })],
            spacing: { after: 150 },
          })
        )
      })
    }

    if (clData.closing) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: clData.closing, size: 22 })],
          spacing: { after: 150 },
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
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
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

export function generateAtsPdf(
  cvData: CVData,
  documentType: 'cv' | 'coverLetter',
  clData?: CoverLetterData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const doc = new PDFDocument({
      margin: 72, // 1 inch margins
      size: 'A4',
    })

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    if (documentType === 'cv') {
      // Header
      if (cvData.header?.name) {
        doc.fontSize(12).font('Helvetica-Bold').text(cvData.header.name.toUpperCase())
        doc.moveDown(0.2)
      }

      // Contact info
      if (cvData.header?.email) {
        doc.fontSize(11).font('Helvetica').text(cvData.header.email)
      }

      if (cvData.header?.phone) {
        doc.text(cvData.header.phone)
      }

      if (cvData.header?.location) {
        doc.text(cvData.header.location)
      }

      doc.moveDown(0.3)

      // Professional Summary
      if (cvData.professional_summary) {
        doc.fontSize(11).font('Helvetica-Bold').text('PROFESSIONAL SUMMARY')
        doc.moveDown(0.1)
        doc.fontSize(11).font('Helvetica').text(cvData.professional_summary, { width: 468 })
        doc.moveDown(0.3)
      }

      // Skills
      if (cvData.skills && cvData.skills.length > 0) {
        doc.fontSize(11).font('Helvetica-Bold').text('SKILLS')
        doc.moveDown(0.1)

        cvData.skills.forEach((skillGroup) => {
          doc
            .fontSize(11)
            .font('Helvetica')
            .text(`${skillGroup.category}: ${skillGroup.items.join(', ')}`, { width: 468 })
        })

        doc.moveDown(0.3)
      }

      // Experience
      if (cvData.experience && cvData.experience.length > 0) {
        doc.fontSize(11).font('Helvetica-Bold').text('PROFESSIONAL EXPERIENCE')
        doc.moveDown(0.1)

        cvData.experience.forEach((job) => {
          doc.fontSize(11).font('Helvetica-Bold').text(job.title)

          if (job.company) {
            doc.fontSize(11).font('Helvetica').text(job.company)
          }

          if (job.location) {
            doc.text(job.location)
          }

          if (job.start_date || job.end_date) {
            doc.text(`${job.start_date || ''} - ${job.end_date || 'Present'}`)
          }

          doc.moveDown(0.1)

          if (job.description) {
            doc.text(job.description, { width: 468 })
          }

          if (job.achievements && job.achievements.length > 0) {
            job.achievements.forEach((achievement) => {
              doc.text(`- ${achievement}`, { width: 468 })
            })
          }

          doc.moveDown(0.2)
        })
      }

      // Education
      if (cvData.education && cvData.education.length > 0) {
        doc.fontSize(11).font('Helvetica-Bold').text('EDUCATION')
        doc.moveDown(0.1)

        cvData.education.forEach((edu) => {
          doc.fontSize(11).font('Helvetica-Bold').text(edu.degree)

          if (edu.school) {
            doc.fontSize(11).font('Helvetica').text(edu.school)
          }

          if (edu.graduation_date) {
            doc.text(`Graduated: ${edu.graduation_date}`)
          }

          if (edu.gpa) {
            doc.text(`GPA: ${edu.gpa}`)
          }

          doc.moveDown(0.15)
        })
      }

      // Certifications
      if (cvData.certifications && cvData.certifications.length > 0) {
        doc.fontSize(11).font('Helvetica-Bold').text('CERTIFICATIONS')
        doc.moveDown(0.1)

        cvData.certifications.forEach((cert) => {
          doc.fontSize(11).font('Helvetica').text(`- ${cert}`)
        })
      }
    } else if (documentType === 'coverLetter' && clData) {
      // Cover Letter
      if (clData.opening) {
        doc.fontSize(11).font('Helvetica').text(clData.opening, { width: 468 })
        doc.moveDown(0.3)
      }

      if (clData.body_paragraphs && clData.body_paragraphs.length > 0) {
        clData.body_paragraphs.forEach((paragraph) => {
          doc.text(paragraph, { width: 468 })
          doc.moveDown(0.3)
        })
      }

      if (clData.closing) {
        doc.text(clData.closing, { width: 468 })
      }
    }

    doc.end()
  })
}
