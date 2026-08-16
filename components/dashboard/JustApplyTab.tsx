import { useState } from 'react'
import { Button } from '@/components/common/Button'

// Minimal shape of a career component needed by this wizard. The dashboard's
// richer CareerComponent is structurally compatible.
interface LibraryComponent {
  id: string
  type: string
  title: string
  organization_name?: string
  description?: string
}

interface Recommendation {
  id: string
  title: string
  type: string
  reason: string
}

interface AnalysisResult {
  success: boolean
  keywords: string[]
  thesis: string
  recommendations: Recommendation[]
}

interface JustApplyTabProps {
  // Advice step: analyse the job ad and return keywords + recommended components.
  onAnalyze: (jobDescription: string, jobTitle?: string, company?: string) => Promise<AnalysisResult>
  // Generation step: build the cover letter + CV advice, foregrounding the chosen components.
  onSubmit: (
    jobDescription: string,
    jobTitle?: string,
    company?: string,
    selectedComponentIds?: string[]
  ) => Promise<void>
  components: LibraryComponent[]
  loading?: boolean
}

const TYPE_LABELS: Record<string, string> = {
  role: 'Role',
  experience: 'Role',
  skill: 'Skill',
  tool: 'Skill',
  achievement: 'Achievement',
  campaign: 'Achievement',
  project: 'Project',
  kpi: 'KPI',
  voice: 'Voice',
  context: 'Context',
}

