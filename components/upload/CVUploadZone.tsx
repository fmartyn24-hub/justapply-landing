import { useState, useRef } from 'react'

interface CVUploadZoneProps {
  onFileSelect: (file: File) => void
  isLoading?: boolean
}

export function CVUploadZone({ onFileSelect, isLoading = false }: CVUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 10 * 1024 * 1024 // 10 MB
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]

    if (file.size > maxSize) {
      return { valid: false, error: 'File must be under 10 MB' }
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only PDF and DOCX files are supported' }
    }

    return { valid: true }
  }

  const handleFile = (file: File) => {
    const validation = validateFile(file)

    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      setSelectedFile(null)
      return
    }

    setError('')
    setSelectedFile(file)
    onFileSelect(file)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
          isDragging
            ? 'border-primary bg-blue-50'
            : 'border-gray-300 hover:border-primary hover:bg-gray-50'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleInputChange}
          disabled={isLoading}
          className="hidden"
          aria-label="Upload CV file"
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center py-4">
            <svg
              className="w-16 h-16 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33A3 3 0 0116.5 19.5H6.75z"
              />
            </svg>

            <p className="text-lg font-semibold text-gray-900 mb-1">
              Drag your CV here
            </p>
            <p className="text-sm text-gray-600 mb-4">
              or click to browse
            </p>
            <p className="text-xs text-gray-500">
              PDF or DOCX • Up to 10 MB
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <svg
              className="w-16 h-16 text-green-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>

            <p className="text-lg font-semibold text-gray-900 mb-2">
              {selectedFile.name}
            </p>
            <p className="text-sm text-gray-600">
              {formatFileSize(selectedFile.size)}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedFile(null)
                setError('')
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
              className="mt-3 text-sm text-primary hover:text-blue-700 font-medium"
            >
              Choose different file
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-sm mt-3">{error}</p>
      )}
    </div>
  )
}
