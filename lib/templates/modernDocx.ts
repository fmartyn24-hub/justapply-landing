// Modern DOCX template with professional design
// Uses proper colored blocks, accent bars, and visual hierarchy

import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, BorderStyle, WidthType, convertInchesToTwip, VerticalAlign, ShadingType } from 'docx'

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
  lightBg: 'EFF6FF', // Light blue
}

// Create a blue header block
function createHeaderBlock(cvData: CVData): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        height: { value: 800, rule: 'auto' },
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, color: COLORS.primary },
            margins: { top: 300, bottom: 300, left: 300, right: 300 },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: cvData.header?.name || 'YOUR NAME',
                    size: 48,
                    bold: true,
                    color: 'FFFFFF',
                    font: 'Calibri',
                  }),
                ],
                spacing: { after: 150 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: [cvData.header?.email, cvData.header?.phone, cvData.header?.location]
                      .filter(Boolean)
                      .join(' • ') || '',
                    size: 20,
                    color: 'FFFFFF',
                    font: 'Calibri',
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

// Create section header with orange accent bar
function createSectionHeaderWithAccent(title: string): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          // Orange accent bar
          new TableCell({
            width: { size: 2, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, color: COLORS.accent },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [new Paragraph('')],
          }),
          // Title cell
          new TableCell({
            width: { size: 98, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            margins: { top: 150, bottom: 150, left: 200, right: 0 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: title,
                    size: 24,
                    bold: true,
                    color: COLORS.primary,
                    font: 'Calibri',
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
    // Header block
    children.push(createHeaderBlock(cvData))
    children.push(new Paragraph({ text: '', spacing: { after: 300 } }))

    // Professional Summary
    if (cvData.professional_summary) {
      children.push(createSectionHeaderWithAccent('PROFESSIONAL SUMMARY'))
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
      children.push(createSectionHeaderWithAccent('SKILLS'))

      // Create skills table
      const skillRows = cvData.skills.map(
        (skillGroup) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 25, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.CLEAR, color: COLORS.lightBg },
                margins: { top: 100, bottom: 100, left: 150, right: 150 },
                borders: {
                  top: { style: BorderStyle.SINGLE, color: COLORS.primary },
                  bottom: { style: BorderStyle.SINGLE, color: COLORS.primary },
                  left: { style: BorderStyle.SINGLE, color: COLORS.primary },
                  right: { style: BorderStyle.SINGLE, color: COLORS.primary },
                },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: skillGroup.category,
                        size: 22,
                        bold: true,
                        color: COLORS.primary,
                        font: 'Calibri',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 75, type: WidthType.PERCENTAGE },
                margins: { top: 100, bottom: 100, left: 150, right: 150 },
                borders: {
                  top: { style: BorderStyle.SINGLE, color: COLORS.primary },
                  bottom: { style: BorderStyle.SINGLE, color: COLORS.primary },
                  left: { style: BorderStyle.SINGLE, color: COLORS.primary },
                  right: { style: BorderStyle.SINGLE, color: COLORS.primary },
                },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: skillGroup.items.join(', '),
                        size: 22,
                        color: COLORS.text,
                        font: 'Calibri',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          })
      )

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: skillRows,
        })
      )
      children.push(new Paragraph({ text: '', spacing: { after: 300 } }))
    }

    // Experience
    if (cvData.experience && cvData.experience.length > 0) {
      children.push(createSectionHeaderWithAccent('PROFESSIONAL EXPERIENCE'))

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
            spacing: { after: 0 },
          })
        )

        const companlyAndLocation = [job.company, job.location].filter(Boolean).join(' • ')
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: companlyAndLocation,
                size: 22,
                color: COLORS.primary,
                font: 'Calibri',
              }),
            ],
            spacing: { after: 0 },
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
              spacing: { after: 150 },
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
              spacing: { after: 150, line: 360 },
            })
          )
        }

        if (job.achievements && job.achievements.length > 0) {
          job.achievements.forEach((achievement) => {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: '▸ ',
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
                spacing: { after: 100 },
              })
            )
          })
        }

        children.push(new Paragraph({ text: '', spacing: { after: 200 } }))
      })
    }

    // Education
    if (cvData.education && cvData.education.length > 0) {
      children.push(createSectionHeaderWithAccent('EDUCATION'))

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
            spacing: { after: 0 },
          })
        )

        if (edu.school) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: edu.school,
                  size: 22,
                  color: COLORS.primary,
                  font: 'Calibri',
                }),
              ],
              spacing: { after: 0 },
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
      children.push(createSectionHeaderWithAccent('CERTIFICATIONS'))

      cvData.certifications.forEach((cert) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '• ',
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
            spacing: { after: 100 },
          })
        )
      })
    }
  } else if (documentType === 'coverLetter' && clData) {
    // Cover Letter with header
    children.push(createHeaderBlock({}))
    children.push(new Paragraph({ text: '', spacing: { after: 300 } }))

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
