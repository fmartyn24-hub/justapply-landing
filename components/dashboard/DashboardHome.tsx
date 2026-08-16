import { Button } from '@/components/common/Button'

interface DashboardHomeProps {
  firstName?: string
  componentsCount: number
  applicationsCount: number
  appliedCount: number
  onJustApply: () => void
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-navy-800 border border-navy-700 rounded-xl p-5">
      <p className="text-3xl font-semibold text-white">{value}</p>
      <p className="text-sm text-navy-300 mt-1">{label}</p>
    </div>
  )
}

export function DashboardHome({ firstName, componentsCount, applicationsCount, appliedCount, onJustApply }: DashboardHomeProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Welcome{firstName ? ` back, ${firstName}` : ' to JustApply'}
        </h1>
        <p className="text-navy-300 mt-1">Here's where things stand.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Career components" value={componentsCount} />
        <StatCard label="Applications" value={applicationsCount} />
        <StatCard label="Applied" value={appliedCount} />
      </div>

      <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-white font-medium">Ready to apply for something?</h2>
          <p className="text-navy-300 text-sm mt-1">Paste a job description and generate a tailored CV and cover letter.</p>
        </div>
        <Button onClick={onJustApply}>Just Apply</Button>
      </div>
    </div>
  )
}
