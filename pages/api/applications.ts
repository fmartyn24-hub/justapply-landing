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
  data?: Application | Application[]
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

  try {
    if (req.method === 'GET') {
      // Get all applications for user
      const { data, error } = await serverSupabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return res.status(200).json({ success: true, data: data || [] })
    }

    if (req.method === 'POST') {
      // Create new application
      const { job_title, company_name, job_url, job_description, generated_cv, generated_cover_letter, status } = req.body as Application

      const { data, error } = await serverSupabase
        .from('applications')
        .insert({
          user_id: user.id,
          job_title,
          company_name,
          job_url: job_url || null,
          job_description: job_description || null,
          generated_cv: generated_cv || null,
          generated_cover_letter: generated_cover_letter || null,
          status: status || 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return res.status(201).json({ success: true, data })
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' })
  } catch (error) {
    console.error('Applications API error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
