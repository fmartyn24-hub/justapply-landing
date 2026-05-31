// Minimalist CV template - clean, elegant, modern
import { StructuredCV, CoverLetterData } from '@/lib/exportConverters'

export function generateMinimalistHtml(
  cvData: StructuredCV,
  documentType: 'cv' | 'coverLetter',
  clData?: CoverLetterData
): string {
  if (documentType === 'coverLetter') {
    const c = clData?.contact || {}
    const clContact = [c.email, c.phone, c.location, c.portfolio_url, c.linkedin_url]
      .filter(Boolean)
      .join('  ·  ')
    const reLine = clData?.recipient?.jobTitle
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
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.7; color: #2a2a2a; background: white; }
          .container { max-width: 8.5in; min-height: 11in; background: white; margin: 0 auto; padding: 1in; }
          .letterhead { margin-bottom: 0.35in; }
          .ch-name { font-size: 24px; font-weight: 300; letter-spacing: -0.5px; color: #1a1a1a; }
          .ch-contact { font-size: 10px; color: #666; letter-spacing: 0.5px; margin-top: 8px; }
          .ch-divider { height: 1px; background: #e0e0e0; margin: 0.18in 0 0.26in; }
          .ch-date { font-size: 11px; color: #888; margin-bottom: 20px; }
          .ch-re { font-size: 11px; font-weight: 600; color: #1a1a1a; margin-bottom: 18px; }
          p { margin-bottom: 1.2rem; text-align: justify; font-size: 11px; }
          .ch-sign { margin-top: 26px; font-size: 11px; }
          .ch-sign-name { font-weight: 600; color: #1a1a1a; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="letterhead">
            <div class="ch-name">${c.name || 'Your Name'}</div>
            ${clContact ? `<div class="ch-contact">${clContact}</div>` : ''}
            <div class="ch-divider"></div>
          </div>
          ${clData?.date ? `<div class="ch-date">${clData.date}</div>` : ''}
          ${reLine ? `<div class="ch-re">${reLine}</div>` : ''}
          ${clData?.opening ? `<p>${clData.opening}</p>` : ''}
          ${clData?.body_paragraphs?.map((p) => `<p>${p}</p>`).join('') || ''}
          ${clData?.closing ? `<p>${clData.closing}</p>` : ''}
          <div class="ch-sign">
            Sincerely,
            <div class="ch-sign-name">${c.name || ''}</div>
          </div>
        </div>
      </body>
      </html>
    `
  }

  const { header, professional_summary, skills, experience, education, certifications } = cvData

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CV - ${header?.name || 'Resume'}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #2a2a2a; background: #fafafa; line-height: 1.6; }
        .container { max-width: 8.5in; height: 11in; background: white; margin: 20px auto; padding: 0.6in; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .header { margin-bottom: 0.4in; }
        .name { font-size: 26px; font-weight: 300; letter-spacing: -0.5px; color: #1a1a1a; margin-bottom: 0.08in; }
        .contact { font-size: 10px; color: #666; letter-spacing: 0.5px; }
        .contact span { margin: 0 0.12in; }
        .divider { height: 1px; background: #e0e0e0; margin: 0.15in 0; }
        .section { margin-bottom: 0.25in; }
        .section-title { font-size: 11px; font-weight: 600; color: #1a1a1a; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 0.1in; }
        .entry { margin-bottom: 0.12in; }
        .entry-title { font-weight: 600; font-size: 11px; color: #1a1a1a; }
        .entry-meta { font-size: 10px; color: #888; margin-top: 0.02in; }
        .entry-text { font-size: 10px; color: #555; line-height: 1.5; margin-top: 0.05in; }
        .achievement { font-size: 10px; color: #555; margin-left: 0.15in; line-height: 1.4; }
        .skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.15in; }
        .skill-item { }
        .skill-category { font-weight: 600; font-size: 10px; color: #1a1a1a; margin-bottom: 0.02in; }
        .skill-list { font-size: 10px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="name">${header?.name || 'YOUR NAME'}</div>
          ${header?.email || header?.phone || header?.location ? `
            <div class="contact">
              ${header?.email ? `<span>${header.email}</span>` : ''}
              ${header?.phone ? `<span>•</span><span>${header.phone}</span>` : ''}
              ${header?.location ? `<span>•</span><span>${header.location}</span>` : ''}
            </div>
          ` : ''}
          <div class="divider"></div>
        </div>

        ${professional_summary ? `
          <div class="section">
            <div class="entry-text">${professional_summary}</div>
          </div>
        ` : ''}

        ${skills && skills.length > 0 ? `
          <div class="section">
            <div class="section-title">Skills</div>
            <div class="skills-grid">
              ${skills.map(s => `
                <div class="skill-item">
                  <div class="skill-category">${s.category}</div>
                  <div class="skill-list">${s.items.join(', ')}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${experience && experience.length > 0 ? `
          <div class="section">
            <div class="section-title">Experience</div>
            ${experience.map(job => `
              <div class="entry">
                <div class="entry-title">${job.title}</div>
                <div class="entry-meta">${[job.company, job.location].filter(Boolean).join(' • ')} ${job.start_date || job.end_date ? `/ ${job.start_date || ''} – ${job.end_date || 'Present'}` : ''}</div>
                ${job.description ? `<div class="entry-text">${job.description}</div>` : ''}
                ${job.achievements?.map(a => `<div class="achievement">• ${a}</div>`).join('') || ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${education && education.length > 0 ? `
          <div class="section">
            <div class="section-title">Education</div>
            ${education.map(edu => `
              <div class="entry">
                <div class="entry-title">${edu.degree}</div>
                <div class="entry-meta">${edu.school || ''} ${edu.graduation_date || edu.gpa ? '/ ' + [edu.graduation_date && 'Graduated ' + edu.graduation_date, edu.gpa && 'GPA ' + edu.gpa].filter(Boolean).join(', ') : ''}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${certifications && certifications.length > 0 ? `
          <div class="section">
            <div class="section-title">Certifications</div>
            ${certifications.map(c => `<div class="entry-text">• ${c}</div>`).join('')}
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `
}
