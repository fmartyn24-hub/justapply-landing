import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { buildCoverLetterData, buildStructuredCv } from '@/lib/previewHtml'
import { coverLetterToLines } from '@/lib/coverLetterPlainText'
import { generateOdt } from '@/lib/odtGenerator'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.substring(7)

  let userId: string | null = null
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const serverSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data: { user }, error: userError } = await serverSupabase.auth.getUser(token)
    if (userError || !user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    userId = user.id
  } else {
    try {
      const parts = token.split('.')
      const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      userId = decoded.sub
      if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    } catch {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid application ID' })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !application) {
      return res.status(404).json({ error: 'Application not found' })
    }

    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, email, phone')
      .eq('id', userId)
      .maybeSingle()

    const structuredCv = buildStructuredCv(application, profileData)
    const clData = buildCoverLetterData(application, {
      ...structuredCv?.header,
      phone: structuredCv?.header?.phone || profileData?.phone,
    })
    const lines = coverLetterToLines(clData)
    const buffer = await generateOdt(lines)

    const filename = `${application.company_name}_${application.job_title}_CoverLetter.odt`
      .replace(/[^a-zA-Z0-9-_ ]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 200)

    res.setHeader('Content-Type', 'application/vnd.oasis.opendocument.text')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', buffer.length)
    res.send(buffer)
  } catch (error) {
    console.error('ODT export error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' })
  }
}
