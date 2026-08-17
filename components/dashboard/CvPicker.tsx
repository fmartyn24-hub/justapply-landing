import { useEffect, useState } from 'react'

export interface CvSummary {
  id: string
  filename: string
  file_size_bytes: number
  created_at: string
}

interface CvPickerProps {
  authToken?: string
  value: string | null
  onChange: (cvId: string | null) => void
  className?: string
}

// Lets the candidate choose which uploaded CV the AI should ground its CV
// advice in, instead of silently always using whichever was uploaded most
// recently. Defaults to the latest CV once the list loads.
export function CvPicker({ authToken, value, onChange, className = '' }: CvPickerProps) {
  const [cvs, setCvs] = useState<CvSummary[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authToken) return
    let cancelled = false
    fetch('/api/cvs', { headers: { Authorization: `Bearer ${authToken}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load CVs')
        return res.json()
      })
      .then((body) => {
        if (cancelled) return
        if (!body.success) throw new Error(body.error || 'Failed to load CVs')
        const list: CvSummary[] = body.data || []
        setCvs(list)
        if (!value && list.length > 0) onChange(list[0].id)
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to load CVs'))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken])

  if (error) {
    return <p className={`text-sm text-red-400 ${className}`}>{error}</p>
  }

  if (cvs === null) {
    return <p className={`text-sm text-navy-400 ${className}`}>Loading your CVs…</p>
  }

  if (cvs.length === 0) {
    return (
      <p className={`text-sm text-navy-400 ${className}`}>
        No CVs uploaded yet — upload one from Settings → CVs so advice can be grounded in your actual document.
      </p>
    )
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-navy-200 mb-2">
        Which CV should this be based on?
      </label>
      <div className="space-y-2">
        {cvs.map((cv) => (
          <label
            key={cv.id}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition ${
              value === cv.id
                ? 'border-blue-500 bg-primary/10'
                : 'border-navy-600 bg-navy-900 hover:border-navy-500'
            }`}
          >
            <input
              type="radio"
              name="cv-picker"
              checked={value === cv.id}
              onChange={() => onChange(cv.id)}
              className="accent-blue-600"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white truncate">{cv.filename}</p>
              <p className="text-xs text-navy-400">Uploaded {new Date(cv.created_at).toLocaleDateString()}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
