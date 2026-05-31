// Academic CV template - scholarly, structured
import { StructuredCV, CoverLetterData } from '@/lib/exportConverters'

export function generateAcademicHtml(
  cvData: StructuredCV,
  documentType: 'cv' | 'coverLetter',
  clData?: CoverLetterData
): string {
  if (documentType === 'coverLetter') {
    const c = clData?.contact || {}
    const clContact = [c.email, c.phone, c.location, c.portfolio_url, c.linkedin_url]
      .filter(Boolean)
      .join('  |  ')
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
          body { font-family: 'Times New Roman', Times, serif; line-height: 1.8; color: #1a1a1a; background: white; }
          .container { max-width: 8.5in; min-height: 11in; background: white; margin: 0 auto; padding: 1in; }
          .letterhead { text-align: center; border-bottom: 1px solid #333; padding-bottom: 0.15in; margin-bottom: 0.3in; }
          .ch-name { font-size: 18px; font-weight: bold; color: #1a1a1a; }
          .ch-contact { font-size: 10px; color: #333; margin-top: 7px; }
          .ch-date { font-size: 11px; color: #333; margin-bottom: 20px; }
          .ch-re { font-size: 11px; font-weight: bold; color: #1a1a1a; margin-bottom: 18px; }
          p { margin-bottom: 1.2rem; text-align: justify; font-size: 11px; }
          .ch-sign { margin-top: 26px; font-size: 11px; }
          .ch-sign-name { font-weight: bold; color: #1a1a1a; margin-top: 4px; }
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
        body { font-family: 'Times New Roman', Times, serif; color: #1a1a1a; background: #f5f5f0; line-height: 1.6; }
        .container { max-width: 8.5in; height: 11in; background: white; margin: 20px auto; padding: 0.75in; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 0.3in; border-bottom: 1px solid #333; padding-bottom: 0.15in; }
        .name { font-size: 16px; font-weight: bold; color: #1a1a1a; margin-bottom: 0.05in; }
        .contact { font-size: 10px; color: #333; }
        .contact span { margin: 0 0.1in; }
        .section-title { font-size: 12px; font-weight: bold; color: #1a1a1a; text-transform: uppercase; margin-top: 0.2in; margin-bottom: 0.1in; border-bottom: 1px solid #ccc; padding-bottom: 0.05in; }
        .entry { margin-bottom: 0.12in; }
        .entry-title { font-weight: bold; font-size: 11px; color: #1a1a1a; }
        .entry-subtitle { font-size: 10px; color: #333; margin-top: 0.02in; }
        .entry-text { font-size: 10px; color: #333; line-height: 1.5; margin-top: 0.04in; }
        .achievement { font-size: 10px; color: #333; margin-left: 0.15in; }
        .skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.1in; font-size: 10px; }
        .skill-item { }
        .skill-category { font-weight: bold; color: #1a1a1a; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="name">${header?.name || 'YOUR NAME'}</div>
          ${header?.email || header?.phone || header?.location ? `
            <div class="contact">
              ${header?.email ? `<span>${header.email}</span>` : ''}
              ${header?.phone ? `<span>|</span><span>${header.phone}</span>` : ''}
              ${header?.location ? `<span>|</span><span>${header.location}</span>` : ''}
            </div>
          ` : ''}
        </div>

        ${professional_summary ? `
          <div class="section-title">Professional Summary</div>
          <div class="entry-text">${professional_summary}</div>
        ` : ''}

        ${experience && experience.length > 0 ? `
          <div class="section-title">Professional Experience</div>
          ${experience.map(job => `
            <div class="entry">
              <div class="entry-title">${job.title}</div>
              <div class="entry-subtitle">${[job.company, job.location].filter(Boolean).join(' • ')} (${job.start_date || ''} – ${job.end_date || 'Present'})</div>
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
              <div class="entry-subtitle">${edu.school || ''} (${edu.graduation_date || ''} ${edu.gpa ? ', GPA: ' + edu.gpa : ''})</div>
            </div>
          `).join('')}
        ` : ''}

        ${skills && skills.length > 0 ? `
          <div class="section-title">Competencies</div>
          <div class="skills-grid">
            ${skills.map(s => `
              <div class="skill-item">
                <div class="skill-category">${s.category}</div>
                <div style="font-size: 10px;">${s.items.join(', ')}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${certifications && certifications.length > 0 ? `
          <div class="section-title">Certifications & Credentials</div>
          ${certifications.map(c => `<div class="entry-text">• ${c}</div>`).join('')}
        ` : ''}
      </div>
    </body>
    </html>
  `
}
