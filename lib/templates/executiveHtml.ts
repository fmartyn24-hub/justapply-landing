// Executive CV template - premium, sophisticated
import { StructuredCV, CoverLetterData } from '@/lib/exportConverters'

export function generateExecutiveHtml(
  cvData: StructuredCV,
  documentType: 'cv' | 'coverLetter',
  clData?: CoverLetterData
): string {
  if (documentType === 'coverLetter') {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cover Letter</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', sans-serif; line-height: 1.7; color: #2c3e50; background: linear-gradient(to bottom, #1a1a2e 0%, #f9f9f9 100%); }
          .container { max-width: 8.5in; height: 11in; background: white; margin: 20px auto; padding: 1in; box-shadow: 0 10px 30px rgba(0,0,0,0.15); }
          p { margin-bottom: 1.2rem; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="container">
          ${clData?.opening ? `<p>${clData.opening}</p>` : ''}
          ${clData?.body_paragraphs?.map((p) => `<p>${p}</p>`).join('') || ''}
          ${clData?.closing ? `<p>${clData.closing}</p>` : ''}
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
        body { font-family: 'Segoe UI', sans-serif; color: #2c3e50; background: linear-gradient(to bottom, #1a1a2e 0%, #f9f9f9 100%); line-height: 1.6; }
        .container { max-width: 8.5in; height: 11in; background: white; margin: 20px auto; padding: 0; box-shadow: 0 10px 30px rgba(0,0,0,0.15); display: flex; flex-direction: column; }
        .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 0.4in 0.6in; }
        .header-name { font-size: 24px; font-weight: 300; letter-spacing: -0.5px; margin-bottom: 0.08in; }
        .contact { font-size: 10px; opacity: 0.9; }
        .contact span { margin: 0 0.1in; }
        .content { flex: 1; padding: 0.6in; overflow: hidden; }
        .section { margin-bottom: 0.2in; }
        .section-title { font-size: 11px; font-weight: 700; color: #1a1a2e; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 0.1in; border-left: 3px solid #d4a574; padding-left: 0.1in; }
        .entry { margin-bottom: 0.12in; }
        .entry-title { font-weight: 600; font-size: 11px; color: #1a1a2e; }
        .entry-meta { font-size: 10px; color: #7f8c8d; margin-top: 0.02in; font-weight: 500; }
        .entry-text { font-size: 10px; color: #555; line-height: 1.5; margin-top: 0.05in; }
        .achievement { font-size: 10px; color: #555; margin-left: 0.15in; line-height: 1.4; }
        .skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.12in; }
        .skill-item { }
        .skill-category { font-weight: 600; font-size: 10px; color: #1a1a2e; }
        .skill-list { font-size: 10px; color: #666; }
        .summary { background: #f8f9fa; padding: 0.1in; border-left: 3px solid #d4a574; margin-bottom: 0.15in; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-name">${header?.name || 'YOUR NAME'}</div>
          ${header?.email || header?.phone || header?.location ? `
            <div class="contact">
              ${header?.email ? `<span>${header.email}</span>` : ''}
              ${header?.phone ? `<span>•</span><span>${header.phone}</span>` : ''}
              ${header?.location ? `<span>•</span><span>${header.location}</span>` : ''}
            </div>
          ` : ''}
        </div>

        <div class="content">
          ${professional_summary ? `
            <div class="summary">
              <div style="font-size: 10px; color: #555; line-height: 1.5;">${professional_summary}</div>
            </div>
          ` : ''}

          ${experience && experience.length > 0 ? `
            <div class="section">
              <div class="section-title">Professional Experience</div>
              ${experience.map(job => `
                <div class="entry">
                  <div class="entry-title">${job.title}</div>
                  <div class="entry-meta">${[job.company, job.location].filter(Boolean).join(' • ')} | ${job.start_date || ''} – ${job.end_date || 'Present'}</div>
                  ${job.description ? `<div class="entry-text">${job.description}</div>` : ''}
                  ${job.achievements?.map(a => `<div class="achievement">◆ ${a}</div>`).join('') || ''}
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
                  <div class="entry-meta">${edu.school || ''} | ${edu.graduation_date || ''} ${edu.gpa ? '| GPA: ' + edu.gpa : ''}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${skills && skills.length > 0 ? `
            <div class="section">
              <div class="section-title">Core Competencies</div>
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

          ${certifications && certifications.length > 0 ? `
            <div class="section">
              <div class="section-title">Certifications</div>
              ${certifications.map(c => `<div class="entry-text">⭐ ${c}</div>`).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `
}
