import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { generateDocxBuffer } from '@/lib/exportHelpers'
import { EXPORT_TEMPLATES } from '@/lib/exportTemplates'
import { generateModernDocx } from '@/lib/templates/modernDocx'
import { generateProfessionalDocx } from '@/lib/templates/professional'
import { generateAtsDocx } from '@/lib/templates/ats'
import { generateCoverLetterDocx } from '@/lib/templates/coverLetterDocx'
import { convertPlainTextCvToStructured } from '@/lib/exportConverters'
import { buildCoverLetterData } from '@/lib/previewHtml'

interface ErrorResponse {
  error: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.substring(7)

  // Try to get user from token
  let userId: string | null = null

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const serverSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data: { user }, error: userError } = await serverSupabase.auth.getUser(token)
    if (userError || !user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    userId = user.id
  } else {
    // Fallback: parse JWT token to get user ID
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

  // Get template (default to professional)
  const templateId = (template as string) || 'professional'
  const exportTemplate = EXPORT_TEMPLATES.find((t) => t.id === templateId)
  if (!exportTemplate) {
    return res.status(400).json({ error: 'Invalid template' })
  }

  // Get document type (default to cv)
  const documentType = ((type as string) || 'cv') as 'cv' | 'coverLetter'
  if (!['cv', 'coverLetter'].includes(documentType)) {
    return res.status(400).json({ error: 'Invalid document type' })
  }

  try {
    // Create Supabase client for data access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    // Fetch application from Supabase
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !application) {
      return res.status(404).json({ error: 'Application not found' })
    }

    // Get content based on document type
    const cvContent = documentType === 'cv' ? application.generated_cv || '' : ''
    const clContent = documentType === 'coverLetter' ? application.generated_cover_letter || '' : ''

    // Profile (used only as a fallback header source for legacy records).
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, email')
      .eq('id', userId)
      .maybeSingle()

    let buffer: Buffer

    // Use new template generators for Modern and Professional templates
    if (documentType === 'cv') {
      // Prefer the structured CV stored at generation time; only fall back to
      // the lossy plain-text reparser for legacy records without JSON.
      const structuredCv =
        application.generated_cv_json && typeof application.generated_cv_json === 'object'
          ? application.generated_cv_json
          : convertPlainTextCvToStructured(
              cvContent,
              profileData?.email,
              `${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim()
            )

      if (exportTemplate.id === 'modern') {
        buffer = await generateModernDocx(structuredCv, 'cv')
      } else if (exportTemplate.id === 'professional') {
        buffer = await generateProfessionalDocx(structuredCv, 'cv')
      } else if (exportTemplate.id === 'ats') {
        buffer = await generateAtsDocx(structuredCv, 'cv')
      } else {
        // Fallback to generic formatter for unknown templates
        buffer = await generateDocxBuffer(
          cvContent,
          application.job_title || 'Application',
          application.company_name || 'Company',
          exportTemplate,
          documentType
        )
      }
    } else {
      // Cover letter export — render through the single shared builder so all
      // templates get a branded letterhead, date, "Re:" line and signature that
      // match the paired CV. buildCoverLetterData applies the same data handling
      // as the HTML/PDF path: prefers structured JSON, falls back to splitting
      // plain text, strips a duplicate trailing valediction, and trims the title.
      const structuredCv =
        application.generated_cv_json && typeof application.generated_cv_json === 'object'
          ? application.generated_cv_json
          : convertPlainTextCvToStructured(
              application.generated_cv || '',
              profileData?.email,
              `${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim()
            )

      const clData = buildCoverLetterData(application, structuredCv?.header)
      buffer = await generateCoverLetterDocx(clData, exportTemplate)
    }

    // Generate safe filename
    const typeLabel = documentType === 'cv' ? 'CV' : 'CoverLetter'
    const templateLabel = exportTemplate.id === 'professional' ? '' : `_${exportTemplate.id}`
    const filename = `${application.company_name}_${application.job_title}_${typeLabel}${templateLabel}.docx`
      .replace(/[^a-zA-Z0-9-_ ]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 200)

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', buffer.length)

    // Send buffer
    res.send(buffer)
  } catch (error) {
    console.error('DOCX export error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' })
  }
}
