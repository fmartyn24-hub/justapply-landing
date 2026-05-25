// ATS-optimized CV template - plain text, no formatting
import { StructuredCV, CoverLetterData } from '@/lib/exportConverters'

export function generateAtsHtml(
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
          body { font-family: 'Courier New', monospace; line-height: 1.6; color: #333; background: #f5f5f5; }
          .container { max-width: 8.5in; height: 11in; background: white; margin: 20px auto; padding: 1in; box-shadow: 0 1px 3px rgba(0,0,0,0.1); white-space: pre-wrap; word-wrap: break-word; }
          p { margin-bottom: 1rem; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="container">
${clData?.opening ? clData.opening + '\n\n' : ''}${clData?.body_paragraphs?.map((p) => p).join('\n\n') || ''}${clData?.closing ? '\n\n' + clData.closing : ''}
        </div>
      </body>
      </html>
    `
  }

  const { header, professional_summary, skills, experience, education, certifications } = cvData

  let text = ''

  if (header?.name) text += header.name.toUpperCase() + '\n'
  if (header?.email || header?.phone || header?.location) {
    text += [header?.email, header?.phone, header?.location].filter(Boolean).join(' | ') + '\n'
  }
  text += '\n'

  if (professional_summary) {
    text += 'PROFESSIONAL SUMMARY\n'
    text += professional_summary + '\n\n'
  }

  if (experience && experience.length > 0) {
    text += 'PROFESSIONAL EXPERIENCE\n'
    experience.forEach(job => {
      text += job.title + '\n'
      text += [job.company, job.location].filter(Boolean).join(' | ') + '\n'
      if (job.start_date || job.end_date) {
        text += job.start_date + ' - ' + (job.end_date || 'Present') + '\n'
      }
      if (job.description) text += job.description + '\n'
      if (job.achievements) {
        job.achievements.forEach(a => {
          text += '- ' + a + '\n'
        })
      }
      text += '\n'
    })
    text += '\n'
  }

  if (education && education.length > 0) {
    text += 'EDUCATION\n'
    education.forEach(edu => {
      text += edu.degree + '\n'
      if (edu.school) text += edu.school + '\n'
      if (edu.graduation_date || edu.gpa) {
        text += [edu.graduation_date && 'Graduated: ' + edu.graduation_date, edu.gpa && 'GPA: ' + edu.gpa].filter(Boolean).join(' | ') + '\n'
      }
      text += '\n'
    })
    text += '\n'
  }

  if (skills && skills.length > 0) {
    text += 'SKILLS\n'
    skills.forEach(skillGroup => {
      text += skillGroup.category + ': ' + skillGroup.items.join(', ') + '\n'
    })
    text += '\n'
  }

  if (certifications && certifications.length > 0) {
    text += 'CERTIFICATIONS\n'
    certifications.forEach(c => {
      text += '- ' + c + '\n'
    })
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CV - ${header?.name || 'Resume'}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; color: #333; background: #f5f5f5; line-height: 1.6; }
        .container { max-width: 8.5in; height: 11in; background: white; margin: 20px auto; padding: 1in; box-shadow: 0 1px 3px rgba(0,0,0,0.1); white-space: pre-wrap; word-wrap: break-word; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="container">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </body>
    </html>
  `
}
