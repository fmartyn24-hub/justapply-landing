import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { ApplicationPreview } from './ApplicationPreview'
import type { Application } from './MyApplicationsTab'

interface CandidateBoardProps {
  applications: Application[]
  onStatusChange: (id: string, status: 'draft' | 'applied') => Promise<void>
  onDelete: (id: string) => Promise<void>
  onRegenerate: (id: string) => Promise<void>
  onUpdateApplication?: (id: string, data: { generated_cv: string; generated_cover_letter: string; deadline?: string; persons_of_interest?: string }) => Promise<void>
  loading?: boolean
  authToken?: string
}

type Status = 'draft' | 'applied'

const statusConfig: Record<Status, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Want to Apply', color: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  applied: { label: 'Applied', color: 'text-green-700', bgColor: 'bg-green-50' },
}

export function CandidateBoard({
  applications,
  onStatusChange,
  onDelete,
  onRegenerate,
  onUpdateApplication,
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

  const handleDrop = async (e: React.DragEvent, newStatus: Status) => {
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

  const getApplicationsByStatus = (status: Status) => {
    return applications.filter((app) => app.status === status)
  }

  const renderColumn = (status: Status) => {
    const apps = getApplicationsByStatus(status)
    const config = statusConfig[status]

    return (
      <div key={status} className="flex flex-col min-w-96 max-w-96">
        {/* Column Header */}
        <div className={`${config.bgColor} border-b-2 border-gray-200 rounded-t-lg p-4`}>
          <h3 className={`text-lg font-semibold ${config.color}`}>{config.label}</h3>
          <p className="text-sm text-gray-600 mt-1">{apps.length} application{apps.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Droppable Area */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status)}
          className={`flex-1 p-4 space-y-3 min-h-96 rounded-b-lg border-2 border-dashed ${
            draggedId ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'
          } transition`}
        >
          {apps.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">Drop applications here</p>
          ) : (
            apps.map((app) => (
              <div
                key={app.id}
                draggable
                onDragStart={(e) => handleDragStart(e, app.id)}
                className={`bg-white p-4 rounded-lg border-2 border-gray-200 cursor-move transition ${
                  draggedId === app.id ? 'opacity-50 border-blue-400' : 'hover:border-blue-400 hover:shadow-md'
                }`}
              >
                <div className="mb-3">
                  <h4 className="font-semibold text-gray-900">{app.job_title}</h4>
                  <p className="text-sm text-gray-600">{app.company_name}</p>
                </div>

                {app.deadline && (
                  <p className="text-xs text-gray-500 mb-3">
                    Deadline: {new Date(app.deadline).toLocaleDateString()}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => setSelectedApp(app)}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    View
                  </Button>
                  <Button
                    onClick={() => handleDelete(app.id)}
                    disabled={deleting === app.id}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                  >
                    Delete
                  </Button>
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
      <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-600 text-lg">No applications yet</p>
        <p className="text-gray-500 text-sm mt-1">Click the "Just Apply" button to generate your first application, then manage them here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Application Pipeline</h2>
        <p className="text-gray-600 mt-1">Drag applications between columns to update status</p>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {(Object.keys(statusConfig) as Status[]).map((status) => renderColumn(status))}
      </div>

      {/* Application Preview Modal */}
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
              await onStatusChange(selectedApp.id, status)
              setSelectedApp(null)
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
