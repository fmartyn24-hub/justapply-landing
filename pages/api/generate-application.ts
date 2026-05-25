import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

interface ApiResponse {
  success: boolean
  cv?: string
  coverLetter?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const token = authHeader.substring(7)
  const serverSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user }, error: userError } = await serverSupabase.auth.getUser(token)
  if (userError || !user?.id) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const { jobDescription, jobTitle, company } = req.body

  if (!jobDescription) {
    return res.status(400).json({ success: false, error: 'Job description is required' })
  }

  try {
    // Fetch user's career components
    const { data: components, error: componentError } = await serverSupabase
      .from('career_components')
      .select('*')
      .eq('user_id', user.id)

    if (componentError) throw componentError

    // Fetch user profile
    const { data: profileData, error: profileError } = await serverSupabase
      .from('user_profiles')
      .select('first_name, last_name, email, phone, address, website, linkedin_url')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError

    // Fetch profile answers/voice
    const { data: profileAnswers } = await serverSupabase
      .from('profile_answers')
      .select('answers')
      .eq('user_id', user.id)
      .single()

    // Format components by type
    const roles = (components || []).filter((c: any) => c.type === 'experience' || c.type === 'role')
    const skills = (components || []).filter((c: any) => c.type === 'tool' || c.type === 'skill')
    const achievements = (components || []).filter((c: any) => c.type === 'campaign' || c.type === 'achievement')
    const projects = (components || []).filter((c: any) => c.type === 'project')
    const voice = (components || []).filter((c: any) => c.type === 'voice')

    // Build context for Claude
    const careerContext = `
## User Profile
Name: ${profileData?.first_name || ''} ${profileData?.last_name || ''}
Email: ${profileData?.email || user.email}
Phone: ${profileData?.phone || ''}
Address: ${profileData?.address || ''}
${profileData?.website ? `Portfolio/Website: ${profileData.website}` : ''}
${profileData?.linkedin_url ? `LinkedIn: ${profileData.linkedin_url}` : ''}

## Career Components

### Roles & Experience
${roles.length > 0 ? roles.map((r: any) => `- ${r.title}${r.organization_name ? ` at ${r.organization_name}` : ''}${r.start_date ? ` (${r.start_date} - ${r.end_date || 'Present'})` : ''}: ${r.description || ''}`).join('\n') : 'No roles provided'}

### Skills & Technologies
${skills.length > 0 ? skills.map((s: any) => `- ${s.title}: ${s.description || ''}`).join('\n') : 'No skills provided'}

### Achievements
${achievements.length > 0 ? achievements.map((a: any) => `- ${a.title}: ${a.description || ''} ${a.impact_metrics ? `(${a.impact_metrics})` : ''}`).join('\n') : 'No achievements provided'}

### Projects
${projects.length > 0 ? projects.map((p: any) => `- ${p.title}: ${p.description || ''} ${p.tags?.length ? `[${p.tags.join(', ')}]` : ''}`).join('\n') : 'No projects provided'}

### Personal Voice & Values
${voice.length > 0 ? voice.map((v: any) => `${v.description || ''}`).join('\n') : 'No voice/values provided'}

${profileAnswers?.answers ? `
### Profile Enrichment Answers
${JSON.stringify(profileAnswers.answers, null, 2)}
` : ''}
`

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    // Generate CV and Cover Letter
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: `You are a world-class career strategist and executive resume writer with 20+ years of experience placing candidates at top-tier companies across tech, media, finance, and creative industries. You combine the analytical rigor of a McKinsey consultant, the storytelling craft of a long-form journalist, and the persuasive instincts of a top recruiter. You have read tens of thousands of CVs and know precisely what makes a hiring manager stop scrolling.

Your task: produce the single best CV and cover letter possible for this specific candidate applying to this specific role. Not a generic CV. Not a lightly-tweaked template. A bespoke application that reads as if it were hand-crafted over several hours by someone who deeply understands both the candidate and the company.

═══════════════════════════════════════════════
INPUTS
═══════════════════════════════════════════════
Job Position: ${jobTitle || 'Position'}
Company: ${company || 'Company'}
Job Description:
${jobDescription}

Candidate's Career Context (achievements, roles, skills, voice, values):
${careerContext}

═══════════════════════════════════════════════
PHASE 1 — STRATEGIC ANALYSIS (do this silently before writing)
═══════════════════════════════════════════════
Before generating a single word of output, work through the following analysis internally. Do not include this analysis in your response — it shapes the writing but is not visible to the reader.

1. **Decode the job description.** Identify:
   - The 3–5 *must-have* competencies (often repeated, or framed as "required")
   - The 2–3 *nice-to-have* signals that separate good candidates from great ones
   - The implicit problems this role exists to solve (what's broken or missing that they're hiring to fix?)
   - The seniority level and the scope of impact expected
   - Cultural and tonal signals from how the JD is written (formal/playful, mission-driven/commercial, etc.)
   - Likely keywords an ATS or human screener will scan for

2. **Inventory the candidate.** From the career context, extract:
   - The 5–8 achievements with the strongest fit to this specific role (prefer quantified, recent, and relevant)
   - Skills and tools that map directly to the JD's requirements
   - Distinctive proof points — things this candidate has done that most applicants cannot claim
   - Career narrative: what story does their trajectory tell, and how does this role fit that arc?
   - The candidate's voice: formal or conversational? British or American English? Dry, warm, witty?
   - Any stated values, working preferences, or principles that should shape tone

3. **Identify the match thesis.** In one sentence (kept internal), articulate: *Why is this candidate uniquely well-suited to this role, beyond surface-level keyword overlap?* This thesis should guide every choice in the CV and cover letter.

4. **Identify and address gaps.** If there are obvious gaps between the JD and the candidate's background, decide how to handle them: lean into adjacent experience, reframe transferable skills, or acknowledge briefly and pivot to strengths. Never lie or invent experience.

═══════════════════════════════════════════════
PHASE 2 — WRITING THE CV
═══════════════════════════════════════════════
**Structure** (adapt order based on what's strongest for this candidate/role):
- Header with name and essential contact details (only include fields present in the career context)
- A 2–4 line professional summary that opens with the candidate's current title/positioning and immediately signals fit for the target role. No clichés ("results-driven," "passionate professional," "team player"). Lead with specifics.
- Core competencies / skills section, ordered by relevance to the JD, using terminology the JD itself uses where the candidate genuinely has the skill
- Professional experience, reverse chronological, with emphasis (more bullets, more detail) on roles most relevant to the target
- Education, certifications, notable projects, or other sections only if they add signal

**Bullet point craft — this is where most CVs fail. Apply these rules:**
- Lead with a strong action verb (varied — not five "Led"s in a row)
- Structure: *what you did → how you did it → measurable outcome or impact*
- Quantify wherever the career context supports it (%, $, time saved, scale, headcount, audience size). Never invent numbers.
- Cut filler: "responsible for," "duties included," "worked on," "helped with"
- Each bullet should pass the "so what?" test — if removing it wouldn't weaken the application, remove it
- Front-load the most impressive bullet of each role
- Mirror JD language where authentic (if they say "stakeholder engagement," and the candidate genuinely did that, use those words — not a synonym)
- Length: typically 3–6 bullets per recent/relevant role; 1–3 for older or less relevant roles

**Tailoring discipline:**
- Every section, every bullet, every word choice should be informed by the JD. If a bullet doesn't earn its place for *this* application, cut or replace it.
- De-emphasize (don't necessarily delete) experience that's irrelevant to the target role
- Re-order skills, achievements, and even role descriptions to surface the most relevant material first

**Format and tone:**
- Plain text, clean and scannable. Use simple section headers in caps or with line breaks — no markdown symbols like \`#\` or \`**\` that look ugly in plain text.
- Match the candidate's voice and language variant (UK/US English) as evidenced in the career context
- Length: 1 page for <8 years experience, 2 pages for senior/executive. Never pad.

═══════════════════════════════════════════════
PHASE 3 — WRITING THE COVER LETTER
═══════════════════════════════════════════════
A cover letter is not a prose version of the CV. It is a focused argument for why this candidate is the right hire — written in their voice, addressed to a human.

**Structure:**
- Opening (1 short paragraph): a specific, earned hook. Not "I am writing to apply for..." Lead with a concrete reason this role and this company genuinely interest the candidate, or with a sharp framing of what they bring. Reference something specific about the company or role that signals real research, not flattery.
- Body (2–3 paragraphs): the match thesis in action. Pick 2–3 of the strongest accomplishments from the career context and connect each explicitly to a need expressed in the JD. Tell mini-stories with stakes and outcomes, not bullet point summaries. Show how the candidate thinks, not just what they've done.
- Optional short paragraph: address any obvious gap or unusual aspect of the candidate's profile with confidence, framing it as a strength or an interesting angle rather than apologizing.
- Close (1 short paragraph): forward-looking, specific to what they could contribute, warm but not saccharine. No "I look forward to hearing from you" — close with something with more energy and specificity.

**Voice and tone:**
- Write in the candidate's voice as inferred from their career context. If they're British, write British. If they're dry and direct, be dry and direct. If they're warm and narrative, be that.
- Professional but human. Confident but not arrogant. Specific over generic, always.
- Avoid every cover-letter cliché: "I am excited to apply," "I believe I would be a great fit," "synergy," "dynamic team player," "wear many hats," "hit the ground running," "passionate about."
- No bullet points in the cover letter unless there's a compelling structural reason — it should read as considered prose.
- Length: 250–400 words. Tight, every sentence earning its place.

**Personalization signals:**
- Reference the company by name in a way that demonstrates real understanding of what they do, what they're building, or what they care about — drawn from the JD itself
- Where possible, name the specific role and connect to its specific challenges
- Reflect any stated values from the candidate's career context (e.g., if they prize honesty, write honestly; if they value craft, demonstrate craft)

═══════════════════════════════════════════════
QUALITY BAR — BEFORE YOU OUTPUT
═══════════════════════════════════════════════
Privately check your draft against these:
- Could this CV and cover letter have been written for any other job? If yes, tailor harder.
- Is there a single sentence that is generic, vague, or could be deleted without loss? Fix or remove.
- Does the CV's first 1/3 of the page make a compelling case on its own? (Recruiters often scan no further.)
- Does the cover letter's opening sentence make the reader want to read the second? If not, rewrite.
- Have you invented any facts, numbers, employers, dates, or credentials not present in the career context? If yes, remove immediately. Fabrication is disqualifying.
- Does the voice sound like the candidate or like generic AI prose? If the latter, rewrite in their voice.
- Is the language variant (UK/US English, spelling, vocabulary) consistent and correct?

═══════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════
Respond with valid JSON only — no preamble, no commentary, no markdown code fences, no trailing text. The JSON must have this structure:

{
  "cv": {
    "header": {
      "name": "Full Name",
      "email": "email@example.com",
      "phone": "phone number",
      "location": "city, state",
      "portfolio_url": "url or null",
      "linkedin_url": "url or null"
    },
    "professional_summary": "2-4 sentence summary",
    "skills": [
      {"category": "Category Name", "items": ["skill1", "skill2", "skill3"]}
    ],
    "experience": [
      {
        "title": "Job Title",
        "company": "Company Name",
        "location": "City, State",
        "start_date": "YYYY-MM or similar",
        "end_date": "YYYY-MM or 'Present'",
        "description": "Brief role description",
        "achievements": [
          "Achievement bullet point 1",
          "Achievement bullet point 2"
        ]
      }
    ],
    "education": [
      {
        "degree": "Bachelor of Science",
        "school": "University Name",
        "graduation_date": "YYYY",
        "gpa": "3.8 or null if not strong"
      }
    ],
    "certifications": ["Cert 1", "Cert 2"],
    "additional": "Any additional sections like languages, awards, publications"
  },
  "coverLetter": {
    "opening": "Engaging opening paragraph",
    "body_paragraphs": ["Paragraph 1", "Paragraph 2", "Paragraph 3"],
    "closing": "Professional closing paragraph"
  }
}

All text fields must be plain text with newlines escaped as \\n where needed. Include only non-null fields. Ensure all JSON is valid and properly escaped.`,
        },
      ],
    })

    // Parse the response
    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    let cv = ''
    let coverLetter = ''

    try {
      // Strip markdown code block wrapper if present
      let jsonText = content.text.trim()
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7) // Remove ```json
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3) // Remove ```
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3) // Remove trailing ```
      }

      const parsed = JSON.parse(jsonText.trim())

      // Handle both structured and plain text responses for backward compatibility
      if (typeof parsed.cv === 'object' && parsed.cv !== null) {
        // Structured CV format — convert to plain text
        cv = convertStructuredCVToPlainText(parsed.cv)
      } else if (typeof parsed.cv === 'string') {
        // Plain text CV (backward compatibility)
        cv = parsed.cv
      } else {
        throw new Error('CV is missing or invalid')
      }

      if (typeof parsed.coverLetter === 'object' && parsed.coverLetter !== null) {
        // Structured cover letter format — convert to plain text
        coverLetter = convertStructuredCoverLetterToPlainText(parsed.coverLetter)
      } else if (typeof parsed.coverLetter === 'string') {
        // Plain text cover letter (backward compatibility)
        coverLetter = parsed.coverLetter
      } else {
        throw new Error('Cover letter is missing or invalid')
      }
    } catch {
      throw new Error('Failed to parse JSON response from Claude. Response was: ' + content.text.substring(0, 200))
    }

    if (!cv || !coverLetter) {
      throw new Error('CV or cover letter is empty in the response')
    }

    return res.status(200).json({
      success: true,
      cv,
      coverLetter,
    })
  } catch (error) {
    console.error('Generate application error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate application',
    })
  }
}

