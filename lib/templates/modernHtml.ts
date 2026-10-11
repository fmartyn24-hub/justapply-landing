// Modern HTML CV template with professional design
// Used for in-browser preview only (rendered in an iframe / client-side).
// PDF export uses the pure-JS pdfkit generator in lib/templates/modern.ts.
import { StructuredCV, CoverLetterData } from '@/lib/exportConverters'

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

const COLORS = {
  primary: '#2563EB', // Blue
  accent: '#FF6B35', // Orange
  dark: '#1F2937', // Dark gray
  text: '#374151', // Medium gray
  light: '#F3F4F6', // Light gray
  white: '#FFFFFF',
}

export function generateModernHtml(
  cvData: StructuredCV,
  documentType: 'cv' | 'coverLetter' = 'cv',
  clData?: CoverLetterData
): string {
  // For cover letters or if cvData is empty, return simple HTML
  if (documentType === 'coverLetter' && clData) {
    const c = clData.contact || {}
    const clContact = [c.email, c.phone, c.location, c.portfolio_url, c.linkedin_url]
      .filter(Boolean)
      .join('  •  ')
    const reLine = clData.recipient?.jobTitle
      ? `Re: Application for ${clData.recipient.jobTitle}${clData.recipient.company ? ` at ${clData.recipient.company}` : ''}`
      : ''
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cover Letter</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.7; color: ${COLORS.text}; background: white; }
          .container { max-width: 8.5in; min-height: 11in; background: white; margin: 0 auto; padding: 0.9in 1in; }
          .letterhead { border-bottom: 3px solid ${COLORS.accent}; padding-bottom: 14px; margin-bottom: 26px; }
          .ch-name { font-size: 30px; font-weight: 700; color: ${COLORS.primary}; letter-spacing: -0.5px; }
          .ch-contact { font-size: 10.5px; color: ${COLORS.text}; margin-top: 7px; letter-spacing: 0.2px; }
          .ch-date { font-size: 11px; color: ${COLORS.text}; margin-bottom: 20px; }
          .ch-re { font-size: 11px; font-weight: 700; color: ${COLORS.dark}; margin-bottom: 18px; }
          p { margin-bottom: 14px; font-size: 11px; }
          .ch-sign { margin-top: 26px; font-size: 11px; }
          .ch-sign-name { font-weight: 700; color: ${COLORS.dark}; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="letterhead">
            <div class="ch-name">${c.name || 'Your Name'}</div>
            ${clContact ? `<div class="ch-contact">${clContact}</div>` : ''}
          </div>
          ${clData.date ? `<div class="ch-date">${clData.date}</div>` : ''}
          ${reLine ? `<div class="ch-re">${reLine}</div>` : ''}
          ${clData.opening ? `<p>${clData.opening}</p>` : ''}
          ${clData.body_paragraphs?.map((p) => `<p>${p}</p>`).join('') || ''}
          ${clData.closing ? `<p>${clData.closing}</p>` : ''}
          <div class="ch-sign">
            Sincerely,
            <div class="ch-sign-name">${c.name || ''}</div>
          </div>
        </div>
      </body>
      </html>
    `
  }
  const contactItems = [
    cvData.header?.email,
    cvData.header?.phone,
    cvData.header?.location,
    cvData.header?.portfolio_url,
    cvData.header?.linkedin_url,
  ]
    .filter(Boolean)
    .join(' • ')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CV - ${cvData.header?.name || 'Your Name'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      color: ${COLORS.text};
      line-height: 1.6;
      background: white;
    }

    .container {
      width: 8.5in;
      height: 11in;
      margin: 0 auto;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    /* Header */
    .header {
      background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primary}dd 100%);
      color: white;
      padding: 40px 50px 50px;
      position: relative;
      overflow: hidden;
    }

    .header::before {
      content: '';
      position: absolute;
      right: -50px;
      top: -50px;
      width: 200px;
      height: 200px;
      background: rgba(255, 107, 53, 0.15);
      border-radius: 50%;
    }

    .header::after {
      content: '';
      position: absolute;
      right: 0;
      bottom: 0;
      width: 1px;
      height: 100%;
      background: ${COLORS.accent};
      opacity: 0.3;
    }

    .header-content {
      position: relative;
      z-index: 1;
    }

    .name {
      font-size: 38px;
      font-weight: 700;
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }

    .contact {
      font-size: 11px;
      opacity: 0.95;
      letter-spacing: 0.3px;
    }

    /* Main content */
    .content {
      padding: 40px 50px;
      height: calc(11in - 140px);
      overflow: hidden;
    }

    /* Section */
    .section {
      margin-bottom: 32px;
    }

    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 18px;
      gap: 12px;
    }

    .section-header::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 24px;
      background: ${COLORS.accent};
      border-radius: 2px;
      flex-shrink: 0;
    }

    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: ${COLORS.primary};
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Professional Summary */
    .summary {
      font-size: 11px;
      line-height: 1.7;
      color: ${COLORS.text};
      padding: 0;
    }

    /* Skills */
    .skills-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 20px;
    }

    .skill-group {
      font-size: 11px;
    }

    .skill-category {
      font-weight: 600;
      color: ${COLORS.primary};
      margin-bottom: 4px;
    }

    .skill-items {
      color: ${COLORS.text};
      font-size: 10px;
    }

    /* Experience */
    .job {
      margin-bottom: 20px;
    }

    .job-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 4px;
    }

    .job-title {
      font-weight: 700;
      color: ${COLORS.dark};
      font-size: 12px;
    }

    .job-company {
      font-size: 11px;
      color: ${COLORS.primary};
      font-weight: 600;
    }

    .job-meta {
      font-size: 10px;
      color: ${COLORS.text};
      margin-bottom: 6px;
    }

    .job-desc {
      font-size: 11px;
      color: ${COLORS.text};
      margin-bottom: 6px;
      line-height: 1.55;
    }

    .achievements {
      font-size: 11px;
      margin-left: 12px;
      color: ${COLORS.text};
    }

    .achievement {
      margin-bottom: 4px;
      position: relative;
      padding-left: 12px;
    }

    .achievement::before {
      content: '▸';
      position: absolute;
      left: 0;
      color: ${COLORS.accent};
      font-weight: bold;
    }

    /* Education */
    .education-item {
      margin-bottom: 14px;
      font-size: 11px;
    }

    .degree {
      font-weight: 700;
      color: ${COLORS.dark};
      margin-bottom: 2px;
    }

    .school {
      color: ${COLORS.text};
      font-size: 10px;
      margin-bottom: 2px;
    }

    .edu-meta {
      font-size: 10px;
      color: ${COLORS.text};
    }

    /* Certifications */
    .certification {
      font-size: 11px;
      margin-bottom: 6px;
      padding-left: 12px;
      position: relative;
    }

    .certification::before {
      content: '•';
      position: absolute;
      left: 0;
      color: ${COLORS.accent};
      font-weight: bold;
    }

    /* Additional */
    .additional {
      font-size: 11px;
      color: ${COLORS.text};
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="header-content">
        <div class="name">${cvData.header?.name || 'Your Name'}</div>
        <div class="contact">${contactItems}</div>
      </div>
    </div>

    <!-- Content -->
    <div class="content">
      ${cvData.professional_summary ? `
        <div class="section">
          <div class="section-header">
            <span class="section-title">Professional Summary</span>
          </div>
          <div class="summary">${cvData.professional_summary}</div>
        </div>
      ` : ''}

      ${cvData.skills && cvData.skills.length > 0 ? `
        <div class="section">
          <div class="section-header">
            <span class="section-title">Skills</span>
          </div>
          <div class="skills-grid">
            ${cvData.skills
              .map(
                (group) => `
              <div class="skill-group">
                <div class="skill-category">${group.category}</div>
                <div class="skill-items">${group.items.join(', ')}</div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      ` : ''}

      ${cvData.experience && cvData.experience.length > 0 ? `
        <div class="section">
          <div class="section-header">
            <span class="section-title">Professional Experience</span>
          </div>
          ${cvData.experience
            .map(
              (job) => `
            <div class="job">
              <div class="job-header">
                <div>
                  <div class="job-title">${job.title}</div>
                  <div class="job-company">${job.company}</div>
                </div>
              </div>
              ${job.location ? `<div class="job-meta">${job.location}</div>` : ''}
              ${job.start_date || job.end_date ? `<div class="job-meta">${job.start_date || ''} – ${job.end_date || 'Present'}</div>` : ''}
              ${job.description ? `<div class="job-desc">${job.description}</div>` : ''}
              ${job.achievements && job.achievements.length > 0 ? `
                <div class="achievements">
                  ${job.achievements.map((a) => `<div class="achievement">${a}</div>`).join('')}
                </div>
              ` : ''}
            </div>
          `
            )
            .join('')}
        </div>
      ` : ''}

      ${cvData.education && cvData.education.length > 0 ? `
        <div class="section">
          <div class="section-header">
            <span class="section-title">Education</span>
          </div>
          ${cvData.education
            .map(
              (edu) => `
            <div class="education-item">
              <div class="degree">${edu.degree}</div>
              ${edu.school ? `<div class="school">${edu.school}</div>` : ''}
              ${edu.graduation_date ? `<div class="edu-meta">Graduated: ${edu.graduation_date}</div>` : ''}
              ${edu.gpa ? `<div class="edu-meta">GPA: ${edu.gpa}</div>` : ''}
            </div>
          `
            )
            .join('')}
        </div>
      ` : ''}

      ${cvData.certifications && cvData.certifications.length > 0 ? `
        <div class="section">
          <div class="section-header">
            <span class="section-title">Certifications</span>
          </div>
          ${cvData.certifications.map((cert) => `<div class="certification">${cert}</div>`).join('')}
        </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
  `.trim()
}
