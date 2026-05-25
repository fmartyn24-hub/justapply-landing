import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { generateModernHtml } from '@/lib/templates/modernHtml'
import { generateProfessionalHtml } from '@/lib/templates/professionalHtml'
import { generateMinimalistHtml } from '@/lib/templates/minimalistHtml'
import { generateCreativeHtml } from '@/lib/templates/creativeHtml'
import { generateAcademicHtml } from '@/lib/templates/academicHtml'
import { generateExecutiveHtml } from '@/lib/templates/executiveHtml'
import { generateAtsHtml } from '@/lib/templates/atsHtml'
import { convertPlainTextCvToStructured } from '@/lib/exportConverters'

const templateGenerators: { [key: string]: Function } = {
  modern: generateModernHtml,
  professional: generateProfessionalHtml,
  minimalist: generateMinimalistHtml,
  creative: generateCreativeHtml,
  academic: generateAcademicHtml,
  executive: generateExecutiveHtml,
  ats: generateAtsHtml,
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
  const serverSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user }, error: userError } = await serverSupabase.auth.getUser(token)
  if (userError || !user?.id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id, template, type } = req.query
  const templateId = (template as string) || 'modern'
  const documentType = (type as string) || 'cv'

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing application ID' })
  }

  if (!templateGenerators[templateId]) {
    return res.status(400).json({ error: 'Invalid template' })
  }

  try {
    const { data: application, error: fetchError } = await serverSupabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !application) {
      return res.status(404).json({ error: 'Application not found' })
    }

    const { data: profileData } = await serverSupabase
      .from('user_profiles')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single()

    const templateGenerator = templateGenerators[templateId]
    let htmlContent = ''

    if (documentType === 'coverLetter') {
      const clContent = application.generated_cover_letter || ''
      // Parse cover letter into structured format
      const clData = {
        opening: '',
        body_paragraphs: clContent ? [clContent] : [],
        closing: '',
      }
      htmlContent = templateGenerator(null, 'coverLetter', clData)
    } else {
      const cvContent = application.generated_cv || ''
      const structuredCv = convertPlainTextCvToStructured(
        cvContent,
        profileData?.email,
        `${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim()
      )
      htmlContent = templateGenerator(structuredCv, 'cv')
    }

    // Wrap HTML with preview controls
    const previewHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CV Preview</title>
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          .preview-controls {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #2c3e50;
            color: white;
            padding: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          }
          .preview-title { font-size: 16px; font-weight: 600; }
          .preview-buttons { display: flex; gap: 10px; }
          .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            font-size: 14px;
            transition: all 0.3s ease;
          }
          .btn-pdf { background: #e74c3c; color: white; }
          .btn-pdf:hover { background: #c0392b; }
          .btn-docx { background: #3498db; color: white; }
          .btn-docx:hover { background: #2980b9; }
          .btn-close { background: rgba(255,255,255,0.2); color: white; }
          .btn-close:hover { background: rgba(255,255,255,0.3); }
          .preview-content { margin-top: 70px; }
        </style>
      </head>
      <body>
        <div class="preview-controls">
          <div class="preview-title">${documentType === 'coverLetter' ? 'Cover Letter' : 'CV'} Preview - ${templateId.charAt(0).toUpperCase() + templateId.slice(1)}</div>
          <div class="preview-buttons">
            <button class="btn btn-pdf" onclick="downloadPDF()">Download as PDF</button>
            <button class="btn btn-docx" onclick="downloadDOCX()">Download as DOCX</button>
            <button class="btn btn-close" onclick="window.close()">Close</button>
          </div>
        </div>
        <div class="preview-content">
          ${htmlContent}
        </div>
        <script>
          function downloadPDF() {
            const appId = '${id}';
            const template = '${templateId}';
            const docType = '${documentType}';
            const token = localStorage.getItem('auth_token');
            fetch(\`/api/applications/export-pdf?id=\${appId}&template=\${template}&type=\${docType}\`, {
              headers: { 'Authorization': \`Bearer \${token}\` }
            })
            .then(res => res.blob())
            .then(blob => {
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = '${documentType === 'coverLetter' ? 'CoverLetter' : 'CV'}_\${template}.pdf';
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
            })
            .catch(err => alert('Error downloading PDF: ' + err.message));
          }

          function downloadDOCX() {
            const appId = '${id}';
            const template = '${templateId}';
            const docType = '${documentType}';
            const token = localStorage.getItem('auth_token');
            fetch(\`/api/applications/export-docx?id=\${appId}&template=\${template}&type=\${docType}\`, {
              headers: { 'Authorization': \`Bearer \${token}\` }
            })
            .then(res => res.blob())
            .then(blob => {
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = '${documentType === 'coverLetter' ? 'CoverLetter' : 'CV'}_\${template}.docx';
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
            })
            .catch(err => alert('Error downloading DOCX: ' + err.message));
          }
        </script>
      </body>
      </html>
    `

    res.setHeader('Content-Type', 'text/html')
    res.send(previewHtml)
  } catch (error) {
    console.error('Preview error:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' })
  }
}
