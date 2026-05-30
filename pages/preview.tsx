import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { convertPlainTextCvToStructured } from '@/lib/exportConverters'
import { generateModernHtml } from '@/lib/templates/modernHtml'
import { generateProfessionalHtml } from '@/lib/templates/professionalHtml'
import { generateMinimalistHtml } from '@/lib/templates/minimalistHtml'
import { generateCreativeHtml } from '@/lib/templates/creativeHtml'
import { generateAcademicHtml } from '@/lib/templates/academicHtml'
import { generateExecutiveHtml } from '@/lib/templates/executiveHtml'
import { generateAtsHtml } from '@/lib/templates/atsHtml'

const templateGenerators: { [key: string]: Function } = {
  modern: generateModernHtml,
  professional: generateProfessionalHtml,
  minimalist: generateMinimalistHtml,
  creative: generateCreativeHtml,
  academic: generateAcademicHtml,
  executive: generateExecutiveHtml,
  ats: generateAtsHtml,
}

export default function PreviewPage() {
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<any>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    async function loadPreview() {
      try {
        // Get preview data from sessionStorage
        const data = sessionStorage.getItem('previewData')
        if (!data) {
          setError('Preview data not found')
          return
        }

        const { applicationId, template, documentType, accessToken } = JSON.parse(data)
        setPreviewData({ applicationId, template, documentType, accessToken })

        // Initialize Supabase client
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session?.user?.id) {
          setError('Not authenticated. Please log in again.')
          return
        }

        // Fetch the application
        const { data: application, error: fetchError } = await supabase
          .from('applications')
          .select('*')
          .eq('id', applicationId)
          .eq('user_id', session.user.id)
          .single()

        if (fetchError || !application) {
          setError('Application not found')
          return
        }

        // Fetch user profile
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('first_name, last_name, email')
          .eq('id', session.user.id)
          .single()

        // Generate HTML based on document type
        const templateGenerator = templateGenerators[template]
        let html = ''

        if (documentType === 'coverLetter') {
          const clContent = application.generated_cover_letter || ''
          const clData = {
            opening: '',
            body_paragraphs: clContent ? [clContent] : [],
            closing: '',
          }
          html = templateGenerator(null, 'coverLetter', clData)
        } else {
          const cvContent = application.generated_cv || ''
          const structuredCv = convertPlainTextCvToStructured(
            cvContent,
            profileData?.email,
            `${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim()
          )
          html = templateGenerator(structuredCv, 'cv')
        }

        setHtmlContent(html)
        setLoading(false)
      } catch (err) {
        console.error('Error loading preview:', err)
        setError(err instanceof Error ? err.message : 'Failed to load preview')
        setLoading(false)
      }
    }

    loadPreview()
  }, [])

  async function downloadFile(format: 'pdf' | 'docx') {
    if (!previewData) return

    setDownloading(true)
    try {
      const { applicationId, template, documentType, accessToken } = previewData
      const fileName = `${documentType === 'coverLetter' ? 'CoverLetter' : 'CV'}_${template}`

      if (format === 'pdf') {
        // Client-side PDF generation using html2canvas + jsPDF
        console.log('Starting client-side PDF generation...')
        const html2canvas = (await import('html2canvas')).default
        const jsPDF = (await import('jspdf')).jsPDF

        // Find the actual CV content
        const previewContent = document.querySelector('.preview-content')
        if (!previewContent) throw new Error('Preview content not found')

        console.log('Rendering to canvas...')

        // A4 dimensions
        const a4WidthMm = 210
        const mmToPx = 3.78
        const targetWidthPx = a4WidthMm * mmToPx

        // Save original width
        const previewElement = previewContent as HTMLElement
        const originalWidth = previewElement.style.width

        // Set width to A4 for accurate rendering
        previewElement.style.width = `${targetWidthPx}px`

        const canvas = await html2canvas(previewElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowHeight: previewElement.scrollHeight,
          width: targetWidthPx,
        })

        // Restore original width
        if (originalWidth) {
          previewElement.style.width = originalWidth
        } else {
          previewElement.style.width = ''
        }

        // Create PDF
        console.log('Creating PDF...')
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        })

        const pageWidthMm = pdf.internal.pageSize.getWidth() // 210mm
        const pageHeightMm = pdf.internal.pageSize.getHeight() // 297mm

        // Calculate how many pixels per mm in the canvas
        const pxPerMmWidth = canvas.width / targetWidthPx // should be ~0.265
        const pxPerMmHeight = pxPerMmWidth // maintain aspect ratio

        // Calculate pixel heights for each page
        const pageHeightPx = pageHeightMm * pxPerMmHeight
        console.log(`Canvas: ${canvas.width}x${canvas.height}px, Page: ${pageHeightPx}px tall`)

        // Calculate total pages needed
        const totalPages = Math.ceil(canvas.height / pageHeightPx)
        console.log(`Total pages needed: ${totalPages}`)

        // Process each page
        for (let pageNum = 0; pageNum < totalPages; pageNum++) {
          // Calculate crop area for this page
          const startY = pageNum * pageHeightPx
          const endY = Math.min(startY + pageHeightPx, canvas.height)
          const cropHeight = endY - startY

          // Create temporary canvas for this page
          const pageCanvas = document.createElement('canvas')
          pageCanvas.width = canvas.width
          pageCanvas.height = cropHeight

          // Copy the relevant portion from the main canvas
          const ctx = pageCanvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(
              canvas,
              0, startY, // source position
              canvas.width, cropHeight, // source size
              0, 0, // destination position
              canvas.width, cropHeight // destination size
            )
          }

          // Convert page canvas to image and add to PDF
          const pageImgData = pageCanvas.toDataURL('image/png')

          // Add page to PDF (except first which is auto-created)
          if (pageNum > 0) {
            pdf.addPage()
          }

          // Calculate the image height for this page
          const pageImgHeightMm = (cropHeight / canvas.width) * pageWidthMm
          pdf.addImage(pageImgData, 'PNG', 0, 0, pageWidthMm, pageImgHeightMm)

          console.log(`Added page ${pageNum + 1}: ${cropHeight}px → ${pageImgHeightMm}mm`)
        }

        pdf.save(`${fileName}.pdf`)
        console.log(`✓ PDF downloaded successfully (${totalPages} pages)`)
      } else {
        // Server-side DOCX generation
        console.log('Downloading DOCX...')
        const response = await fetch(
          `/api/applications/export-docx?id=${applicationId}&template=${template}&type=${documentType}`,
          {
            method: 'GET',
            headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}
          }
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to download DOCX')
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${fileName}.docx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        console.log('✓ DOCX downloaded successfully')
      }
    } catch (err) {
      console.error('Download error:', err)
      alert(err instanceof Error ? err.message : `Error downloading ${format.toUpperCase()}`)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', fontFamily: 'system-ui' }}>
        Loading preview...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', fontFamily: 'system-ui', color: 'red' }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.close()} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
          Close
        </button>
      </div>
    )
  }

  // Helper functions to extract parts from the generated HTML
  function extractStylesFromHtml(html: string): string {
    // Capture all style content, including multiple style tags
    const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi)
    if (!styleMatches) return ''
    return styleMatches.map(match => match.replace(/<\/?style[^>]*>/gi, '')).join('\n')
  }

  function extractBodyFromHtml(html: string): string {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    return bodyMatch ? bodyMatch[1] : html
  }

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
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
        .preview-content {
          margin-top: 70px;
          padding: 0;
          background: transparent;
          min-height: 100vh;
        }
        .preview-content-inner {
          padding: 20px;
          background: white;
          margin-bottom: 20px;
        }
        /* Force all content to display naturally */
        .preview-content > * {
          max-width: 100%;
          margin: 0;
          height: auto !important;
          max-height: none !important;
          overflow: visible !important;
          display: block !important;
        }
        /* Override any container constraints */
        .preview-content div[style*="max-height"],
        .preview-content div[style*="height: "],
        .preview-content div[style*="overflow: hidden"] {
          max-height: none !important;
          height: auto !important;
          overflow: visible !important;
          display: block !important;
        }
        /* Ensure page breaks work - show all pages */
        .preview-content .page,
        .preview-content [class*="page"],
        .preview-content [class*="document"],
        .preview-content [role="document"] {
          page-break-after: auto;
          break-after: auto;
          display: block !important;
          height: auto !important;
          margin: 0;
          padding: 0;
          width: 100%;
        }
        /* Show all sections */
        .preview-content section,
        .preview-content article,
        .preview-content main {
          display: block !important;
          height: auto !important;
          margin: 0;
          padding: 0;
        }
      `}</style>

      <div className="preview-controls">
        <div className="preview-title">
          {previewData?.documentType === 'coverLetter' ? 'Cover Letter' : 'CV'} Preview -{' '}
          {previewData?.template.charAt(0).toUpperCase() + previewData?.template.slice(1)}
        </div>
        <div className="preview-buttons">
          <button className="btn btn-pdf" onClick={() => downloadFile('pdf')}>
            Download as PDF
          </button>
          <button className="btn btn-docx" onClick={() => downloadFile('docx')}>
            Download as DOCX
          </button>
          <button className="btn btn-close" onClick={() => window.close()}>
            Close
          </button>
        </div>
      </div>
      {htmlContent && (
        <div className="preview-content">
          {/* Extract and apply styles from the HTML */}
          <style>{extractStylesFromHtml(htmlContent)}</style>
          {/* Extract and render body content */}
          <div dangerouslySetInnerHTML={{ __html: extractBodyFromHtml(htmlContent) }} />
        </div>
      )}
    </>
  )
}
