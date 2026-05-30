import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { buildPreviewHtml } from '@/lib/previewHtml'
import { renderHtmlToPdf } from '@/lib/htmlToPdf'

interface ErrorResponse {
  error: string
}

// Headless Chrome + a one-time ~66MB Chromium download on cold start can exceed
// the default serverless timeout, so give this route extra headroom.
export const config = {
  maxDuration: 60,
}

// Server-side PDF export that renders the EXACT preview HTML with headless
// Chrome. Unlike the pdfkit-based `/api/applications/export-pdf`, this produces
// a true one-click download that pixel-matches the on-screen design for ALL
// templates (colors, gradients, multi-column layouts) with native pagination.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.substring(7)

  // Resolve the user id from the token (service role if available, else decode JWT)
  let userId: string | null = null
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const serverSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const { data: { user }, error: userError } = await serverSupabase.auth.getUser(token)
    if (userError || !user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    userId = user.id
  } else {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        return res.status(401).json({ error: 'Invalid token format' })
      }
      const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      userId = decoded.sub
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  const { id, template, type } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid application ID' })
  }

  const templateId = (template as string) || 'professional'
  const documentType = ((type as string) || 'cv') as 'cv' | 'coverLetter'
  if (!['cv', 'coverLetter'].includes(documentType)) {
    return res.status(400).json({ error: 'Invalid document type' })
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

    // Profile only used as a fallback header source for legacy plain-text records.
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, email')
      .eq('id', userId)
      .maybeSingle()

    const html = buildPreviewHtml(application, profileData, templateId, documentType)
    const buffer = await renderHtmlToPdf(html)

    const typeLabel = documentType === 'cv' ? 'CV' : 'CoverLetter'
    const templateLabel = templateId === 'professional' ? '' : `_${templateId}`
    const filename = `${application.company_name}_${application.job_title}_${typeLabel}${templateLabel}.pdf`
      .replace(/[^a-zA-Z0-9-_ ]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 200)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', buffer.length)
    res.send(buffer)
  } catch (error) {
    console.error('HTML→PDF export error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' })
  }
}
