import { useEffect, useState } from 'react'
import { CVUploadZone } from '@/components/upload/CVUploadZone'
import { Button } from '@/components/common/Button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import type { CvSummary } from './CvPicker'

interface CvManagerProps {
  authToken?: string
}

// The "visibly stores CVs by upload date" section — lets the candidate see,
// upload, and remove the CVs that CvPicker lets them choose between when
// generating cover letters / CV advice.
export function CvManager({ authToken }: CvManagerProps) {
  const [cvs, setCvs] = useState<CvSummary[] | null>(null)
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const fetchCvs = () => {
    if (!authToken) return
    fetch('/api/cvs', { headers: { Authorization: `Bearer ${authToken}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load CVs')
        return res.json()
      })
      .then((body) => {
        if (!body.success) throw new Error(body.error || 'Failed to load CVs')
        setCvs(body.data || [])
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load CVs'))
  }

  useEffect(fetchCvs, [authToken])

  const handleUpload = async () => {
    if (!file || !authToken) return
    setUploading(true)
    setError('')
    try {
      const arrayBuffer = await file.arrayBuffer()
      const res = await fetch('/api/upload-cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Filename': file.name,
          'X-Mime-Type': file.type,
          Authorization: `Bearer ${authToken}`,
        },
        body: arrayBuffer,
      })
      if (!res.ok) throw new Error('Upload failed')
      const body = await res.json()
      if (!body.success) throw new Error(body.error || 'Upload failed')
      setFile(null)
      fetchCvs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!authToken) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/cvs?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!res.ok) throw new Error('Delete failed')
      const body = await res.json()
      if (!body.success) throw new Error(body.error || 'Delete failed')
      fetchCvs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-white">CVs</h2>
        <p className="text-navy-300 mt-1">
          Your uploaded CVs/resumes, by date — pick which one to use whenever you generate a cover letter or CV advice.
          Cover letters don't belong here; they live with each application instead.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">{error}</div>
      )}

      {cvs === null ? (
        <p className="text-sm text-navy-400">Loading…</p>
      ) : cvs.length === 0 ? (
        <p className="text-sm text-navy-400">No CVs uploaded yet.</p>
      ) : (
        <ul className="divide-y divide-navy-700 border border-navy-700 rounded-lg bg-navy-800">
          {cvs.map((cv) => (
            <li key={cv.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{cv.filename}</p>
                <p className="text-xs text-navy-400">
                  Uploaded {new Date(cv.created_at).toLocaleDateString()} · {(cv.file_size_bytes / 1024).toFixed(0)} KB
                </p>
              </div>
              <button
                onClick={() => setConfirmDeleteId(cv.id)}
                disabled={deletingId === cv.id}
                className="text-sm font-semibold text-red-400 hover:text-red-300 disabled:opacity-50 flex-shrink-0"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3 pt-2 border-t border-navy-700">
        <p className="text-sm font-medium text-navy-200">Upload your CV or resume (not a cover letter)</p>
        <CVUploadZone onFileSelect={setFile} isLoading={uploading} />
        {file && (
          <div className="flex gap-3">
            <Button onClick={handleUpload} loading={uploading} size="sm" className="flex-1">
              Upload CV
            </Button>
            <button
              onClick={() => setFile(null)}
              disabled={uploading}
              className="flex-1 px-4 py-2 rounded-lg font-semibold border border-navy-600 text-navy-200 hover:bg-navy-700 hover:text-white disabled:opacity-50 transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        title="Delete this CV?"
        message="This can't be undone. Applications that used it for CV advice will keep their existing advice."
        confirmLabel="Delete"
        danger
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}
