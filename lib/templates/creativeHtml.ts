// Creative CV template - bold, modern, eye-catching
import { StructuredCV, CoverLetterData } from '@/lib/exportConverters'

export function generateCreativeHtml(
  cvData: StructuredCV,
  documentType: 'cv' | 'coverLetter',
  clData?: CoverLetterData
): string {
  if (documentType === 'coverLetter') {
    const c = clData?.contact || {}
    const clContact = [c.email, c.phone, c.location, c.portfolio_url, c.linkedin_url]
      .filter(Boolean)
      .join('  •  ')
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
          body { font-family: 'Segoe UI', sans-serif; line-height: 1.7; color: #333; background: white; }
          .container { max-width: 8.5in; min-height: 11in; background: white; margin: 0 auto; padding: 0.9in 1in; }
          .letterhead { border-bottom: 3px solid #667eea; padding-bottom: 14px; margin-bottom: 26px; }
          .ch-name { font-size: 28px; font-weight: bold; color: #667eea; }
          .ch-contact { font-size: 10.5px; color: #666; margin-top: 7px; }
          .ch-date { font-size: 11px; color: #666; margin-bottom: 20px; }
          .ch-re { font-size: 11px; font-weight: bold; color: #5a4cae; margin-bottom: 18px; }
          p { margin-bottom: 14px; font-size: 11px; }
          .ch-sign { margin-top: 26px; font-size: 11px; }
          .ch-sign-name { font-weight: bold; color: #667eea; margin-top: 4px; }
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
        body { font-family: 'Segoe UI', sans-serif; color: #333; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); line-height: 1.6; }
        /* The left column colour is painted on the container (not the sidebar)
           so it spans the FULL document height and stays solid across page
           breaks. A flex sidebar background only reaches as far as its own
           content, which leaves an ugly white gutter on page 2+. */
        .container { max-width: 8.5in; height: 11in; background: linear-gradient(to right, #6e5fc6 0, #6e5fc6 2.5in, #ffffff 2.5in, #ffffff 100%); margin: 20px auto; padding: 0; box-shadow: 0 20px 40px rgba(0,0,0,0.3); display: flex; }
        .sidebar { color: white; padding: 0.5in; width: 2.5in; }
        .content { flex: 1; padding: 0.6in; }
        .header-name { font-size: 22px; font-weight: bold; margin-bottom: 0.1in; }
        .contact { font-size: 9px; margin-top: 0.2in; }
        .contact-item { margin: 0.05in 0; }
        .section-title { font-size: 12px; font-weight: bold; color: #667eea; text-transform: uppercase; letter-spacing: 1px; margin-top: 0.2in; margin-bottom: 0.1in; border-bottom: 2px solid #667eea; padding-bottom: 0.05in; }
        .entry { margin-bottom: 0.15in; }
        .entry-title { font-weight: bold; font-size: 11px; color: #667eea; }
        .entry-subtitle { font-size: 10px; color: #666; margin-top: 0.02in; }
        .entry-text { font-size: 10px; color: #555; line-height: 1.4; margin-top: 0.05in; }
        .achievement { font-size: 10px; color: #555; margin: 0.02in 0 0.02in 0.1in; }
        .skills-list { font-size: 10px; color: white; }
        .skill-tag { display: inline-block; background: rgba(255,255,255,0.2); padding: 0.04in 0.08in; margin: 0.03in 0.03in 0.03in 0; border-radius: 3px; font-size: 9px; }
        .sidebar-section { margin-bottom: 0.2in; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="sidebar">
          <div class="header-name">${header?.name || 'YOUR NAME'}</div>
          ${header?.email || header?.phone || header?.location ? `
            <div class="contact">
              ${header?.email ? `<div class="contact-item">${header.email}</div>` : ''}
              ${header?.phone ? `<div class="contact-item">${header.phone}</div>` : ''}
              ${header?.location ? `<div class="contact-item">${header.location}</div>` : ''}
            </div>
          ` : ''}

          ${skills && skills.length > 0 ? `
            <div class="sidebar-section">
              <div style="font-size: 11px; font-weight: bold; margin-bottom: 0.08in;">SKILLS</div>
              ${skills.map(s => `
                <div style="margin-bottom: 0.08in;">
                  <div style="font-size: 9px; font-weight: bold; margin-bottom: 0.03in;">${s.category}</div>
                  <div class="skills-list">
                    ${s.items.map(item => `<span class="skill-tag">${item}</span>`).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <div class="content">
          ${professional_summary ? `
            <div style="margin-bottom: 0.15in;">
              <div style="font-size: 10px; color: #555; line-height: 1.5;">${professional_summary}</div>
            </div>
          ` : ''}

          ${experience && experience.length > 0 ? `
            <div style="margin-bottom: 0.15in;">
              <div class="section-title">Experience</div>
              ${experience.map(job => `
                <div class="entry">
                  <div class="entry-title">${job.title}</div>
                  <div class="entry-subtitle">${[job.company, job.location].filter(Boolean).join(' • ')} ${job.start_date || job.end_date ? `| ${job.start_date || ''} – ${job.end_date || 'Present'}` : ''}</div>
                  ${job.description ? `<div class="entry-text">${job.description}</div>` : ''}
                  ${job.achievements?.map(a => `<div class="achievement">→ ${a}</div>`).join('') || ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${education && education.length > 0 ? `
            <div class="section-title">Education</div>
            ${education.map(edu => `
              <div class="entry">
                <div class="entry-title">${edu.degree}</div>
                <div class="entry-subtitle">${edu.school || ''} ${edu.graduation_date || edu.gpa ? '| ' + [edu.graduation_date && 'Graduated ' + edu.graduation_date, edu.gpa && 'GPA ' + edu.gpa].filter(Boolean).join(', ') : ''}</div>
              </div>
            `).join('')}
          ` : ''}

          ${certifications && certifications.length > 0 ? `
            <div class="section-title">Certifications</div>
            ${certifications.map(c => `<div class="entry-text">⭐ ${c}</div>`).join('')}
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `
}
