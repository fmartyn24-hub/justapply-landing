import { APPLICATION_STATUSES, type ApplicationStatus } from '@/lib/applicationStatus'

interface StatusSelectProps {
  value: ApplicationStatus
  onChange: (status: ApplicationStatus) => void
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
}

// Shared status dropdown — native <select> underneath (for accessibility and
// mobile keyboards) but with the browser's default arrow hidden and a custom
// chevron drawn on top, since the native arrow reads poorly on dark navy.
export function StatusSelect({ value, onChange, disabled, size = 'md', className = '' }: StatusSelectProps) {
  const meta = APPLICATION_STATUSES.find((s) => s.value === value) || APPLICATION_STATUSES[0]
  const padding = size === 'sm' ? 'pl-2.5 pr-7 py-1 text-xs' : 'pl-3 pr-8 py-1.5 text-sm'

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <span className={`absolute left-2.5 w-1.5 h-1.5 rounded-full pointer-events-none ${meta.dot}`} />
      <select
        value={value || 'draft'}
        onChange={(e) => onChange(e.target.value as ApplicationStatus)}
        disabled={disabled}
        className={`appearance-none bg-navy-900 border border-navy-600 rounded-lg text-white font-medium ${padding} pl-6 focus:outline-none focus:border-blue-500 disabled:opacity-50 cursor-pointer hover:border-navy-500 transition`}
      >
        {APPLICATION_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-2 w-3.5 h-3.5 text-navy-300 pointer-events-none"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 7.5 10 12.5 15 7.5" />
      </svg>
    </div>
  )
}
