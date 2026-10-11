interface UploadProgressProps {
  progress: number // 0-100
  status: 'uploading' | 'extracting' | 'saving' | 'complete' | 'error'
  error?: string
}

export function UploadProgress({
  progress,
  status,
  error,
}: UploadProgressProps) {
  const statusMessages = {
    uploading: 'Uploading your CV...',
    extracting: 'Extracting text from your CV...',
    saving: 'Saving your CV details...',
    complete: 'CV uploaded successfully!',
    error: 'Upload failed',
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-900">
          {statusMessages[status]}
        </p>
        {status !== 'error' && status !== 'complete' && (
          <p className="text-sm text-gray-600">{progress}%</p>
        )}
      </div>

      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            status === 'error'
              ? 'bg-red-500'
              : status === 'complete'
              ? 'bg-green-500 w-full'
              : 'bg-primary'
          }`}
          style={{
            width:
              status === 'complete' || status === 'error'
                ? '100%'
                : `${Math.min(progress, 100)}%`,
          }}
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {status === 'complete' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm font-medium">
            ✓ Your CV has been uploaded successfully
          </p>
        </div>
      )}

      {status !== 'error' && status !== 'complete' && (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-600">Please wait...</p>
        </div>
      )}
    </div>
  )
}
