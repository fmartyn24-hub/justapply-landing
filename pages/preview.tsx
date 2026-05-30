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

    /* Print rules: produce a multi-page PDF that matches the on-screen design.
       The browser's print engine renders the real HTML/CSS (colors, gradients,
       layout) and paginates natively, so the PDF looks exactly like the preview. */
    @media print {
      /* Force background colors/gradients to print (otherwise headers print white) */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      @page {
        size: letter;
        margin: 0;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }
      .container {
        width: 100% !important;
        min-height: 0 !important;
        box-shadow: none !important;
        margin: 0 !important;
      }
      /* Keep individual entries/items from being sliced across a page break */
      .entry, .job, .education-item, .skill-group, .sidebar-section, .header {
        break-inside: avoid;
        page-break-inside: avoid;
      }
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
          // Prefer the structured cover letter from generation; fall back to
          // splitting the stored plain text into paragraphs for old records.
          const clStructured = application.generated_cover_letter_json
          let clData
          if (clStructured && typeof clStructured === 'object') {
            clData = {
              opening: clStructured.opening || '',
              body_paragraphs: Array.isArray(clStructured.body_paragraphs)
                ? clStructured.body_paragraphs
                : [],
              closing: clStructured.closing || '',
            }
          } else {
            const paras = (application.generated_cover_letter || '')
              .split('\n\n')
              .map((p: string) => p.trim())
              .filter(Boolean)
            clData = {
              opening: paras[0] || '',
              body_paragraphs: paras.slice(1, paras.length > 1 ? -1 : undefined),
              closing: paras.length > 1 ? paras[paras.length - 1] : '',
            }
          }
          html = templateGenerator(null, 'coverLetter', clData)
        } else {
          // Prefer the structured CV from generation (real fields). Fall back to
          // the lossy plain-text reparser only for legacy records without JSON.
          const cvStructured = application.generated_cv_json
          let structuredCv
          if (cvStructured && typeof cvStructured === 'object') {
            structuredCv = cvStructured
          } else {
            structuredCv = convertPlainTextCvToStructured(
              application.generated_cv || '',
              profileData?.email,
              `${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim()
            )
          }
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

  // Export the visible document as a PDF using the browser's own print engine.
  // This renders the exact HTML/CSS shown in the preview (colors, gradients,
  // multi-column layouts) and paginates natively — so the PDF looks identical
  // to the preview. It needs no server-side Chrome, keeping the app
  // self-contained: the user picks "Save as PDF" in the print dialog.
  function printToPdf() {
    const iframe = iframeRef.current
    const frameWindow = iframe?.contentWindow
    if (!frameWindow) {
      alert('Preview not ready yet. Please wait a moment and try again.')
      return
    }
    try {
      frameWindow.focus()
      frameWindow.print()
    } catch (err) {
      console.error('Print error:', err)
      alert('Could not open the print dialog. Please try again.')
    }
  }

  async function downloadFile(format: 'pdf' | 'docx') {
    if (!previewData) return

    // PDF is produced client-side via the browser print dialog so it matches
    // the on-screen design exactly. DOCX is still generated server-side.
    if (format === 'pdf') {
      printToPdf()
      return
    }

    setDownloading(true)
    try {
      const { applicationId, template, documentType, accessToken } = previewData
      const fileName = `${documentType === 'coverLetter' ? 'CoverLetter' : 'CV'}_${template}`

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
    } catch (err) {
      console.error('Download error:', err)
      alert(err instanceof Error ? err.message : 'Error downloading DOCX')
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
            Save as PDF
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
