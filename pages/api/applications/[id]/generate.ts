import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { generateCoverLetterAndAdvice } from '@/lib/generateCoverLetterAndAdvice'
import type { CoverLetterTone, CoverLetterLength } from '@/lib/coverLetterOptions'

interface ApiResponse {
  success: boolean
  data?: any
  error?: string
}

// On-demand generation for an EXISTING application — used by the "Generate
// Cover Letter" / "Generate CV Advice" buttons on applications that were
// created manually (via "+ Add application") rather than through Just Apply,
// so they start with no AI-generated content. Uses the application's own
// job_title/company_name/job_description, so those must be filled in first.
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

  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing or invalid application ID' })
  }

  try {
    const { data: application, error: fetchError } = await serverSupabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !application) {
      return res.status(404).json({ success: false, error: 'Application not found' })
    }

    if (!application.job_description) {
      return res.status(400).json({
        success: false,
        error: 'Add a job description in Details before generating a cover letter or CV advice.',
      })
    }

    const { cvId, selectedComponentIds, tone, length } = (req.body || {}) as {
      cvId?: string
      selectedComponentIds?: string[]
      tone?: string
      length?: string
    }

    const result = await generateCoverLetterAndAdvice(
      serverSupabase,
      user.id,
      user.email,
      application.job_description,
      application.job_title,
      application.company_name,
      selectedComponentIds,
      cvId ?? application.cv_id,
      { tone: tone as CoverLetterTone | undefined, length: length as CoverLetterLength | undefined },
      id
    )

    const { data: updated, error: updateError } = await serverSupabase
      .from('applications')
      .update({
        generated_cover_letter: result.coverLetter,
        generated_cover_letter_json: result.coverLetterStructured,
        cv_advice: result.cvAdvice,
        cv_advice_json: result.cvAdviceStructured,
        cv_id: cvId ?? application.cv_id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) throw updateError

    return res.status(200).json({ success: true, data: updated })
  } catch (error) {
    console.error('On-demand generation error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate',
    })
  }
}
