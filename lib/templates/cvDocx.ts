// Shared DOCX CV builder.
//
// All seven templates render through this one generator, differentiated only by
// the template's colour palette and font sizes (`ExportTemplate`, from
// exportTemplates.ts — the same source of truth already used by the HTML/PDF
// preview and by generateCoverLetterDocx). This replaces the previous per-template
// generators (modern/professional/ats only), which left minimalist, creative,
// academic and executive falling back to an unstyled plain-text export.

import { Document, Packer, Paragraph, TextRun, convertInchesToTwip } from 'docx'
import type { ExportTemplate } from '../exportTemplates'

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

const FONT = 'Calibri'

export async function generateCvDocx(cvData: CVData, template: ExportTemplate): Promise<Buffer> {
  const { primary, heading, text, accent } = { accent: template.colors.accent || template.colors.primary, ...template.colors }
  const headingSize = template.fonts.headingSize * 2
  const bodySize = template.fonts.bodySize * 2
  const lineHeight = template.fonts.lineHeight

  const children: Paragraph[] = []

  const sectionHeading = (label: string) =>
    new Paragraph({
      children: [new TextRun({ text: label.toUpperCase(), size: headingSize, bold: true, color: heading, font: FONT })],
      spacing: { before: 200, after: 120 },
    })

  // Header
  if (cvData.header?.name) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: cvData.header.name, size: headingSize + 12, bold: true, color: primary, font: FONT })],
        spacing: { after: 100 },
      })
    )
  }

  const contactLine = [cvData.header?.email, cvData.header?.phone, cvData.header?.location]
    .filter(Boolean)
    .join('  •  ')
  if (contactLine) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: contactLine, size: bodySize - 2, color: text, font: FONT })],
        spacing: { after: 240 },
        border: { bottom: { color: primary, space: 4, style: 'single', size: 12 } },
      })
    )
  }

  // Professional summary
  if (cvData.professional_summary) {
    children.push(
      sectionHeading('Professional Summary'),
      new Paragraph({
        children: [new TextRun({ text: cvData.professional_summary, size: bodySize, color: text, font: FONT })],
        spacing: { after: 200, line: lineHeight },
      })
    )
  }

  // Skills
  if (cvData.skills && cvData.skills.length > 0) {
    children.push(sectionHeading('Skills'))
    cvData.skills.forEach((skillGroup) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: skillGroup.category + ':  ', size: bodySize, bold: true, color: accent, font: FONT }),
            new TextRun({ text: skillGroup.items.join(', '), size: bodySize, color: text, font: FONT }),
          ],
          spacing: { after: 80 },
        })
      )
    })
    children.push(new Paragraph({ text: '', spacing: { after: 100 } }))
  }

  // Experience
  if (cvData.experience && cvData.experience.length > 0) {
    children.push(sectionHeading('Professional Experience'))
    cvData.experience.forEach((job) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: job.title, size: bodySize, bold: true, color: heading, font: FONT })],
          spacing: { after: 40 },
        })
      )

      const companyLine = [job.company, job.location].filter(Boolean).join('  •  ')
      if (companyLine) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: companyLine, size: bodySize, bold: true, color: accent, font: FONT })],
            spacing: { after: 40 },
          })
        )
      }

      if (job.start_date || job.end_date) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${job.start_date || ''} – ${job.end_date || 'Present'}`,
                size: bodySize - 2,
                italics: true,
                color: text,
                font: FONT,
              }),
            ],
            spacing: { after: 80 },
          })
        )
      }

      if (job.description) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: job.description, size: bodySize, color: text, font: FONT })],
            spacing: { after: 80, line: lineHeight },
          })
        )
      }

      if (job.achievements && job.achievements.length > 0) {
        job.achievements.forEach((achievement) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: '•  ', size: bodySize, bold: true, color: accent, font: FONT }),
                new TextRun({ text: achievement, size: bodySize, color: text, font: FONT }),
              ],
              spacing: { after: 60 },
              indent: { left: 240 },
            })
          )
        })
      }

      children.push(new Paragraph({ text: '', spacing: { after: 160 } }))
    })
  }

  // Education
  if (cvData.education && cvData.education.length > 0) {
    children.push(sectionHeading('Education'))
    cvData.education.forEach((edu) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: edu.degree, size: bodySize, bold: true, color: heading, font: FONT })],
          spacing: { after: 40 },
        })
      )
      if (edu.school) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: edu.school, size: bodySize, bold: true, color: accent, font: FONT })],
            spacing: { after: 40 },
          })
        )
      }
      const eduMeta = [edu.graduation_date && `Graduated: ${edu.graduation_date}`, edu.gpa && `GPA: ${edu.gpa}`]
        .filter(Boolean)
        .join('  •  ')
      if (eduMeta) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: eduMeta, size: bodySize - 2, color: text, font: FONT })],
            spacing: { after: 120 },
          })
        )
      }
    })
  }

  // Certifications
  if (cvData.certifications && cvData.certifications.length > 0) {
    children.push(sectionHeading('Certifications'))
    cvData.certifications.forEach((cert) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: '•  ', size: bodySize, bold: true, color: accent, font: FONT }),
            new TextRun({ text: cert, size: bodySize, color: text, font: FONT }),
          ],
          spacing: { after: 60 },
        })
      )
    })
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
        children,
      },
    ],
  })

  return Packer.toBuffer(doc)
}
