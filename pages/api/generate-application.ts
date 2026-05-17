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
      .select('first_name, last_name, email, phone, address')
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

## Career Components

### Roles & Experience
${roles.length > 0 ? roles.map((r: any) => `- ${r.title}${r.start_date ? ` (${r.start_date} - ${r.end_date || 'Present'})` : ''}: ${r.description || ''}`).join('\n') : 'No roles provided'}

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
      model: 'claude-opus-4-20250805',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `You are an expert career advisor and resume writer. Generate a tailored CV and cover letter for the following job opportunity.

Job Position: ${jobTitle || 'Position'}
Company: ${company || 'Company'}
Job Description:
${jobDescription}

User's Career Context:
${careerContext}

Please generate BOTH a CV and a cover letter. Format your response as follows:

---CV---
[Complete CV tailored to the job description. Highlight relevant experience, skills, and achievements. Keep it concise and focused on what matters for this role.]

---COVER_LETTER---
[A compelling cover letter that explains why this person is perfect for this role. Reference specific accomplishments and match them to job requirements. Keep the tone professional but warm and personal. Use the user's voice and values from the profile.]

Both documents should be tailored to match the job requirements and highlight the most relevant experience. Use the user's background to create compelling narratives.`,
        },
      ],
    })

    // Parse the response
    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    const text = content.text
    const cvMatch = text.match(/---CV---([\s\S]*?)---COVER_LETTER---/)
    const coverLetterMatch = text.match(/---COVER_LETTER---([\s\S]*)$/)

    const cv = cvMatch ? cvMatch[1].trim() : ''
    const coverLetter = coverLetterMatch ? coverLetterMatch[1].trim() : ''

    if (!cv || !coverLetter) {
      throw new Error('Failed to parse CV and cover letter from Claude response')
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
