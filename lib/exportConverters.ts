// Helper functions to convert between plain text and structured CV formats

export interface CoverLetterData {
  opening?: string
  body_paragraphs?: string[]
  closing?: string
  // Optional letterhead data so cover letters can render a proper header,
  // date and signature that match their paired CV template.
  contact?: {
    name?: string
    email?: string
    phone?: string
    location?: string
    portfolio_url?: string
    linkedin_url?: string
  }
  date?: string
  recipient?: {
    jobTitle?: string
    company?: string
  }
}

export interface StructuredCV {
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

// Convert plain text CV to basic structured format
// This is a best-effort conversion for backward compatibility
export function convertPlainTextCvToStructured(plainText: string, userEmail?: string, userName?: string): StructuredCV {
  const lines = plainText.split('\n')
  const cv: StructuredCV = {}

  // Extract header information
  const header: StructuredCV['header'] = {
    name: userName,
    email: userEmail,
  }

  // Try to find section headers and parse content
  let currentSection = ''
  let currentSectionContent: string[] = []
  const sections: { [key: string]: string[] } = {}

  lines.forEach((line) => {
    const trimmed = line.trim()

    // Check if this is a section header
    const sectionHeaders = [
      'PROFESSIONAL SUMMARY',
      'PROFESSIONAL EXPERIENCE',
      'EXPERIENCE',
      'SKILLS',
      'EDUCATION',
      'CERTIFICATIONS',
      'LANGUAGES',
      'PROJECTS',
      'ACHIEVEMENTS',
      'CORE COMPETENCIES',
      'KEY SKILLS',
      'TECHNICAL SKILLS',
      'TECHNICAL EXPERTISE',
      'ADDITIONAL',
      'AWARDS',
      'PUBLICATIONS',
    ]

    if (sectionHeaders.some((h) => trimmed === h)) {
      // Save previous section
      if (currentSection && currentSectionContent.length > 0) {
        sections[currentSection] = currentSectionContent
      }
      currentSection = trimmed
      currentSectionContent = []
    } else if (trimmed) {
      currentSectionContent.push(line)
    }
  })

  // Save last section
  if (currentSection && currentSectionContent.length > 0) {
    sections[currentSection] = currentSectionContent
  }

  // Parse sections
  if (sections['PROFESSIONAL SUMMARY']) {
    cv.professional_summary = sections['PROFESSIONAL SUMMARY'].join(' ').trim()
  }

  if (sections['SKILLS'] || sections['KEY SKILLS'] || sections['TECHNICAL SKILLS']) {
    const skillsText = (sections['SKILLS'] || sections['KEY SKILLS'] || sections['TECHNICAL SKILLS'] || []).join('\n')
    const skillsArray = parseSkillsSection(skillsText)
    if (skillsArray && skillsArray.length > 0) {
      cv.skills = skillsArray
    }
  }

  if (sections['PROFESSIONAL EXPERIENCE'] || sections['EXPERIENCE']) {
    const experienceText = (sections['PROFESSIONAL EXPERIENCE'] || sections['EXPERIENCE'] || []).join('\n')
    const experienceArray = parseExperienceSection(experienceText)
    if (experienceArray && experienceArray.length > 0) {
      cv.experience = experienceArray
    }
  }

  if (sections['EDUCATION']) {
    const educationText = sections['EDUCATION'].join('\n')
    const educationArray = parseEducationSection(educationText)
    if (educationArray && educationArray.length > 0) {
      cv.education = educationArray
    }
  }

  if (sections['CERTIFICATIONS']) {
    const certText = sections['CERTIFICATIONS'].join('\n')
    cv.certifications = certText
      .split('\n')
      .map((c) => c.replace(/^[-•]\s*/, '').trim())
      .filter((c) => c.length > 0)
  }

  if (sections['ADDITIONAL'] || sections['AWARDS'] || sections['PUBLICATIONS']) {
    const additionalText = (sections['ADDITIONAL'] || sections['AWARDS'] || sections['PUBLICATIONS'] || []).join('\n')
    cv.additional = additionalText.trim()
  }

  if (header.name || header.email) {
    cv.header = header
  }

  return cv
}

function parseSkillsSection(text: string): StructuredCV['skills'] {
  const skills: StructuredCV['skills'] = []
  const lines = text.split('\n').filter((l) => l.trim())

  lines.forEach((line) => {
    const colonIndex = line.indexOf(':')
    if (colonIndex > -1) {
      const category = line.substring(0, colonIndex).trim()
      const itemsText = line.substring(colonIndex + 1).trim()
      const items = itemsText.split(',').map((i) => i.trim())
      skills.push({ category, items })
    }
  })

  return skills
}

function parseExperienceSection(text: string): Array<{
  title: string
  company: string
  location?: string
  start_date?: string
  end_date?: string
  description?: string
  achievements?: string[]
}> {
  const experience: Array<{
    title: string
    company: string
    location?: string
    start_date?: string
    end_date?: string
    description?: string
    achievements?: string[]
  }> = []
  const jobBlocks = text.split(/(?=^[A-Z])/m).filter((b) => b.trim())

  jobBlocks.forEach((block) => {
    const lines = block.split('\n').filter((l) => l.trim())
    if (lines.length > 0) {
      // Simple heuristic: first line is usually the title
      const title = lines[0].trim()
      const description = lines.slice(1).join(' ').trim()

      const job = {
        title,
        company: '', // Would need more sophisticated parsing
        achievements: description
          .split('\n')
          .filter((a) => a.startsWith('•') || a.startsWith('-'))
          .map((a) => a.replace(/^[-•]\s*/, '').trim()),
      }

      experience.push(job)
    }
  })

  return experience
}

function parseEducationSection(text: string): Array<{
  degree: string
  school?: string
  graduation_date?: string
  gpa?: string
}> {
  const education: Array<{
    degree: string
    school?: string
    graduation_date?: string
    gpa?: string
  }> = []
  const lines = text.split('\n').filter((l) => l.trim())

  let currentEdu: { degree: string; school?: string; graduation_date?: string; gpa?: string } | null = null

  lines.forEach((line) => {
    // Look for degree patterns
    if (line.includes('Bachelor') || line.includes('Master') || line.includes('PhD') || line.includes('Degree')) {
      if (currentEdu) {
        education.push(currentEdu)
      }
      currentEdu = {
        degree: line.trim(),
        school: '',
      }
    } else if (currentEdu && line.includes('Graduated')) {
      const match = line.match(/(\d{4})/)
      if (match) {
        currentEdu.graduation_date = match[1]
      }
    } else if (currentEdu && line.includes('GPA')) {
      const match = line.match(/(\d+\.?\d*)/)
      if (match) {
        currentEdu.gpa = match[1]
      }
    }
  })

  if (currentEdu) {
    education.push(currentEdu)
  }

  return education
}
