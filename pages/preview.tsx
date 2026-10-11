import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { buildPreviewHtml } from '@/lib/previewHtml'

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

        // Build the print-ready HTML via the shared builder so the on-screen
        // preview and the server-side PDF render from one source of truth.
        setHtmlContent(buildPreviewHtml(application, profileData, template, documentType))
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

  // Download the document. Both formats are generated server-side so the result
  // is a true one-click file download with no browser print dialog:
  //   • PDF  → headless-Chrome renders the EXACT preview HTML (colors, gradients,
  //            multi-column layouts) with native pagination, so it pixel-matches
  //            what's on screen.
  //   • DOCX → template-specific docx generators.
  async function downloadFile(format: 'pdf' | 'docx') {
    if (!previewData) return

    setDownloading(true)
    try {
      const { applicationId, template, documentType, accessToken } = previewData
      const fileName = `${documentType === 'coverLetter' ? 'CoverLetter' : 'CV'}_${template}`

      const endpoint =
        format === 'pdf'
          ? `/api/applications/export-pdf-html?id=${applicationId}&template=${template}&type=${documentType}`
          : `/api/applications/export-docx?id=${applicationId}&template=${template}&type=${documentType}`

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to download ${format.toUpperCase()}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${fileName}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
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
