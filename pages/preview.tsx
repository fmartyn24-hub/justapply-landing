import { useEffect, useRef, useState } from 'react'
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

// Override styles injected into the rendered document so that fixed-height,
// overflow:hidden template containers can grow and flow across multiple pages.
// Without this, templates designed as a single 8.5x11in page clip extra content.
const OVERRIDE_STYLES = `
  <style id="preview-overrides">
    html, body {
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      overflow: visible !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
    }
    .container {
      height: auto !important;
      min-height: 11in;
      max-height: none !important;
      overflow: visible !important;
      box-shadow: none !important;
      margin: 0 auto !important;
    }
    .content {
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      overflow: visible !important;
    }
  </style>
`

// Inject the override styles right before </head> (or prepend if no head)
function buildDocument(html: string): string {
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, OVERRIDE_STYLES + '</head>')
  }
  return OVERRIDE_STYLES + html
}

export default function PreviewPage() {
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<any>(null)
  const [downloading, setDownloading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    async function loadPreview() {
      try {
        // Get preview data from sessionStorage
        const data = sessionStorage.getItem('previewData')
        if (!data) {
          setError('Preview data not found')
          setLoading(false)
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
          setLoading(false)
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
          setLoading(false)
          return
        }

        // Fetch user profile
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('first_name, last_name, email')
          .eq('id', session.user.id)
          .single()

        // Generate HTML based on document type
        const templateGenerator = templateGenerators[template] || generateModernHtml
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

        setHtmlContent(buildDocument(html))
        setLoading(false)
      } catch (err) {
        console.error('Error loading preview:', err)
        setError(err instanceof Error ? err.message : 'Failed to load preview')
        setLoading(false)
      }
    }

    loadPreview()
  }, [])

  // Resize the iframe to fit its content height so the whole document is visible
  function handleIframeLoad() {
    const iframe = iframeRef.current
    if (!iframe || !iframe.contentDocument) return
    try {
      const doc = iframe.contentDocument
      const target = (doc.querySelector('.container') as HTMLElement) || doc.body
      const height = Math.max(target.scrollHeight, doc.body.scrollHeight)
      iframe.style.height = `${height + 40}px`
    } catch {
      // ignore cross-origin (shouldn't happen with srcDoc)
    }
  }

  async function downloadFile(format: 'pdf' | 'docx') {
    if (!previewData) return

    setDownloading(true)
    try {
      const { applicationId, template, documentType, accessToken } = previewData
      const fileName = `${documentType === 'coverLetter' ? 'CoverLetter' : 'CV'}_${template}`

      if (format === 'pdf') {
        console.log('Starting client-side PDF generation...')
        const html2canvas = (await import('html2canvas')).default
        const jsPDF = (await import('jspdf')).jsPDF

        // Capture the rendered document from inside the iframe
        const iframe = iframeRef.current
        if (!iframe || !iframe.contentDocument) {
          throw new Error('Preview not ready')
        }
        const doc = iframe.contentDocument
        const target =
          (doc.querySelector('.container') as HTMLElement) || doc.body

        console.log('Rendering iframe content to canvas...')
        const canvas = await html2canvas(target, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: target.scrollWidth,
          windowHeight: target.scrollHeight,
        })

        // Build an A4 PDF, fitting the canvas width to the page width and
        // slicing the canvas vertically into page-height chunks.
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        })

        const pageWidthMm = pdf.internal.pageSize.getWidth() // 210mm
        const pageHeightMm = pdf.internal.pageSize.getHeight() // 297mm

        // Conversion: how many canvas pixels equal 1mm when width is fit to page
        const pxPerMm = canvas.width / pageWidthMm
        // Canvas pixels that correspond to a single full PDF page height
        const pageHeightPx = pageHeightMm * pxPerMm

        const totalPages = Math.max(1, Math.ceil(canvas.height / pageHeightPx))
        console.log(
          `Canvas: ${canvas.width}x${canvas.height}px, page=${Math.round(
            pageHeightPx
          )}px, totalPages=${totalPages}`
        )

        for (let pageNum = 0; pageNum < totalPages; pageNum++) {
          const startY = pageNum * pageHeightPx
          const sliceHeight = Math.min(pageHeightPx, canvas.height - startY)
          if (sliceHeight <= 0) break

          // Copy this slice into a temporary canvas
          const pageCanvas = document.createElement('canvas')
          pageCanvas.width = canvas.width
          pageCanvas.height = sliceHeight
          const ctx = pageCanvas.getContext('2d')
          if (ctx) {
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
            ctx.drawImage(
              canvas,
              0, startY,
              canvas.width, sliceHeight,
              0, 0,
              canvas.width, sliceHeight
            )
          }

          const imgData = pageCanvas.toDataURL('image/png')
          if (pageNum > 0) pdf.addPage()

          // Height of this slice in mm (partial last page stays proportional)
          const sliceHeightMm = sliceHeight / pxPerMm
          pdf.addImage(imgData, 'PNG', 0, 0, pageWidthMm, sliceHeightMm)
          console.log(`Page ${pageNum + 1}: ${Math.round(sliceHeight)}px -> ${sliceHeightMm.toFixed(1)}mm`)
        }

        pdf.save(`${fileName}.pdf`)
        console.log(`✓ PDF downloaded (${totalPages} page(s))`)
      } else {
        // Server-side DOCX generation
        console.log('Downloading DOCX...')
        const response = await fetch(
          `/api/applications/export-docx?id=${applicationId}&template=${template}&type=${documentType}`,
          {
            method: 'GET',
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
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

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #e5e7eb; }
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
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-pdf { background: #e74c3c; color: white; }
        .btn-pdf:hover:not(:disabled) { background: #c0392b; }
        .btn-docx { background: #3498db; color: white; }
        .btn-docx:hover:not(:disabled) { background: #2980b9; }
        .btn-close { background: rgba(255,255,255,0.2); color: white; }
        .btn-close:hover { background: rgba(255,255,255,0.3); }
        .preview-stage {
          margin-top: 70px;
          padding: 24px 12px;
          display: flex;
          justify-content: center;
        }
        .preview-frame {
          width: 8.5in;
          max-width: 100%;
          border: none;
          background: white;
          box-shadow: 0 4px 24px rgba(0,0,0,0.15);
          display: block;
        }
      `}</style>

      <div className="preview-controls">
        <div className="preview-title">
          {previewData?.documentType === 'coverLetter' ? 'Cover Letter' : 'CV'} Preview -{' '}
          {previewData?.template
            ? previewData.template.charAt(0).toUpperCase() + previewData.template.slice(1)
            : ''}
        </div>
        <div className="preview-buttons">
          <button className="btn btn-pdf" onClick={() => downloadFile('pdf')} disabled={downloading}>
            {downloading ? 'Generating...' : 'Download as PDF'}
          </button>
          <button className="btn btn-docx" onClick={() => downloadFile('docx')} disabled={downloading}>
            Download as DOCX
          </button>
          <button className="btn btn-close" onClick={() => window.close()}>
            Close
          </button>
        </div>
      </div>

      {htmlContent && (
        <div className="preview-stage">
          <iframe
            ref={iframeRef}
            className="preview-frame"
            srcDoc={htmlContent}
            title="Document Preview"
            onLoad={handleIframeLoad}
          />
        </div>
      )}
    </>
  )
}
