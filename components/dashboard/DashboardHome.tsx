import { Button } from '@/components/common/Button'

interface DashboardHomeProps {
  firstName?: string
  componentsCount: number
  applicationsCount: number
  appliedCount: number
  cvsCount: number
  onJustApply: () => void
  onCompleteProfile: () => void
  onAddRole: () => void
  onUploadCv: () => void
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-navy-800 border border-navy-700 rounded-xl p-5">
      <p className="text-3xl font-semibold text-white">{value}</p>
      <p className="text-sm text-navy-300 mt-1">{label}</p>
    </div>
  )
}

interface Step {
  done: boolean
  title: string
  body: string
  cta: string
  onClick: () => void
}

// First-run checklist: the four things that make the rest of the app useful.
// Disappears once they're all done.
function GettingStarted({ steps }: { steps: Step[] }) {
  const doneCount = steps.filter((s) => s.done).length
  const next = steps.find((s) => !s.done)
  if (!next) return null

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-xl p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-white font-semibold">Get set up</h2>
        <span className="text-xs text-navy-300">
          {doneCount} of {steps.length} done
        </span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-navy-700 overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <ol className="mt-5 space-y-2">
        {steps.map((step, i) => {
          const isNext = step === next
          return (
            <li
              key={step.title}
              className={`flex items-start gap-3 rounded-lg p-3 ${isNext ? 'bg-navy-900 border border-navy-600' : ''}`}
            >
              <span
                className={`mt-0.5 w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-semibold ${
                  step.done ? 'bg-emerald-500/20 text-emerald-300' : isNext ? 'bg-primary text-white' : 'bg-navy-700 text-navy-300'
                }`}
                aria-hidden="true"
              >
                {step.done ? '✓' : i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${step.done ? 'text-navy-400 line-through' : 'text-white'}`}>
                  {step.title}
                </p>
                {isNext && <p className="text-sm text-navy-300 mt-0.5">{step.body}</p>}
              </div>
              {isNext && (
                <Button size="sm" onClick={step.onClick} className="flex-shrink-0">
                  {step.cta}
                </Button>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function DashboardHome({
  firstName,
  componentsCount,
  applicationsCount,
  appliedCount,
  cvsCount,
  onJustApply,
  onCompleteProfile,
  onAddRole,
  onUploadCv,
}: DashboardHomeProps) {
  const steps: Step[] = [
    {
      done: !!firstName,
      title: 'Add your name and contact details',
      body: 'They go at the top of every CV and cover letter you export.',
      cta: 'Add details',
      onClick: onCompleteProfile,
    },
    {
      done: componentsCount > 0,
      title: 'Add your most recent role',
      body: 'The first building block of your career library. Every application draws on it.',
      cta: 'Add a role',
      onClick: onAddRole,
    },
    {
      done: cvsCount > 0,
      title: 'Upload your current CV',
      body: 'Keep it on file so you can attach the right version to each application.',
      cta: 'Upload CV',
      onClick: onUploadCv,
    },
    {
      done: applicationsCount > 0,
      title: 'Save a job you want to apply for',
      body: 'Paste the posting so it is there when you write your cover letter, and when you prep for the interview.',
      cta: 'Just Apply',
      onClick: onJustApply,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Welcome{firstName ? ` back, ${firstName}` : ' to JustApply'}
        </h1>
        <p className="text-navy-300 mt-1">Here&apos;s where things stand.</p>
      </div>

      <GettingStarted steps={steps} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Career components" value={componentsCount} />
        <StatCard label="Applications" value={applicationsCount} />
        <StatCard label="Applied" value={appliedCount} />
      </div>

      <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-white font-medium">Found a job worth going for?</h2>
          <p className="text-navy-300 text-sm mt-1">
            Save the posting, write a cover letter from your library, and track it to an offer.
          </p>
        </div>
        <Button onClick={onJustApply}>Just Apply</Button>
      </div>
    </div>
  )
}