export function JustApplyTab({ onAnalyze, onSubmit, components, loading }: JustApplyTabProps) {
  const [step, setStep] = useState<'input' | 'proposal'>('input')

  const [jobDescription, setJobDescription] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')

  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const reasonById = new Map<string, string>(
    (analysis?.recommendations || []).map((r) => [r.id, r.reason])
  )
  const recommendedIds = new Set((analysis?.recommendations || []).map((r) => r.id))

  // Show recommended components first, then the rest of the library.
  const orderedComponents = [...components].sort((a, b) => {
    const ra = recommendedIds.has(a.id) ? 0 : 1
    const rb = recommendedIds.has(b.id) ? 0 : 1
    return ra - rb
  })

  const resetAll = () => {
    setStep('input')
    setJobDescription('')
    setJobTitle('')
    setCompany('')
    setAnalysis(null)
    setSelectedIds(new Set())
    setError('')
  }

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (jobDescription.trim().length < 50) {
      setError('Please paste a job description (at least 50 characters).')
      return
    }

    setAnalyzing(true)
    try {
      const result = await onAnalyze(jobDescription, jobTitle || undefined, company || undefined)
      setAnalysis(result)
      // Pre-select the recommended components.
      setSelectedIds(new Set(result.recommendations.map((r) => r.id)))
      setStep('proposal')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyse the job posting.')
    } finally {
      setAnalyzing(false)
    }
  }

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleGenerate = async () => {
    setError('')
    try {
      await onSubmit(
        jobDescription,
        jobTitle || undefined,
        company || undefined,
        selectedIds.size > 0 ? Array.from(selectedIds) : undefined
      )
      resetAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate application.')
    }
  }

  // ─────────────────────────────── STEP 1: INPUT ───────────────────────────────
  if (step === 'input') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-white">Just Apply</h2>
          <p className="text-navy-300 mt-1">
            Paste a job posting. We&apos;ll show you which parts of your library to highlight before
            generating a tailored cover letter and advice on your uploaded CV.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm">
          <span className="flex items-center gap-2 font-medium text-blue-600">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
            Paste job
          </span>
          <span className="text-navy-500">→</span>
          <span className="flex items-center gap-2 text-navy-400">
            <span className="w-6 h-6 rounded-full bg-navy-700 text-navy-300 flex items-center justify-center text-xs">2</span>
            Review highlights
          </span>
        </div>

        <form onSubmit={handleAnalyze} className="space-y-6 bg-navy-800 rounded-lg p-6 border border-navy-600">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold text-white">Job Details (Optional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-200 mb-1">Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Senior React Developer"
                  className="w-full px-4 py-2 bg-navy-900 border border-navy-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-200 mb-1">Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g., Acme Inc"
                  className="w-full px-4 py-2 bg-navy-900 border border-navy-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-200 mb-2">Job Description *</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job posting here..."
              className="w-full px-4 py-3 bg-navy-900 border-2 border-navy-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-900/40 resize-none h-64"
            />
            <p className="text-xs text-navy-400 mt-2">Minimum 50 characters required</p>
          </div>

          <Button
            type="submit"
            disabled={analyzing || jobDescription.trim().length < 50}
            loading={analyzing}
            className="w-full"
          >
            {analyzing ? 'Analysing the role...' : 'Analyze & suggest highlights →'}
          </Button>

          <p className="text-xs text-navy-300 bg-navy-900 rounded p-3 border border-navy-600">
            Tip: Include the full job description for better results. Next, you&apos;ll confirm which
            achievements, skills, and roles to spotlight.
          </p>
        </form>
      </div>
    )
  }

  // ──────────────────────────── STEP 2: PROPOSAL ───────────────────────────────
  const selectedCount = selectedIds.size

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Review highlights</h2>
        <p className="text-navy-300 mt-1">
          Here&apos;s what we&apos;d highlight for{' '}
          <span className="font-medium">{jobTitle || 'this role'}</span>
          {company ? <> at <span className="font-medium">{company}</span></> : null}. Adjust the
          selection, then generate.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        <span className="flex items-center gap-2 text-navy-400">
          <span className="w-6 h-6 rounded-full bg-navy-700 text-navy-300 flex items-center justify-center text-xs">1</span>
          Paste job
        </span>
        <span className="text-navy-500">→</span>
        <span className="flex items-center gap-2 font-medium text-blue-600">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
          Review highlights
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Match thesis */}
      {analysis?.thesis && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <p className="text-sm font-semibold text-blue-200 mb-1">Why you&apos;re a fit</p>
          <p className="text-sm text-blue-200">{analysis.thesis}</p>
        </div>
      )}

      {/* Employer keywords */}
      {analysis && analysis.keywords.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-white mb-2">Keywords this employer cares about</p>
          <div className="flex flex-wrap gap-2">
            {analysis.keywords.map((kw, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full bg-navy-700 text-navy-200 text-xs font-medium border border-navy-600"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Component selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-white">
            Components to highlight ({selectedCount} selected)
          </p>
          {components.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setSelectedIds(
                  selectedCount === components.length
                    ? new Set()
                    : new Set(components.map((c) => c.id))
                )
              }
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              {selectedCount === components.length ? 'Clear all' : 'Select all'}
            </button>
          )}
        </div>

        {components.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            You don&apos;t have any saved career components yet. We&apos;ll generate from your profile,
            but adding components in your Library produces much stronger, more tailored results.
          </div>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {orderedComponents.map((c) => {
              const checked = selectedIds.has(c.id)
              const recommended = recommendedIds.has(c.id)
              const reason = reasonById.get(c.id)
              return (
                <label
                  key={c.id}
                  className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    checked ? 'border-blue-400 bg-primary/10' : 'border-navy-600 bg-navy-800 hover:border-navy-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(c.id)}
                    className="mt-1 h-4 w-4 text-blue-600 rounded border-navy-500 focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">{c.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-navy-700 text-navy-300">
                        {TYPE_LABELS[c.type] || c.type}
                      </span>
                      {recommended && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-green-100 text-green-700">
                          Recommended
                        </span>
                      )}
                    </div>
                    {c.organization_name && (
                      <p className="text-xs text-navy-400 mt-0.5">{c.organization_name}</p>
                    )}
                    {reason && (
                      <p className="text-xs text-blue-300 mt-1">
                        <span className="font-medium">Why:</span> {reason}
                      </p>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* Reversible navigation — always a way back and a way forward */}
      <div className="flex gap-3 pt-2 border-t border-navy-600">
        <button
          type="button"
          onClick={() => {
            setError('')
            setStep('input')
          }}
          disabled={loading}
          className="flex-1 px-4 py-2 rounded-lg font-semibold border border-navy-600 text-navy-200 hover:bg-navy-700 hover:text-white disabled:opacity-50 transition"
        >
          ← Back to edit
        </button>
        <Button
          type="button"
          onClick={handleGenerate}
          loading={loading}
          disabled={loading}
          className="flex-[2]"
        >
          {loading
            ? 'Generating your documents...'
            : selectedCount > 0
              ? `Generate with ${selectedCount} highlight${selectedCount === 1 ? '' : 's'} →`
              : 'Generate from full library →'}
        </Button>
      </div>
    </div>
  )
}
