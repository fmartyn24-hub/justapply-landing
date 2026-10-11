// Shared application status model — single source of truth for the Tracker
// board, the My Applications list, and the status dropdown in
// ApplicationPreview so they can't drift out of sync.

export type ApplicationStatus =
  | 'draft'
  | 'applied'
  | 'interviewing'
  | 'heard_back'
  | 'rejected'
  | 'offer'
  | 'accepted'

interface StatusMeta {
  value: ApplicationStatus
  label: string
  dot: string // Tailwind bg-* class for a small status dot
  color: string
  bgColor: string
  borderColor: string
}

export const APPLICATION_STATUSES: StatusMeta[] = [
  { value: 'draft', label: 'Want to Apply', dot: 'bg-navy-400', color: 'text-navy-200', bgColor: 'bg-navy-700', borderColor: 'border-navy-600' },
  { value: 'applied', label: 'Applied', dot: 'bg-blue-400', color: 'text-blue-300', bgColor: 'bg-primary/20', borderColor: 'border-primary/40' },
  { value: 'interviewing', label: 'Interviewing', dot: 'bg-purple-400', color: 'text-purple-300', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500/40' },
  { value: 'heard_back', label: 'Heard Back', dot: 'bg-amber-400', color: 'text-amber-300', bgColor: 'bg-amber-500/20', borderColor: 'border-amber-500/40' },
  { value: 'rejected', label: 'Rejected', dot: 'bg-red-400', color: 'text-red-300', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/40' },
  { value: 'offer', label: 'Offer', dot: 'bg-emerald-400', color: 'text-emerald-300', bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-500/40' },
  { value: 'accepted', label: 'Accepted', dot: 'bg-green-400', color: 'text-green-300', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/40' },
]

export const STATUS_BY_VALUE: Record<ApplicationStatus, StatusMeta> = APPLICATION_STATUSES.reduce(
  (acc, s) => ({ ...acc, [s.value]: s }),
  {} as Record<ApplicationStatus, StatusMeta>
)

export function statusLabel(status?: string): string {
  return STATUS_BY_VALUE[(status as ApplicationStatus) || 'draft']?.label || status || 'Want to Apply'
}
