import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { ApplicationPreview } from './ApplicationPreview'
import type { Application } from './MyApplicationsTab'
import { APPLICATION_STATUSES, type ApplicationStatus } from '@/lib/applicationStatus'

interface CandidateBoardProps {
  applications: Application[]
  onStatusChange: (id: string, status: ApplicationStatus) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onRegenerate: (id: string) => Promise<void>
  onUpdateApplication?: (id: string, data: { generated_cover_letter: string; job_title?: string; company_name?: string; job_description?: string; job_url?: string; deadline?: string; persons_of_interest?: string; status?: ApplicationStatus }) => Promise<void>
  onGenerated?: (id: string, data: { generated_cover_letter?: string; cv_advice?: string }) => void
  onCreateManual?: () => void
  loading?: boolean
  authToken?: string
}

export function CandidateBoard({
  applications,
  onStatusChange,
  onDelete,
  onRegenerate,
  onUpdateApplication,
  onGenerated,
  onCreateManual,
  loading,
  authToken,
}: CandidateBoardProps) {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [savingStatus, setSavingStatus] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    setDraggedId(appId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, newStatus: ApplicationStatus) => {
    e.preventDefault()
    if (!draggedId) return

    const app = applications.find((a) => a.id === draggedId)
    if (!app || app.status === newStatus) {
      setDraggedId(null)
      return
    }

    setSavingStatus(true)
    try {
      await onStatusChange(draggedId, newStatus)
    } finally {
      setSavingStatus(false)
      setDraggedId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return
    setDeleting(id)
    try {
      await onDelete(id)
    } finally {
      setDeleting(null)
    }
  }

  const getApplicationsByStatus = (status: ApplicationStatus) => {
    return applications.filter((app) => (app.status || 'draft') === status)
  }

  const renderColumn = (status: ApplicationStatus) => {
    const apps = getApplicationsByStatus(status)
    const config = APPLICATION_STATUSES.find((s) => s.value === status)!

    return (
      <div key={status} className="flex flex-col flex-shrink-0 w-72">
        {/* Column Header */}
        <div className={`${config.bgColor} border-b-2 ${config.borderColor} rounded-t-lg p-3`}>
          <h3 className={`font-semibold ${config.color}`}>{config.label}</h3>
          <p className="text-xs text-navy-300 mt-0.5">{apps.length} application{apps.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Droppable Area */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status)}
          className={`flex-1 p-3 space-y-2 min-h-80 rounded-b-lg border-2 border-dashed ${
            draggedId ? 'border-blue-400 bg-primary/10' : 'border-navy-700 bg-navy-800'
          } transition`}
        >
          {apps.length === 0 ? (
            <p className="text-center text-navy-400 text-xs py-6">Drop applications here</p>
          ) : (
            apps.map((app) => (
              <div
                key={app.id}
                draggable
                onDragStart={(e) => handleDragStart(e, app.id)}
                className={`bg-navy-900 p-3 rounded-lg border border-navy-700 cursor-move transition ${
                  draggedId === app.id ? 'opacity-50 border-blue-400' : 'hover:border-blue-400 hover:shadow-sm'
                }`}
              >
                <div className="mb-2">
                  <h4 className="font-medium text-white text-sm">{app.job_title}</h4>
                  <p className="text-xs text-navy-300">{app.company_name}</p>
                </div>

                {app.deadline && (
                  <p className="text-xs text-navy-400 mb-2">
                    {new Date(app.deadline).toLocaleDateString()}
                  </p>
                )}

                <div className="flex gap-1.5">
                  <Button
                    onClick={() => setSelectedApp(app)}
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    View
                  </Button>
                  <button
                    onClick={() => handleDelete(app.id)}
                    disabled={deleting === app.id}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-400/40 text-red-400 hover:bg-red-400/10 disabled:opacity-50 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-8 bg-navy-800 rounded-lg border border-navy-700 space-y-3">
        <div>
          <p className="text-white font-medium">No applications yet</p>
          <p className="text-navy-300 text-sm mt-1">Click "Just Apply" to generate your first application, or add one manually to start tracking.</p>
        </div>
        {onCreateManual && (
          <button onClick={onCreateManual} className="text-sm px-4 py-2 rounded-lg font-semibold border border-navy-600 text-navy-200 hover:bg-navy-700 hover:text-white transition">
            + Add application
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Application Pipeline</h2>
          <p className="text-sm text-navy-300 mt-1">Drag applications between columns to update status</p>
        </div>
        {onCreateManual && (
          <button onClick={onCreateManual} className="text-sm whitespace-nowrap px-4 py-2 rounded-lg font-semibold border border-navy-600 text-navy-200 hover:bg-navy-700 hover:text-white transition">
            + Add application
          </button>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {APPLICATION_STATUSES.map((s) => renderColumn(s.value))}
      </div>

      {/* Application Preview Modal */}
      {selectedApp && (
        <ApplicationPreview
          id={selectedApp.id}
          coverLetter={selectedApp.generated_cover_letter}
          cvAdvice={selectedApp.cv_advice}
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
              await onStatusChange(selectedApp.id, status)
              setSelectedApp({ ...selectedApp, status })
            } finally {
              setSavingStatus(false)
            }
          }}
          onGenerated={(id, data) => {
            setSelectedApp((prev) => (prev && prev.id === id ? { ...prev, ...data } : prev))
            onGenerated?.(id, data)
          }}
          onClose={() => setSelectedApp(null)}
          saving={savingStatus}
          authToken={authToken}
        />
      )}
    </div>
  )
}
