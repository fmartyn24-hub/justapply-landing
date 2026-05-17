import { useState } from 'react'
import { useRouter } from 'next/router'
import { withAuth } from '@/lib/middleware/withAuth'
import { CVUploadZone } from '@/components/upload/CVUploadZone'
import { UploadProgress } from '@/components/upload/UploadProgress'
import { Button } from '@/components/common/Button'
import Link from 'next/link'

function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'uploading' | 'extracting' | 'saving' | 'complete' | 'error'
  >('idle')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setError('')
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file')
      return
    }

    setIsUploading(true)
    setError('')
    setUploadStatus('uploading')
    setUploadProgress(0)

    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await selectedFile.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const next = prev + Math.random() * 30
          return next > 80 ? 80 : next
        })
      }, 300)

      // Upload file
      const response = await fetch('/api/upload-cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Filename': selectedFile.name,
          'X-Mime-Type': selectedFile.type,
        },
        body: uint8Array.buffer,
      })

      clearInterval(uploadInterval)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      setUploadProgress(85)
      setUploadStatus('extracting')

      // Simulate extraction delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setUploadProgress(95)
      setUploadStatus('saving')

      // Simulate saving delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      setUploadProgress(100)
      setUploadStatus('complete')

      // Redirect to dashboard after 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000))
      router.push('/dashboard')
    } catch (err) {
      console.error('Upload error:', err)
      setUploadStatus('error')
      setError(
        err instanceof Error ? err.message : 'An error occurred during upload'
      )
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/">
            <img src="/logo-light.svg" alt="justapply" className="h-10" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Upload Your CV
            </h1>
            <p className="text-lg text-gray-600">
              Share your resume so we can create tailored applications for you.
            </p>
          </div>

          {/* Upload Zone or Progress */}
          <div className="space-y-6">
            {uploadStatus === 'idle' ? (
              <>
                <CVUploadZone
                  onFileSelect={handleFileSelect}
                  isLoading={isUploading}
                />

                {selectedFile && (
                  <div className="flex gap-4">
                    <Button
                      onClick={handleUpload}
                      loading={isUploading}
                      size="lg"
                      className="flex-1"
                    >
                      Upload CV
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedFile(null)
                        setError('')
                      }}
                      variant="outline"
                      size="lg"
                      className="flex-1"
                      disabled={isUploading}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <UploadProgress
                progress={uploadProgress}
                status={uploadStatus}
                error={error}
              />
            )}
          </div>

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">
              What happens next?
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>✓ We extract text and key information from your CV</li>
              <li>✓ Your CV is securely stored and only you can access it</li>
              <li>✓ When you find a job you want to apply for, we'll match your experience to the role</li>
              <li>✓ We generate a tailored CV and cover letter in minutes</li>
            </ul>
          </div>

          {/* Format Support */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Supported Formats
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              We support PDF and DOCX files up to 10 MB in size.
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• PDF (.pdf)</li>
              <li>• Word Document (.docx)</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

export default withAuth(UploadPage)
