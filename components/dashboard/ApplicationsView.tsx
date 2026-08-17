import { useEffect, useState } from 'react'
import { Button } from '@/components/common/Button'
import { ApplicationPreview } from './ApplicationPreview'
import { APPLICATION_STATUSES, type ApplicationStatus } from '@/lib/applicationStatus'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { StatusSelect } from '@/components/common/StatusSelect'

export interface Application {
  id: string
  job_title: string
  company_name: string
  job_description?: string
  job_url?: string
  generated_cv?: string
  generated_cover_letter: string
  cv_advice?: string
  cv_id?: string | null
  deadline?: string
  persons_of_interest?: string
  status: ApplicationStatus
  created_at: string
  updated_at: string
}

type ViewMode = 'list' | 'kanban'

interface ApplicationsViewProps {
  applications: Application[]
  onDelete: (id: string) => Promise<void>
  onStatusChange: (id: string, status: ApplicationStatus) => Promise<void>
  onUpdateApplication?: (id: string, data: { generated_cover_letter: string; job_title?: string; company_name?: string; job_description?: string; job_url?: string; deadline?: string; persons_of_interest?: string; status?: ApplicationStatus }) => Promise<void>
  onGenerated?: (id: string, data: { generated_cover_letter?: string; cv_advice?: string }) => void
  onCreateManual?: () => void
  loading?: boolean
  authToken?: string
  openApplicationId?: string | null
  onApplicationOpened?: () => void
  components?: { id: string; type: string; title: string; organization_name?: string }[]
  aiLocked?: boolean
}

// Applications (list) and Tracker (kanban) used to be two separate tabs
// showing the exact same data — this merges them into one screen with a
// view switcher, plus a status filter, instead of maintaining two parallel
// UIs over one dataset.
export function ApplicationsView({
  applications,
  onDelete,
  onStatusChange,
  onUpdateApplication,
  onGenerated,
  onCreateManual,
  loading,
  authToken,
  openApplicationId,
  onApplicationOpened,
  components,
  aiLocked,
}: ApplicationsViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all')
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [savingStatus, setSavingStatus] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [cardSavingStatusId, setCardSavingStatusId] = useState<string | null>(null)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('justapply-applications-view') : null
    if (stored === 'list' || stored === 'kanban') setViewMode(stored)
  }, [])

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode)
    window.localStorage.setItem('justapply-applications-view', mode)
  }

  // Jump straight to the just-generated application instead of leaving the
  // user to find it themselves after Just Apply finishes.
  useEffect(() => {
    if (!openApplicationId) return
    const app = applications.find((a) => a.id === openApplicationId)
    if (app) {
      setSelectedApp(app)
      onApplicationOpened?.()
    }
  }, [openApplicationId, applications, onApplicationOpened])

  const filteredApplications = statusFilter === 'all' ? applications : applications.filter((a) => (a.status || 'draft') === statusFilter)

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await onDelete(id)
    } finally {
      setDeleting(null)
      setConfirmDeleteId(null)
    }
  }

  const handleCardStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    setCardSavingStatusId(appId)
    try {
      await onStatusChange(appId, newStatus)
    } finally {
      setCardSavingStatusId(null)
    }
  }

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

  const ViewToggle = () => (
    <div className="flex items-center gap-1 bg-navy-900 border border-navy-700 rounded-lg p-1">
      <button
        onClick={() => changeViewMode('list')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
          viewMode === 'list' ? 'bg-primary text-white' : 'text-navy-300 hover:text-white'
        }`}
      >
        List
      </button>
      <button
        onClick={() => changeViewMode('kanban')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
          viewMode === 'kanban' ? 'bg-primary text-white' : 'text-navy-300 hover:text-white'
        }`}
      >
        Kanban
      </button>
    </div>
  )

  const StatusFilter = () => (
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | 'all')}
      className="bg-navy-900 border border-navy-700 rounded-lg text-white text-sm px-3 py-2 focus:outline-none focus:border-blue-500"
    >
      <option value="all">All statuses</option>
      {APPLICATION_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  )

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
        <div className="flex items-start justify-between mb-3 gap-3">
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
          <StatusSelect
            value={app.status || 'draft'}
            onChange={(newStatus) => handleCardStatusChange(app.id, newStatus)}
            disabled={cardSavingStatusId === app.id}
            size="sm"
          />
        </div>
        <div className="flex gap-2 pt-3 border-t border-navy-700">
          <Button onClick={() => setSelectedApp(app)} size="sm" className="flex-1">
            Edit
          </Button>
          <button
            onClick={() => setConfirmDeleteId(app.id)}
            disabled={deleting === app.id}
            className="flex-1 px-3 py-1.5 text-sm font-semibold rounded-lg border border-red-400/40 text-red-400 hover:bg-red-400/10 disabled:opacity-50 transition"
          >
            Delete
          </button>
        </div>
      </div>
    )
  }

  const renderKanbanColumn = (status: ApplicationStatus) => {
    const apps = filteredApplications.filter((a) => (a.status || 'draft') === status)
    const config = APPLICATION_STATUSES.find((s) => s.value === status)!

    return (
      <div key={status} className="flex flex-col flex-shrink-0 w-72">
        <div className={`${config.bgColor} border-b-2 ${config.borderColor} rounded-t-lg p-3`}>
          <h3 className={`font-semibold ${config.color}`}>{config.label}</h3>
          <p className="text-xs text-navy-300 mt-0.5">{apps.length} application{apps.length !== 1 ? 's' : ''}</p>
        </div>
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
                  <p className="text-xs text-navy-400 mb-2">{new Date(app.deadline).toLocaleDateString()}</p>
                )}
                <div className="flex gap-1.5">
                  <Button onClick={() => setSelectedApp(app)} size="sm" className="flex-1 text-xs">
                    View
                  </Button>
                  <button
                    onClick={() => setConfirmDeleteId(app.id)}
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

  const grouped = APPLICATION_STATUSES.map((meta) => ({
    meta,
    apps: filteredApplications.filter((app) => (app.status || 'draft') === meta.value),
  })).filter((g) => g.apps.length > 0)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">Applications</h2>
          <p className="text-navy-300 mt-1">
            {filteredApplications.length} of {applications.length} application{applications.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusFilter />
          <ViewToggle />
          {onCreateManual && (
            <Button onClick={onCreateManual} className="text-sm whitespace-nowrap">
              + Add application
            </Button>
          )}
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <p className="text-center text-navy-400 text-sm py-8">No applications match this filter.</p>
      ) : viewMode === 'list' ? (
        grouped.map(({ meta, apps }) => (
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
        ))
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {APPLICATION_STATUSES.map((s) => renderKanbanColumn(s.value))}
        </div>
      )}

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
          components={components}
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
          aiLocked={aiLocked}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        title="Delete application?"
        message="Are you sure you want to delete this application? This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}
