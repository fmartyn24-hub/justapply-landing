import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { generateDocxBuffer } from '@/lib/exportHelpers'
import { EXPORT_TEMPLATES } from '@/lib/exportTemplates'
import { generateModernDocx } from '@/lib/templates/modernDocx'
import { generateProfessionalDocx } from '@/lib/templates/professional'
import { generateAtsDocx } from '@/lib/templates/ats'
import { convertPlainTextCvToStructured } from '@/lib/exportConverters'

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
  const serverSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: { user }, error: userError } = await serverSupabase.auth.getUser(token)
  if (userError || !user?.id) {
    return res.status(401).json({ error: 'Unauthorized' })
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
    // Fetch application from Supabase
    const { data: application, error: fetchError } = await serverSupabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !application) {
      return res.status(404).json({ error: 'Application not found' })
    }

    // Get content based on document type
    const cvContent = documentType === 'cv' ? application.generated_cv || '' : ''
    const clContent = documentType === 'coverLetter' ? application.generated_cover_letter || '' : ''

    // Convert plain text to structured format for new templates
    const { data: profileData } = await serverSupabase
      .from('user_profiles')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single()

    let buffer: Buffer

    // Use new template generators for Modern and Professional templates
    if (documentType === 'cv') {
      const structuredCv = convertPlainTextCvToStructured(
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
      // Cover letter export - use simple text-based templates
      const clData = {
        opening: clContent.split('\n\n')[0] || '',
        body_paragraphs: clContent.split('\n\n').slice(1, -1) || [],
        closing: clContent.split('\n\n').slice(-1)[0] || '',
      }

      if (exportTemplate.id === 'modern') {
        buffer = await generateModernDocx({}, 'coverLetter', clData)
      } else if (exportTemplate.id === 'professional') {
        buffer = await generateProfessionalDocx({}, 'coverLetter', clData)
      } else if (exportTemplate.id === 'ats') {
        buffer = await generateAtsDocx({}, 'coverLetter', clData)
      } else {
        // Fallback
        buffer = await generateDocxBuffer(
          clContent,
          application.job_title || 'Application',
          application.company_name || 'Company',
          exportTemplate,
          documentType
        )
      }
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
