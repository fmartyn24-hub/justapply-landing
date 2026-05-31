// Professional CV template - classic, corporate style
import { StructuredCV, CoverLetterData } from '@/lib/exportConverters'

export function generateProfessionalHtml(
  cvData: StructuredCV,
  documentType: 'cv' | 'coverLetter',
  clData?: CoverLetterData
): string {
  if (documentType === 'coverLetter') {
    const c = clData?.contact || {}
    const clContact = [c.email, c.phone, c.location, c.portfolio_url, c.linkedin_url]
      .filter(Boolean)
      .join('   |   ')
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
          body { font-family: 'Georgia', serif; line-height: 1.6; color: #2c3e50; background: white; }
          .container { max-width: 8.5in; min-height: 11in; background: white; margin: 0 auto; padding: 0.9in 1in; }
          .letterhead { border-bottom: 2px solid #1e3a5f; padding-bottom: 12px; margin-bottom: 26px; }
          .ch-name { font-size: 26px; font-weight: bold; color: #1e3a5f; }
          .ch-contact { font-size: 11px; color: #555; margin-top: 7px; }
          .ch-date { font-size: 11px; color: #555; margin-bottom: 20px; }
          .ch-re { font-size: 11px; font-weight: bold; color: #1e3a5f; margin-bottom: 18px; }
          p { margin-bottom: 12px; text-align: justify; font-size: 11px; }
          .ch-sign { margin-top: 26px; font-size: 11px; }
          .ch-sign-name { font-weight: bold; color: #1e3a5f; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="letterhead">
            <div class="ch-name">${c.name || 'Your Name'}</div>
            ${clContact ? `<div class="ch-contact">${clContact}</div>` : ''}
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
        body { font-family: 'Georgia', serif; line-height: 1.6; color: #1e3a5f; background: #f9f9f9; }
        .container { max-width: 8.5in; height: 11in; background: white; margin: 20px auto; padding: 0.75in; box-shadow: 0 2px 15px rgba(0,0,0,0.1); }
        .header { border-bottom: 3px solid #1e3a5f; padding-bottom: 0.3in; margin-bottom: 0.3in; }
        .name { font-size: 28px; font-weight: bold; color: #1e3a5f; margin-bottom: 0.1in; }
        .contact { font-size: 11px; color: #555; }
        .contact span { margin: 0 0.1in; }
        .section-title { font-size: 13px; font-weight: bold; color: white; background: #1e3a5f; padding: 0.08in 0.15in; margin-top: 0.2in; margin-bottom: 0.1in; text-transform: uppercase; letter-spacing: 1px; }
        .entry { margin-bottom: 0.15in; }
        .entry-title { font-weight: bold; font-size: 12px; color: #1e3a5f; }
        .entry-subtitle { font-style: italic; font-size: 11px; color: #555; }
        .entry-text { font-size: 11px; margin-top: 0.05in; line-height: 1.4; }
        .achievement { font-size: 11px; margin-left: 0.2in; color: #333; }
        .skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.1in; font-size: 11px; }
        .skill-item { }
        .skill-category { font-weight: bold; color: #1e3a5f; }
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
        </div>

        ${professional_summary ? `
          <div class="section-title">Professional Summary</div>
          <div class="entry-text">${professional_summary}</div>
        ` : ''}

        ${skills && skills.length > 0 ? `
          <div class="section-title">Skills</div>
          <div class="skills-grid">
            ${skills.map(s => `
              <div class="skill-item">
                <div class="skill-category">${s.category}</div>
                <div style="font-size: 11px;">${s.items.join(', ')}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${experience && experience.length > 0 ? `
          <div class="section-title">Professional Experience</div>
          ${experience.map(job => `
            <div class="entry">
              <div class="entry-title">${job.title}</div>
              <div class="entry-subtitle">${[job.company, job.location].filter(Boolean).join(' • ')}</div>
              ${job.start_date || job.end_date ? `<div class="entry-subtitle">${job.start_date || ''} – ${job.end_date || 'Present'}</div>` : ''}
              ${job.description ? `<div class="entry-text">${job.description}</div>` : ''}
              ${job.achievements?.map(a => `<div class="achievement">• ${a}</div>`).join('') || ''}
            </div>
          `).join('')}
        ` : ''}

        ${education && education.length > 0 ? `
          <div class="section-title">Education</div>
          ${education.map(edu => `
            <div class="entry">
              <div class="entry-title">${edu.degree}</div>
              ${edu.school ? `<div class="entry-subtitle">${edu.school}</div>` : ''}
              ${edu.graduation_date || edu.gpa ? '<div class="entry-subtitle">' + [edu.graduation_date && 'Graduated: ' + edu.graduation_date, edu.gpa && 'GPA: ' + edu.gpa].filter(Boolean).join(' • ') + '</div>' : ''}
            </div>
          `).join('')}
        ` : ''}

        ${certifications && certifications.length > 0 ? `
          <div class="section-title">Certifications</div>
          ${certifications.map(c => `<div class="entry-text">• ${c}</div>`).join('')}
        ` : ''}
      </div>
    </body>
    </html>
  `
}
