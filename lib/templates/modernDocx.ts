// Modern DOCX template - simplified for reliability
// Uses clean paragraphs with professional styling instead of complex tables

import { Document, Packer, Paragraph, TextRun, convertInchesToTwip, UnderlineType } from 'docx'

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

const COLORS = {
  primary: '2563EB', // Blue
  accent: 'FF6B35', // Orange
  dark: '1F2937', // Dark gray
  text: '374151', // Medium gray
}

export async function generateModernDocx(
  cvData: CVData,
  documentType: 'cv' | 'coverLetter',
  clData?: CoverLetterData
): Promise<Buffer> {
  const children: Paragraph[] = []

  if (documentType === 'cv') {
    // Header - Name
    if (cvData.header?.name) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cvData.header.name,
              size: 48,
              bold: true,
              color: COLORS.primary,
              font: 'Calibri',
            }),
          ],
          spacing: { after: 100 },
        })
      )
    }

    // Contact info
    const contactInfo = [cvData.header?.email, cvData.header?.phone, cvData.header?.location]
      .filter(Boolean)
      .join(' • ')
    if (contactInfo) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: contactInfo,
              size: 20,
              color: COLORS.text,
              font: 'Calibri',
            }),
          ],
          spacing: { after: 300, line: 240 },
          border: {
            bottom: {
              color: COLORS.primary,
              space: 1,
              style: 'single',
              size: 12,
            },
          },
        })
      )
    }

    // Professional Summary
    if (cvData.professional_summary) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'PROFESSIONAL SUMMARY',
              size: 24,
              bold: true,
              color: COLORS.primary,
              font: 'Calibri',
            }),
          ],
          spacing: { after: 150 },
        })
      )
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cvData.professional_summary,
              size: 22,
              color: COLORS.text,
              font: 'Calibri',
            }),
          ],
          spacing: { after: 300, line: 360 },
        })
      )
    }

    // Skills
    if (cvData.skills && cvData.skills.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'SKILLS',
              size: 24,
              bold: true,
              color: COLORS.primary,
              font: 'Calibri',
            }),
          ],
          spacing: { after: 150 },
        })
      )

      cvData.skills.forEach((skillGroup) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: skillGroup.category + '  ',
                size: 22,
                bold: true,
                color: COLORS.accent,
                font: 'Calibri',
              }),
              new TextRun({
                text: skillGroup.items.join(', '),
                size: 22,
                color: COLORS.text,
                font: 'Calibri',
              }),
            ],
            spacing: { after: 100 },
          })
        )
      })
      children.push(new Paragraph({ text: '', spacing: { after: 200 } }))
    }

    // Experience
    if (cvData.experience && cvData.experience.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'PROFESSIONAL EXPERIENCE',
              size: 24,
              bold: true,
              color: COLORS.primary,
              font: 'Calibri',
            }),
          ],
          spacing: { after: 150 },
        })
      )

      cvData.experience.forEach((job) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: job.title,
                size: 24,
                bold: true,
                color: COLORS.dark,
                font: 'Calibri',
              }),
            ],
            spacing: { after: 50 },
          })
        )

        const companyAndLocation = [job.company, job.location].filter(Boolean).join(' • ')
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: companyAndLocation,
                size: 22,
                bold: true,
                color: COLORS.accent,
                font: 'Calibri',
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
                  text: `${job.start_date || ''} – ${job.end_date || 'Present'}`,
                  size: 20,
                  color: COLORS.text,
                  font: 'Calibri',
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
                  size: 22,
                  color: COLORS.text,
                  font: 'Calibri',
                }),
              ],
              spacing: { after: 100, line: 360 },
            })
          )
        }

        if (job.achievements && job.achievements.length > 0) {
          job.achievements.forEach((achievement) => {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: '◆ ',
                    size: 22,
                    color: COLORS.accent,
                    bold: true,
                    font: 'Calibri',
                  }),
                  new TextRun({
                    text: achievement,
                    size: 22,
                    color: COLORS.text,
                    font: 'Calibri',
                  }),
                ],
                spacing: { after: 75 },
                indent: { firstLine: 360, left: 360 },
              })
            )
          })
        }

        children.push(new Paragraph({ text: '', spacing: { after: 200 } }))
      })
    }

    // Education
    if (cvData.education && cvData.education.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'EDUCATION',
              size: 24,
              bold: true,
              color: COLORS.primary,
              font: 'Calibri',
            }),
          ],
          spacing: { after: 150 },
        })
      )

      cvData.education.forEach((edu) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: edu.degree,
                size: 24,
                bold: true,
                color: COLORS.dark,
                font: 'Calibri',
              }),
            ],
            spacing: { after: 50 },
          })
        )

        if (edu.school) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: edu.school,
                  size: 22,
                  bold: true,
                  color: COLORS.accent,
                  font: 'Calibri',
                }),
              ],
              spacing: { after: 50 },
            })
          )
        }

        const eduMeta = [edu.graduation_date && `Graduated: ${edu.graduation_date}`, edu.gpa && `GPA: ${edu.gpa}`]
          .filter(Boolean)
          .join(' • ')

        if (eduMeta) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: eduMeta,
                  size: 20,
                  color: COLORS.text,
                  font: 'Calibri',
                }),
              ],
              spacing: { after: 150 },
            })
          )
        }
      })
    }

    // Certifications
    if (cvData.certifications && cvData.certifications.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'CERTIFICATIONS',
              size: 24,
              bold: true,
              color: COLORS.primary,
              font: 'Calibri',
            }),
          ],
          spacing: { after: 150 },
        })
      )

      cvData.certifications.forEach((cert) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '◆ ',
                size: 22,
                color: COLORS.accent,
                bold: true,
                font: 'Calibri',
              }),
              new TextRun({
                text: cert,
                size: 22,
                color: COLORS.text,
                font: 'Calibri',
              }),
            ],
            spacing: { after: 75 },
          })
        )
      })
    }
  } else if (documentType === 'coverLetter' && clData) {
    // Cover Letter - simple format
    if (clData.opening) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: clData.opening,
              size: 22,
              color: COLORS.text,
              font: 'Calibri',
            }),
          ],
          spacing: { after: 200, line: 360 },
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
                size: 22,
                color: COLORS.text,
                font: 'Calibri',
              }),
            ],
            spacing: { after: 200, line: 360 },
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
              size: 22,
              color: COLORS.text,
              font: 'Calibri',
            }),
          ],
          spacing: { after: 200, line: 360 },
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
