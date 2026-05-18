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
  deadline?: string
  persons_of_interest?: string
  status: 'draft' | 'applied'
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
      const { job_title, company_name, job_url, job_description, generated_cv, generated_cover_letter, deadline, persons_of_interest, status } = req.body as Partial<Application>

      const updateData: any = {
        updated_at: new Date().toISOString(),
      }

      // Only include fields that are provided
      if (job_title !== undefined) updateData.job_title = job_title
      if (company_name !== undefined) updateData.company_name = company_name
      if (job_url !== undefined) updateData.job_url = job_url
      if (job_description !== undefined) updateData.job_description = job_description
      if (generated_cv !== undefined) updateData.generated_cv = generated_cv
      if (generated_cover_letter !== undefined) updateData.generated_cover_letter = generated_cover_letter
      if (deadline !== undefined) updateData.deadline = deadline
      if (persons_of_interest !== undefined) updateData.persons_of_interest = persons_of_interest
      if (status !== undefined) updateData.status = status

      const { data, error } = await serverSupabase
        .from('applications')
        .update(updateData)
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
