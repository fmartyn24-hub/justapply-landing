import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { ApplicationPreview } from './ApplicationPreview'
import { APPLICATION_STATUSES, STATUS_BY_VALUE, type ApplicationStatus } from '@/lib/applicationStatus'

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
  status: ApplicationStatus
  created_at: string
  updated_at: string
}

interface MyApplicationsTabProps {
  applications: Application[]
  onDelete: (id: string) => Promise<void>
  onRegenerate: (id: string) => Promise<void>
  onSaveStatus?: (id: string, status: ApplicationStatus) => Promise<void>
  onUpdateApplication?: (id: string, data: { generated_cv: string; generated_cover_letter: string; job_title?: string; company_name?: string; job_description?: string; job_url?: string; deadline?: string; persons_of_interest?: string; status?: ApplicationStatus }) => Promise<void>
  onCreateManual?: () => void
  loading?: boolean
  authToken?: string
}

export function MyApplicationsTab({
  applications,
  onDelete,
  onRegenerate,
  onSaveStatus,
  onUpdateApplication,
  onCreateManual,
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

  const grouped = APPLICATION_STATUSES.map((meta) => ({
    meta,
    apps: applications.filter((app) => (app.status || 'draft') === meta.value),
  })).filter((g) => g.apps.length > 0)

  const ApplicationCard = ({ app }: { app: Application }) => {
    const daysUntilDeadline = app.deadline
      ? Math.ceil((new Date(app.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null

    const deadlineColor =
      daysUntilDeadline !== null
        ? daysUntilDeadline < 0
          ? 'text-red-400'
          : daysUntilDeadline < 7
          ? 'text-amber-400'
          : 'text-navy-300'
        : 'text-navy-300'

    return (
      <div className="bg-navy-800 border border-navy-700 rounded-lg p-5 hover:border-blue-400 transition">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{app.job_title}</h3>
            <p className="text-navy-300">{app.company_name}</p>
            {app.deadline && (
              <p className={`text-sm mt-2 font-medium ${deadlineColor}`}>
                {daysUntilDeadline === null ? 'Deadline passed' : `Apply by ${new Date(app.deadline).toLocaleDateString()}`}
              </p>
            )}
            <p className="text-xs text-navy-400 mt-2">Created {new Date(app.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-navy-700">
          <Button onClick={() => setSelectedApp(app)} size="sm" className="flex-1">
            Edit
          </Button>
          <button
            onClick={() => onRegenerate(app.id)}
            disabled={loading}
            className="flex-1 px-3 py-1.5 text-sm font-semibold rounded-lg border border-navy-600 text-navy-200 hover:bg-navy-700 hover:text-white disabled:opacity-50 transition"
          >
            Regenerate
          </button>
          <button
            onClick={() => handleDelete(app.id)}
            disabled={deleting === app.id}
            className="flex-1 px-3 py-1.5 text-sm font-semibold rounded-lg border border-red-400/40 text-red-400 hover:bg-red-400/10 disabled:opacity-50 transition"
          >
            Delete
          </button>
        </div>
      </div>
    )
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-8 bg-navy-800 rounded-lg border border-navy-700 space-y-3">
        <div>
          <p className="text-white font-medium">No applications yet</p>
          <p className="text-navy-300 text-sm mt-1">
            Click "Just Apply" to generate your first application, or add one manually.
          </p>
        </div>
        {onCreateManual && (
          <Button onClick={onCreateManual} className="text-sm">
            + Add application
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">My Applications</h2>
          <p className="text-navy-300 mt-1">
            {applications.length} application{applications.length !== 1 ? 's' : ''}
          </p>
        </div>
        {onCreateManual && (
          <Button onClick={onCreateManual} className="text-sm whitespace-nowrap">
            + Add application
          </Button>
        )}
      </div>

      {grouped.map(({ meta, apps }) => (
        <div key={meta.value}>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-2 h-2 rounded-full ${meta.dot}`}></div>
            <h3 className="text-xl font-semibold text-white">{meta.label} ({apps.length})</h3>
          </div>
          <div className="space-y-3">
            {apps.map((app) => (
              <ApplicationCard key={app.id} app={app} />
            ))}
          </div>
        </div>
      ))}

      {/* Edit Modal */}
      {selectedApp && (
        <ApplicationPreview
          id={selectedApp.id}
          cv={selectedApp.generated_cv}
          coverLetter={selectedApp.generated_cover_letter}
          jobTitle={selectedApp.job_title}
          company={selectedApp.company_name}
          jobDescription={selectedApp.job_description}
          jobUrl={selectedApp.job_url}
          deadline={selectedApp.deadline}
          personsOfInterest={selectedApp.persons_of_interest}
          status={selectedApp.status}
          onSave={onUpdateApplication}
          onStatusChange={async (status: ApplicationStatus) => {
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
