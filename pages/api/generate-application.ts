import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAiUser } from '@/lib/aiAccess'
import { generateCoverLetterAndAdvice } from '@/lib/generateCoverLetterAndAdvice'

interface ApiResponse {
  success: boolean
  coverLetter?: string
  cvAdvice?: string
  coverLetterStructured?: any
  cvAdviceStructured?: any
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const ctx = await requireAiUser(req, res)
  if (!ctx) return
  const { user, serverSupabase } = ctx

  const { jobDescription, jobTitle, company, selectedComponentIds, cvId, tone, length } = req.body

  if (!jobDescription) {
    return res.status(400).json({ success: false, error: 'Job description is required' })
  }

  try {
    const result = await generateCoverLetterAndAdvice(
      serverSupabase,
      user.id,
      user.email,
      jobDescription,
      jobTitle,
      company,
      selectedComponentIds,
      cvId,
      { tone, length }
    )

    return res.status(200).json({
      success: true,
      coverLetter: result.coverLetter,
      cvAdvice: result.cvAdvice,
      coverLetterStructured: result.coverLetterStructured,
      cvAdviceStructured: result.cvAdviceStructured,
    })
  } catch (error) {
    console.error('Generate application error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate application',
    })
  }
}