// Helper function to convert structured CV to plain text
function convertStructuredCVToPlainText(cvData: any): string {
  const lines: string[] = []

  // Header
  if (cvData.header) {
    const { name, email, phone, location, portfolio_url, linkedin_url } = cvData.header
    if (name) lines.push(name)
    const contactParts = []
    if (email) contactParts.push(email)
    if (phone) contactParts.push(phone)
    if (location) contactParts.push(location)
    if (portfolio_url) contactParts.push(portfolio_url)
    if (linkedin_url) contactParts.push(linkedin_url)
    if (contactParts.length > 0) lines.push(contactParts.join(' | '))
    lines.push('')
  }

  // Professional Summary
  if (cvData.professional_summary) {
    lines.push('PROFESSIONAL SUMMARY')
    lines.push(cvData.professional_summary)
    lines.push('')
  }

  // Skills
  if (cvData.skills && Array.isArray(cvData.skills)) {
    lines.push('SKILLS')
    cvData.skills.forEach((skillGroup: any) => {
      if (skillGroup.category && skillGroup.items) {
        lines.push(`${skillGroup.category}: ${skillGroup.items.join(', ')}`)
      }
    })
    lines.push('')
  }

  // Experience
  if (cvData.experience && Array.isArray(cvData.experience)) {
    lines.push('PROFESSIONAL EXPERIENCE')
    cvData.experience.forEach((job: any) => {
      lines.push(`${job.title} at ${job.company}${job.location ? ` (${job.location})` : ''}`)
      if (job.start_date || job.end_date) {
        lines.push(`${job.start_date || ''} ${job.end_date || 'Present'}`)
      }
      if (job.description) lines.push(job.description)
      if (job.achievements && Array.isArray(job.achievements)) {
        job.achievements.forEach((achievement: string) => {
          lines.push(`• ${achievement}`)
        })
      }
      lines.push('')
    })
  }

  // Education
  if (cvData.education && Array.isArray(cvData.education)) {
    lines.push('EDUCATION')
    cvData.education.forEach((edu: any) => {
      lines.push(`${edu.degree}${edu.school ? ` from ${edu.school}` : ''}`)
      if (edu.graduation_date) lines.push(`Graduated: ${edu.graduation_date}`)
      if (edu.gpa) lines.push(`GPA: ${edu.gpa}`)
      lines.push('')
    })
  }

  // Certifications
  if (cvData.certifications && Array.isArray(cvData.certifications) && cvData.certifications.length > 0) {
    lines.push('CERTIFICATIONS')
    cvData.certifications.forEach((cert: string) => {
      lines.push(`• ${cert}`)
    })
    lines.push('')
  }

  // Additional
  if (cvData.additional) {
    lines.push('ADDITIONAL')
    lines.push(cvData.additional)
  }

  return lines.join('\n').trim()
}

// Helper function to convert structured cover letter to plain text
function convertStructuredCoverLetterToPlainText(clData: any): string {
  const lines: string[] = []

  if (clData.opening) {
    lines.push(clData.opening)
    lines.push('')
  }

  if (clData.body_paragraphs && Array.isArray(clData.body_paragraphs)) {
    clData.body_paragraphs.forEach((paragraph: string) => {
      lines.push(paragraph)
      lines.push('')
    })
  }

  if (clData.closing) {
    lines.push(clData.closing)
  }

  return lines.join('\n').trim()
}
