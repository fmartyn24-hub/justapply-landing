import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { ApplicationPreview } from './ApplicationPreview'

export interface Application {
  id: string
  job_title: string
  company_name: string
  job_description?: string
  job_url?: string
  generated_cv: string
  generated_cover_letter: string
  deadline?: string
  persons_of_interest?: string
  status: 'draft' | 'applied'
  created_at: string
  updated_at: string
}

interface MyApplicationsTabProps {
  applications: Application[]
  onDelete: (id: string) => Promise<void>
  onRegenerate: (id: string) => Promise<void>
  onSaveStatus?: (id: string, status: 'draft' | 'applied') => Promise<void>
  onUpdateApplication?: (id: string, data: { generated_cv: string; generated_cover_letter: string; deadline?: string; persons_of_interest?: string }) => Promise<void>
  loading?: boolean
  authToken?: string
}

export function MyApplicationsTab({
  applications,
  onDelete,
  onRegenerate,
  onSaveStatus,
  onUpdateApplication,
  loading,
  authToken,
}: MyApplicationsTabProps) {
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

  // Group applications by status
  const wantToApply = applications.filter((app) => !app.status || app.status === 'draft')
  const applied = applications.filter((app) => app.status === 'applied')

  const ApplicationCard = ({ app }: { app: Application }) => {
    const daysUntilDeadline = app.deadline
      ? Math.ceil((new Date(app.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null

    const deadlineColor =
      daysUntilDeadline !== null
        ? daysUntilDeadline < 0
          ? 'text-red-600'
          : daysUntilDeadline < 7
          ? 'text-orange-600'
          : 'text-gray-600'
        : 'text-gray-600'

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-400 transition">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{app.job_title}</h3>
            <p className="text-gray-600">{app.company_name}</p>
            {app.deadline && (
              <p className={`text-sm mt-2 font-medium ${deadlineColor}`}>
                {daysUntilDeadline === null ? 'Deadline passed' : `Apply by ${new Date(app.deadline).toLocaleDateString()}`}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">Created {new Date(app.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <Button onClick={() => setSelectedApp(app)} variant="outline" size="sm" className="flex-1">
            Edit
          </Button>
          <Button
            onClick={() => onRegenerate(app.id)}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Regenerate
          </Button>
          <Button
            onClick={() => handleDelete(app.id)}
            disabled={deleting === app.id}
            variant="outline"
            size="sm"
            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
          >
            Delete
          </Button>
        </div>
      </div>
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
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">My Applications</h2>
        <p className="text-gray-600 mt-1">
          {wantToApply.length + applied.length} application{applications.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Want to Apply Section */}
      {wantToApply.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <h3 className="text-xl font-semibold text-gray-900">Want to Apply ({wantToApply.length})</h3>
          </div>
          <div className="space-y-3">
            {wantToApply.map((app) => (
              <ApplicationCard key={app.id} app={app} />
            ))}
          </div>
        </div>
      )}

      {/* Applied Section */}
      {applied.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <h3 className="text-xl font-semibold text-gray-900">Applied ({applied.length})</h3>
          </div>
          <div className="space-y-3">
            {applied.map((app) => (
              <ApplicationCard key={app.id} app={app} />
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {selectedApp && (
        <ApplicationPreview
          id={selectedApp.id}
          cv={selectedApp.generated_cv}
          coverLetter={selectedApp.generated_cover_letter}
          jobTitle={selectedApp.job_title}
          company={selectedApp.company_name}
          jobUrl={selectedApp.job_url}
          deadline={selectedApp.deadline}
          personsOfInterest={selectedApp.persons_of_interest}
          onSave={onUpdateApplication}
          onStatusChange={async (status: 'draft' | 'applied') => {
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
          authToken={authToken}
        />
      )}
    </div>
  )
}
