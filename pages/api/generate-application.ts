import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { generateCoverLetterAndAdvice } from '@/lib/generateCoverLetterAndAdvice'

interface ApiResponse {
  success: boolean
  coverLetter?: string
  cvAdvice?: string
  coverLetterStructured?: any
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

  const { jobDescription, jobTitle, company, selectedComponentIds } = req.body

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
      selectedComponentIds
    )

    return res.status(200).json({
      success: true,
      coverLetter: result.coverLetter,
      cvAdvice: result.cvAdvice,
      coverLetterStructured: result.coverLetterStructured,
    })
  } catch (error) {
    console.error('Generate application error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate application',
    })
  }
}
