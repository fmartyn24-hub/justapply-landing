import { useEffect, useMemo, useState } from 'react'
import { matchComponentsToPosting, type MatchableComponent } from '@/lib/componentMatch'

interface InterviewPrepProps {
  applicationId?: string
  jobTitle: string
  company: string
  jobDescription: string
  personsOfInterest?: string
  components: MatchableComponent[]
  onEditDetails: () => void
}

const STANDARD_QUESTIONS = [
  { q: 'Tell me about yourself.', tip: 'Two minutes: where you are now, the one or two things that got you here, and why this role is the next step.' },
  { q: 'Why this company?', tip: 'Name something specific: a product, a decision they made, a value you saw in how they work.' },
  { q: 'Why this role?', tip: 'Connect what the role needs with what you have done and what you want to do more of.' },
  { q: 'Tell me about a time something went wrong.', tip: 'Pick a real one. Spend most of the answer on what you did and what you learned.' },
  { q: 'What are your salary expectations?', tip: 'Decide a range before the interview, based on the role, the location and your experience.' },
]

const QUESTIONS_TO_ASK = [
  'What would success look like in the first six months?',
  'What is the biggest challenge the team is facing right now?',
  'How does this role work with the rest of the organisation?',
  'What do people who do well here have in common?',
  'What are the next steps in the process, and when should I expect to hear back?',
]

function usePrepChecklist(applicationId?: string) {
  const key = applicationId ? `justapply-prep-${applicationId}` : null
  const [done, setDone] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!key) return
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) setDone(JSON.parse(raw))
    } catch {
      // Storage unavailable: the checklist just won't persist.
    }
  }, [key])

  const toggle = (id: string) =>
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      try {
        if (key) window.localStorage.setItem(key, JSON.stringify(next))
      } catch {}
      return next
    })

  return { done, toggle }
}

function CheckRow({ id, done, onToggle, children }: { id: string; done: boolean; onToggle: (id: string) => void; children: React.ReactNode }) {
  return (
    <label className={`flex gap-3 rounded-lg border p-3 cursor-pointer transition ${done ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-navy-700 bg-navy-900 hover:border-navy-500'}`}>
      <input type="checkbox" checked={done} onChange={() => onToggle(id)} className="mt-1 h-4 w-4 flex-shrink-0" />
      <div className={`min-w-0 text-sm ${done ? 'text-navy-400' : 'text-navy-100'}`}>{children}</div>
    </label>
  )
}

// Shown on an application once it reaches the interview stage: stories to
// prepare from the user's best-fit components, likely questions on the gaps,
// standard questions, and questions to ask. All built from data already saved.
export function InterviewPrep({
  applicationId,
  jobTitle,
  company,
  jobDescription,
  personsOfInterest,
  components,
  onEditDetails,
}: InterviewPrepProps) {
  const { done, toggle } = usePrepChecklist(applicationId)
  const fit = useMemo(
    () => matchComponentsToPosting(jobDescription, components, { exclude: [company] }),
    [jobDescription, components, company]
  )
  const stories = fit.matches.slice(0, 4)
  const gaps = fit.keywords.filter((k) => !k.covered).slice(0, 4)
  const total = stories.length + gaps.length + STANDARD_QUESTIONS.length
  const completed = Object.values(done).filter(Boolean).length

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-purple-300">Interview prep</p>
        <h3 className="text-xl font-semibold text-white mt-1">
          {jobTitle || 'This role'}
          {company ? ` at ${company}` : ''}
        </h3>
        <p className="text-sm text-navy-300 mt-1">
          Tick things off as you prepare. {completed} of {total} done.
        </p>
      </div>

      {!jobDescription.trim() ? (
        <div className="rounded-lg border border-dashed border-navy-600 p-4 text-sm text-navy-300">
          Add the job description in{' '}
          <button onClick={onEditDetails} className="text-blue-400 font-semibold hover:underline">
            Details
          </button>{' '}
          and we&apos;ll pick the stories from your library you should have ready.
        </div>
      ) : (
        <>
          <section>
            <h4 className="font-semibold text-white">Stories to have ready</h4>
            <p className="text-sm text-navy-400 mt-1 mb-3">
              Your best fits for this posting. For each one, prepare the situation, what you did, and the result,
              with a number if you can.
            </p>
            {stories.length === 0 ? (
              <p className="text-sm text-navy-300">
                Nothing in your library matches this posting yet. Add the experience you&apos;d talk about.
              </p>
            ) : (
              <div className="space-y-2">
                {stories.map((m) => (
                  <CheckRow key={m.component.id} id={`story-${m.component.id}`} done={!!done[`story-${m.component.id}`]} onToggle={toggle}>
                    <p className="font-medium text-white">
                      {m.component.title}
                      {m.component.organization_name && <span className="text-navy-400 font-normal"> · {m.component.organization_name}</span>}
                    </p>
                    {m.component.impact_metrics && <p className="text-xs text-navy-300 mt-0.5">{m.component.impact_metrics}</p>}
                    <p className="text-xs text-navy-400 mt-1">Relevant because the posting mentions {m.matchedWords.slice(0, 3).join(', ')}.</p>
                  </CheckRow>
                ))}
              </div>
            )}
          </section>

          {gaps.length > 0 && (
            <section>
              <h4 className="font-semibold text-white">Questions they may ask about gaps</h4>
              <p className="text-sm text-navy-400 mt-1 mb-3">
                The posting mentions these, and your library doesn&apos;t yet. Have an honest answer ready.
              </p>
              <div className="space-y-2">
                {gaps.map((g) => (
                  <CheckRow key={g.stem} id={`gap-${g.stem}`} done={!!done[`gap-${g.stem}`]} onToggle={toggle}>
                    &ldquo;What experience do you have with {g.word}?&rdquo;
                    <span className="block text-xs text-navy-400 mt-0.5">
                      Closest example you have, or how you&apos;d get up to speed quickly.
                    </span>
                  </CheckRow>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <section>
        <h4 className="font-semibold text-white mb-3">Questions almost every interview asks</h4>
        <div className="space-y-2">
          {STANDARD_QUESTIONS.map((s, i) => (
            <CheckRow key={s.q} id={`std-${i}`} done={!!done[`std-${i}`]} onToggle={toggle}>
              <span className="font-medium text-white">{s.q}</span>
              <span className="block text-xs text-navy-400 mt-0.5">{s.tip}</span>
            </CheckRow>
          ))}
        </div>
      </section>

      <section>
        <h4 className="font-semibold text-white">Questions to ask them</h4>
        <ul className="mt-3 space-y-1.5 text-sm text-navy-200">
          {QUESTIONS_TO_ASK.map((q) => (
            <li key={q} className="flex gap-2">
              <span className="text-purple-300">?</span>
              {q}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h4 className="font-semibold text-white">Who you&apos;ll meet</h4>
        {personsOfInterest?.trim() ? (
          <p className="text-sm text-navy-200 whitespace-pre-wrap mt-2">{personsOfInterest}</p>
        ) : (
          <p className="text-sm text-navy-400 mt-2">
            Add your interviewers in{' '}
            <button onClick={onEditDetails} className="text-blue-400 font-semibold hover:underline">
              Details
            </button>{' '}
            and look them up on LinkedIn beforehand.
          </p>
        )}
      </section>
    </div>
  )
}
