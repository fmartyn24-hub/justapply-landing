import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { ApplicationPreview } from './ApplicationPreview'

export interface Application {
  id: string
  job_title: string
  company_name: string
  job_description?: string
  generated_cv: string
  generated_cover_letter: string
  status: 'draft' | 'applied' | 'saved'
  created_at: string
  updated_at: string
}

interface MyApplicationsTabProps {
  applications: Application[]
  onDelete: (id: string) => Promise<void>
  onRegenerate: (id: string) => Promise<void>
  onSaveStatus?: (id: string, status: 'draft' | 'applied') => Promise<void>
  loading?: boolean
}

export function MyApplicationsTab({ applications, onDelete, onRegenerate, onSaveStatus, loading }: MyApplicationsTabProps) {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [savingStatus, setSavingStatus] = useState(false)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return
    setDeleting(id)
    try {
      await onDelete(id)
    } finally {
      setDeleting(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-yellow-100 text-yellow-800',
      applied: 'bg-green-100 text-green-800',
      saved: 'bg-blue-100 text-blue-800',
    }
    const labels = {
      draft: '💾 Draft',
      applied: '✅ Applied',
      saved: '⭐ Saved',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-600 text-lg">No applications yet</p>
        <p className="text-gray-500 text-sm mt-1">
          Click the "Just Apply" button to generate your first application.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">My Applications</h2>
        <p className="text-gray-600 mt-1">{applications.length} application{applications.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Applications List */}
      <div className="space-y-3">
        {applications.map((app) => (
          <div
            key={app.id}
            className="bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-400 transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">{app.job_title}</h3>
                  {getStatusBadge(app.status)}
                </div>
                <p className="text-gray-600">{app.company_name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Created {new Date(app.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <Button
                onClick={() => setSelectedApp(app)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                👁️ View
              </Button>
              <Button
                onClick={() => onRegenerate(app.id)}
                disabled={loading}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                🔄 Regenerate
              </Button>
              <Button
                onClick={() => handleDelete(app.id)}
                disabled={deleting === app.id}
                variant="outline"
                size="sm"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                🗑️ Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {selectedApp && (
        <ApplicationPreview
          cv={selectedApp.generated_cv}
          coverLetter={selectedApp.generated_cover_letter}
          jobTitle={selectedApp.job_title}
          company={selectedApp.company_name}
          onSave={async (status: 'draft' | 'applied') => {
            setSavingStatus(true)
            try {
              if (onSaveStatus) {
                await onSaveStatus(selectedApp.id, status)
              }
              setSelectedApp(null)
            } catch (err) {
              console.error('Save status error:', err)
            } finally {
              setSavingStatus(false)
            }
          }}
          onClose={() => setSelectedApp(null)}
          saving={savingStatus}
        />
      )}
    </div>
  )
}
