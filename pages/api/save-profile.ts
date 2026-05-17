import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

interface ProfileRequest {
  firstName: string
  lastName: string
  phone?: string
  address?: string
}

interface ProfileResponse {
  success: boolean
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProfileResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
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

    const { firstName, lastName, phone, address } = req.body as ProfileRequest

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'First name and last name are required',
      })
    }

    // Upsert user_profiles (update if exists, insert if not)
    const { error: upsertError } = await serverSupabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        email: user.email,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        address: address || null,
        updated_at: new Date().toISOString(),
      })

    if (upsertError) {
      console.error('Profile upsert error:', upsertError)
      return res.status(500).json({
        success: false,
        error: 'Failed to save profile: ' + upsertError.message,
      })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Save profile error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
