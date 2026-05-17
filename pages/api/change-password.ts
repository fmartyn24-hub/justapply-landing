import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

interface ChangePasswordRequest {
  email: string
  currentPassword: string
  newPassword: string
}

interface ChangePasswordResponse {
  success: boolean
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChangePasswordResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    // Get auth token from headers
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const token = authHeader.substring(7)

    // Verify token with Supabase
    const serverSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { user }, error: userError } = await serverSupabase.auth.getUser(token)

    if (userError || !user?.id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { email, newPassword } = req.body as ChangePasswordRequest

    // Verify the email matches
    if (user.email !== email) {
      return res.status(403).json({ success: false, error: 'Email mismatch' })
    }

    // Update password using Supabase admin API
    const { error: updateError } = await serverSupabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    })

    if (updateError) {
      console.error('Password update error:', updateError)
      return res.status(400).json({ success: false, error: updateError.message || 'Failed to update password' })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Change password handler error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
