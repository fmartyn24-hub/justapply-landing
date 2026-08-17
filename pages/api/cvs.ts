import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

interface CvSummary {
  id: string
  filename: string
  file_size_bytes: number
  created_at: string
}

interface ApiResponse {
  success: boolean
  data?: CvSummary[]
  error?: string
}

// Lists the current user's uploaded CVs (metadata only, not extracted_text)
// for the "which CV should this use?" picker, and the CV management list.
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

  if (req.method === 'GET') {
    const { data, error } = await serverSupabase
      .from('cvs')
      .select('id, filename, file_size_bytes, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ success: false, error: error.message })
    }

    return res.status(200).json({ success: true, data: data as CvSummary[] })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing or invalid CV ID' })
    }

    const { data: cv } = await serverSupabase
      .from('cvs')
      .select('storage_path')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!cv) {
      return res.status(404).json({ success: false, error: 'CV not found' })
    }

    const { error: deleteError } = await serverSupabase
      .from('cvs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      return res.status(500).json({ success: false, error: deleteError.message })
    }

    if (cv.storage_path) {
      await serverSupabase.storage.from('cvs').remove([cv.storage_path])
    }

    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
