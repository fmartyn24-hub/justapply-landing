import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

interface GenerationRequest {
  jobDescription: string
  cvId: string
}

interface GenerationResponse {
  success: boolean
  coverLetter?: string
  tailoredExperience?: string
  matchedSkills?: string[]
  error?: string
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerationResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    // Get auth token
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const token = authHeader.substring(7)

    // Create service role client
    const serverSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify user
    const { data: { user }, error: userError } = await serverSupabase.auth.getUser(token)
    if (userError || !user?.id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { jobDescription, cvId } = req.body as GenerationRequest

    if (!jobDescription || !cvId) {
      return res.status(400).json({
        success: false,
        error: 'Job description and CV ID are required',
      })
    }

    // Fetch CV from database
    const { data: cvRecord, error: cvError } = await serverSupabase
      .from('cvs')
      .select('extracted_text')
      .eq('id', cvId)
      .eq('user_id', user.id)
      .single()

    if (cvError || !cvRecord) {
      return res.status(404).json({
        success: false,
        error: 'CV not found',
      })
    }

    const cvText = cvRecord.extracted_text

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are an expert career advisor. Your job is to help create tailored job application materials.

Given a candidate's CV and a job description, generate:
1. A compelling cover letter (2-3 paragraphs) that connects their experience to the role
2. A list of the most relevant skills from their CV that match the job

Be specific, use concrete examples from their CV, and explain why they're a great fit.

---

CANDIDATE'S CV:
${cvText}

---

JOB DESCRIPTION:
${jobDescription}

---

Please provide your response in the following JSON format (and ONLY this format, no markdown):
{
  "coverLetter": "...",
  "matchedSkills": ["skill1", "skill2", "skill3"],
  "tailoredExperience": "A brief paragraph highlighting the most relevant experience"
}`,
        },
      ],
    })

    // Extract text from response
    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse JSON response
    let result
    try {
      result = JSON.parse(responseText)
    } catch (parseError) {
      console.error('JSON parse error:', responseText)
      return res.status(500).json({
        success: false,
        error: 'Failed to parse generation response',
      })
    }

    return res.status(200).json({
      success: true,
      coverLetter: result.coverLetter,
      matchedSkills: result.matchedSkills,
      tailoredExperience: result.tailoredExperience,
    })
  } catch (error) {
    console.error('Generation error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
