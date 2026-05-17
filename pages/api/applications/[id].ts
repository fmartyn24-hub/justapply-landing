import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

interface Application {
  id?: string
  user_id?: string
  job_title: string
  company_name: string
  job_url?: string
  job_description?: string
  generated_cv?: string
  generated_cover_letter?: string
  status: 'draft' | 'applied' | 'saved'
  created_at?: string
  updated_at?: string
}

interface ApiResponse {
  success: boolean
  data?: Application
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
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

  try {
    if (req.method === 'GET') {
      // Get single application
      const { data, error } = await serverSupabase
        .from('applications')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return res.status(200).json({ success: true, data })
    }

    if (req.method === 'PUT') {
      // Update application
      const { job_title, company_name, job_url, job_description, generated_cv, generated_cover_letter, status } = req.body as Partial<Application>

      const { data, error } = await serverSupabase
        .from('applications')
        .update({
          job_title,
          company_name,
          job_url,
          job_description,
          generated_cv,
          generated_cover_letter,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return res.status(200).json({ success: true, data })
    }

    if (req.method === 'DELETE') {
      // Delete application
      const { error } = await serverSupabase
        .from('applications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' })
  } catch (error) {
    console.error('Application detail API error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
