import Head from 'next/head'
import { useState } from 'react'
import { track } from '@vercel/analytics'

const SITE_URL = 'https://www.justapply.eu'
const TITLE = 'JustApply — Tailored job applications from your real career story'
const DESCRIPTION =
  'JustApply turns your experience into a reusable career library, then helps you write specific, tailored CVs and cover letters for every job, and track every application in one place. Free to start.'

// Every number on the page comes from a named, linkable source. Keep it that way:
// unsourced stats are the fastest way to lose a sceptical job seeker's trust.
const SOURCES = [
  {
    id: 1,
    label: 'LinkedIn figures reported by Ars Technica, June 2025 (summary by CO/AI)',
    url: 'https://getcoai.com/news/ai-job-applications-flood-linkedin-with-11000-per-minute/',
  },
  {
    id: 2,
    label: 'Huntr, Job Search Trends Report Q3 2025 (375,000 applications tracked)',
    url: 'https://huntr.co/research/job-search-trends-q3-2025',
  },
  {
    id: 3,
    label: 'Greenhouse, 2025 Workforce & Hiring Report (2,200 job seekers, US/UK/IE)',
    url: 'https://cdn.prod.website-files.com/66bf84e70c6fc57dbbe0187e/687530e016ce4153b861335b_Greenhouse_2025WorkforceAndHiringReport.pdf',
  },
  {
    id: 4,
    label: 'ResumeGo field experiment, 7,287 applications (2019–2020)',
    url: 'https://www.resumego.net/research/cover-letters/',
  },
]

const STATS = [
  {
    value: '11,000',
    label: 'applications sent on LinkedIn every minute, up 45% in a year as AI tools make mass-applying effortless.',
    source: 1,
  },
  {
    value: '2×',
    label: 'more interviews for tailored CVs: 5.95% of tailored applications reached interview or offer, vs 2.9% for generic ones.',
    source: 2,
  },
  {
    value: '53%',
    label: 'higher callback rate when a cover letter is written for the specific job, compared with no cover letter.',
    source: 4,
  },
  {
    value: '63%',
    label: 'of US candidates were ghosted after a job interview. Without a system, it’s easy to lose track of where you stand.',
    source: 3,
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Build your career library once',
    body: 'Add your roles, projects, achievements, education, volunteering and skills as reusable building blocks. Not just what’s on your CV: the context, the numbers, the things you’re proud of.',
  },
  {
    n: '02',
    title: 'Paste the job you want',
    body: 'Drop in any job description. See which parts of your story speak to what this employer is actually asking for, and choose what to put front and centre.',
  },
  {
    n: '03',
    title: 'Apply with specifics, then track it',
    body: 'Write a cover letter grounded in your real experience, get concrete advice on what to adjust in your CV, export to Word or PDF, and follow every application from draft to offer.',
  },
]

const FREE_FEATURES = [
  'Career library: roles, projects, achievements, skills, education',
  'Visual career timeline',
  'CV storage, with every version in one place',
  'Application tracker with list and board views',
  'Deadlines, links and contacts for every role',
  'Job fit preview: see which of your experiences match a posting',
  'Export cover letters to Word, PDF, ODT and plain text',
]

const AI_FEATURES = [
  'Import your CV and have your library built for you',
  'Match analysis: what this employer wants, and where you fit',
  'Cover letters drafted from your library, in your own voice',
  'Specific, line-by-line advice for your existing CV',
]

const AUDIENCES = [
  {
    title: 'Students & graduates',
    body: 'Your projects, internships, societies and part-time jobs are real experience. JustApply helps you see it, and say it.',
  },
  {
    title: 'Career switchers',
    body: 'Translate what you’ve done into the language of the field you’re moving into, without starting from a blank page.',
  },
  {
    title: 'Experienced professionals',
    body: 'Years of work, too much to fit on two pages. Pick the right evidence for each role in minutes, not evenings.',
  },
]

const PRINCIPLES = [
  {
    title: 'Not an auto-apply bot',
    body: 'Firing off hundreds of identical applications is why inboxes are drowning. JustApply helps you send fewer, better ones.',
  },
  {
    title: 'Your story, not a template',
    body: 'Everything starts from your own library: your roles, your numbers, your voice. Nothing is invented on your behalf.',
  },
  {
    title: 'You stay in control',
    body: 'You review what goes into your library and what goes into each application. Edit anything, any time.',
  },
]

const FAQ = [
  {
    q: 'What is JustApply?',
    a: 'JustApply is a job search workspace. You build a library of your experience once (roles, projects, achievements, skills), then use it to write tailored CVs and cover letters for each job you apply to, and track every application from draft to offer.',
  },
  {
    q: 'Is JustApply free?',
    a: 'Yes, there is a free plan. Today it includes the career library, timeline, CV storage, application tracker, job fit preview and document exports. AI-powered features, like importing your CV automatically and drafting tailored cover letters, are in beta and will be offered as an optional upgrade.',
  },
  {
    q: 'Does JustApply apply to jobs for me?',
    a: 'No, and that’s deliberate. Mass auto-applying is a big part of why recruiters are overwhelmed and candidates get ghosted. JustApply helps you send fewer, more specific applications that show why you fit each role.',
  },
  {
    q: 'Will my applications sound like they were written by AI?',
    a: 'JustApply works from your own career library and the job description, never from a generic template. You choose which experiences to highlight, and you edit the final text. The goal is an application that sounds like you on a good day.',
  },
  {
    q: 'Who is JustApply for?',
    a: 'Anyone who finds it hard to talk about what they’ve done: students and recent graduates, people changing careers, and experienced professionals who need to pick the right evidence for each role.',
  },
  {
    q: 'What is a career library?',
    a: 'A career library is a structured collection of everything you’ve done: jobs, projects, achievements with real numbers, education, certifications, volunteering and skills. Instead of rewriting your experience for every application, you pick from it.',
  },
  {
    q: 'Can I export my CV and cover letter?',
    a: 'Yes. Cover letters can be exported to Word (.docx), PDF, OpenDocument (.odt) and plain text, using clean, recruiter-friendly templates.',
  },
  {
    q: 'When can I start using JustApply?',
    a: 'We’re opening access in waves. Join the waitlist with your email and we’ll let you know as soon as your spot is ready.',
  },
]

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'JustApply',
      url: SITE_URL,
      logo: `${SITE_URL}/apple-touch-icon.png`,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'JustApply',
      description: DESCRIPTION,
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en',
    },
    {
      '@type': 'SoftwareApplication',
      name: 'JustApply',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: SITE_URL,
      description: DESCRIPTION,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      featureList: [...FREE_FEATURES, ...AI_FEATURES],
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ],
}

function WaitlistForm({ location, dark = false }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!response.ok) throw new Error('subscribe failed')
      setStatus('success')
      setEmail('')
      track('Waitlist Signup', { location })
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div
        role="status"
        className={`rounded-2xl px-5 py-4 text-left ${dark ? 'bg-white/10 text-white' : 'bg-white text-ink ring-1 ring-ink/10'}`}
      >
        <p className="font-semibold">You’re on the list.</p>
        <p className={`text-sm mt-0.5 ${dark ? 'text-white/70' : 'text-ink/60'}`}>
          We’ll email you as soon as your spot opens up.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={`flex flex-col sm:flex-row gap-2 p-1.5 rounded-2xl ${
          dark ? 'bg-white/10 ring-1 ring-white/15' : 'bg-white ring-1 ring-ink/10 shadow-sm'
        }`}
      >
        <label htmlFor={`email-${location}`} className="sr-only">
          Email address
        </label>
        <input
          id={`email-${location}`}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={`flex-1 min-w-0 px-4 py-3 rounded-xl bg-transparent text-base focus:outline-none focus:ring-2 focus:ring-primary ${
            dark ? 'text-white placeholder-white/50' : 'text-ink placeholder-ink/40'
          }`}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-[#0049e0] transition disabled:opacity-60 whitespace-nowrap"
        >
          {status === 'loading' ? 'Joining…' : 'Join the waitlist'}
        </button>
      </div>
      {status === 'error' && (
        <p role="alert" className={`mt-2 text-sm ${dark ? 'text-red-300' : 'text-red-600'}`}>
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  )
}

function SourceRef({ id }) {
  return (
    <a href={`#source-${id}`} className="align-super text-[0.3em] font-medium text-current opacity-50 ml-1 tracking-normal hover:opacity-100">
      [{id}]
    </a>
  )
}

function Check({ className = 'text-primary' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={`w-5 h-5 flex-shrink-0 ${className}`}>
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.58l7.3-7.3a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

// Illustrative product mock built in HTML (no screenshot asset to keep in sync).
function HeroMock() {
  const library = [
    { type: 'Role', title: 'Marketing Coordinator', meta: 'Northwind · 2022 – Present' },
    { type: 'Achievement', title: 'Grew newsletter to 18k subscribers', meta: '+240% in 14 months' },
    { type: 'Project', title: 'Relaunched student society website', meta: 'Volunteer · 2021' },
    { type: 'Skill', title: 'Campaign analytics', meta: 'GA4, Looker Studio' },
  ]
  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-grid rounded-[2rem]" aria-hidden="true" />
      <div className="relative grid grid-cols-1 gap-4 min-w-0">
        <div className="bg-ink text-white rounded-2xl p-5 shadow-xl shadow-ink/10">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">Your career library</p>
            <span className="text-xs text-white/50">24 components</span>
          </div>
          <ul className="space-y-2">
            {library.map((c, i) => (
              <li
                key={c.title}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                  i === 1 || i === 3 ? 'bg-primary/25 ring-1 ring-primary/60' : 'bg-white/5'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50 w-20 flex-shrink-0">
                  {c.type}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium truncate">{c.title}</span>
                  <span className="block text-xs text-white/50 truncate">{c.meta}</span>
                </span>
                {(i === 1 || i === 3) && <Check className="text-[#7FA6FF] ml-auto" />}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-2xl p-5 ring-1 ring-ink/10 shadow-xl shadow-ink/5 sm:ml-10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/50">Applying to</p>
          <p className="font-semibold mt-1">Growth Marketing Manager · Fabrikam</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {['Email growth', 'Data-driven', 'Lifecycle', 'Stakeholders'].map((k) => (
              <span key={k} className="text-xs px-2.5 py-1 rounded-full bg-paper ring-1 ring-ink/10 text-ink/70">
                {k}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm text-ink/70 leading-relaxed">
            “…at Northwind I grew our newsletter from 5,000 to 18,000 subscribers in 14 months, using weekly
            cohort analysis to decide what to send next…”
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={`${SITE_URL}/`} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta
          name="keywords"
          content="tailored cover letter, CV builder, resume tailoring, job application tracker, job search tool, career library, cover letter generator, job search Europe"
        />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="JustApply" />
        <meta property="og:url" content={`${SITE_URL}/`} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="JustApply: know what to say about yourself." />
        <meta property="og:locale" content="en_GB" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
      </Head>

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to content
      </a>

      {/* Navigation */}
      <header className="fixed top-0 inset-x-0 z-50 bg-paper/85 backdrop-blur border-b border-ink/5">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between" aria-label="Main">
          <a href="#top" aria-label="JustApply home">
            <img src="/logo-light.svg" alt="JustApply" width="145" height="50" className="h-11 w-auto" />
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm text-ink/70">
            <a href="#how-it-works" className="hover:text-ink transition">How it works</a>
            <a href="#why" className="hover:text-ink transition">Why it works</a>
            <a href="#pricing" className="hover:text-ink transition">Free vs AI</a>
            <a href="#faq" className="hover:text-ink transition">FAQ</a>
          </div>
          <a
            href="#join"
            className="text-sm font-semibold px-4 py-2 rounded-xl bg-ink text-white hover:bg-ink/85 transition"
          >
            Get early access
          </a>
        </nav>
      </header>

      <main id="main">
        {/* Hero */}
        <section id="top" className="pt-28 sm:pt-36 pb-20 sm:pb-28 px-4 sm:px-6 overflow-hidden">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-14 lg:gap-16 items-center">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                Private beta · Free to start
              </p>
              <h1 className="mt-6 text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-7xl font-semibold tracking-tight">
                Know what to say <span className="font-serif italic font-normal">about yourself.</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-ink/70 leading-relaxed max-w-xl">
                JustApply turns everything you’ve done into a reusable career library, then helps you write a
                specific, tailored application for every job. No blank pages. No generic templates.
              </p>
              <div className="mt-8 max-w-lg">
                <WaitlistForm location="hero" />
                <p className="mt-3 text-sm text-ink/50">Free plan available. No credit card.</p>
              </div>
            </div>
            <HeroMock />
          </div>
        </section>

        {/* The market changed */}
        <section id="why" className="bg-ink text-white px-4 sm:px-6 py-20 sm:py-28" aria-labelledby="why-heading">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7FA6FF]">The job market changed</p>
              <h2 id="why-heading" className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.08]">
                Volume is losing.{' '}
                <span className="font-serif italic font-normal text-[#A9C2FF]">Specificity is winning.</span>
              </h2>
              <p className="mt-6 text-lg text-white/70 leading-relaxed">
                AI made it effortless to send a hundred generic applications. Recruiters are drowning in them,
                and candidates are getting ghosted. The applications that still get through are the ones that
                show, with real evidence, why <em>this</em> person fits <em>this</em> role.
              </p>
            </div>
            <dl className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden">
              {STATS.map((s) => (
                <div key={s.value} className="bg-ink p-6 sm:p-7">
                  <dt className="sr-only">{s.label}</dt>
                  <dd>
                    <p className="text-5xl font-semibold tracking-tight">
                      {s.value}
                      <SourceRef id={s.source} />
                    </p>
                    <p className="mt-3 text-sm text-white/65 leading-relaxed">{s.label}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="px-4 sm:px-6 py-20 sm:py-28" aria-labelledby="how-heading">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">How it works</p>
              <h2 id="how-heading" className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.08]">
                Describe yourself once.{' '}
                <span className="font-serif italic font-normal">Use it everywhere.</span>
              </h2>
            </div>
            <ol className="mt-14 grid md:grid-cols-3 gap-5">
              {STEPS.map((s) => (
                <li key={s.n} className="bg-white rounded-2xl p-7 ring-1 ring-ink/10">
                  <p className="font-serif italic text-4xl text-primary">{s.n}</p>
                  <h3 className="mt-6 text-xl font-semibold">{s.title}</h3>
                  <p className="mt-3 text-ink/65 leading-relaxed">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Free vs AI */}
        <section id="pricing" className="px-4 sm:px-6 pb-20 sm:pb-28" aria-labelledby="pricing-heading">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Free vs AI</p>
              <h2 id="pricing-heading" className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.08]">
                Everything you need to get organised, <span className="font-serif italic font-normal">free.</span>
              </h2>
              <p className="mt-5 text-lg text-ink/65 leading-relaxed">
                There’s always a free way to use JustApply. AI features are in beta and will be an optional upgrade
                for when you want to move faster.
              </p>
            </div>
            <div className="mt-12 grid lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl p-7 sm:p-8 ring-1 ring-ink/10">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-2xl font-semibold">Free</h3>
                  <p className="text-ink/60">€0</p>
                </div>
                <ul className="mt-6 space-y-3">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex gap-3 text-ink/80">
                      <Check />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-ink text-white rounded-2xl p-7 sm:p-8 relative overflow-hidden">
                <div
                  className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/40 blur-3xl"
                  aria-hidden="true"
                />
                <div className="relative">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-2xl font-semibold">With AI</h3>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#A9C2FF] bg-white/10 px-2.5 py-1 rounded-full">
                      In beta
                    </p>
                  </div>
                  <p className="mt-2 text-white/60">Everything in Free, plus:</p>
                  <ul className="mt-6 space-y-3">
                    {AI_FEATURES.map((f) => (
                      <li key={f} className="flex gap-3 text-white/85">
                        <Check className="text-[#7FA6FF]" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="bg-white px-4 sm:px-6 py-20 sm:py-28 border-y border-ink/5" aria-labelledby="who-heading">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Who it’s for</p>
              <h2 id="who-heading" className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.08]">
                You’ve done more than you think.
              </h2>
              <p className="mt-5 text-lg text-ink/65 leading-relaxed">
                Wherever you are in your career, the hard part is the same: knowing which parts of your story
                matter for this role, and saying them well.
              </p>
            </div>
            <div className="mt-12 grid md:grid-cols-3 gap-5">
              {AUDIENCES.map((a) => (
                <div key={a.title} className="rounded-2xl p-7 bg-paper">
                  <h3 className="text-xl font-semibold">{a.title}</h3>
                  <p className="mt-3 text-ink/65 leading-relaxed">{a.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-16 grid md:grid-cols-3 gap-8 border-t border-ink/10 pt-12">
              {PRINCIPLES.map((p) => (
                <div key={p.title}>
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="mt-2 text-ink/65 leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="px-4 sm:px-6 py-20 sm:py-28" aria-labelledby="faq-heading">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">FAQ</p>
            <h2 id="faq-heading" className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight">
              Questions, answered.
            </h2>
            <div className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
              {FAQ.map(({ q, a }) => (
                <details key={q} className="group py-5">
                  <summary className="flex items-center justify-between gap-6 cursor-pointer text-lg font-medium">
                    <h3>{q}</h3>
                    <span
                      className="flex-shrink-0 w-8 h-8 rounded-full ring-1 ring-ink/15 flex items-center justify-center text-ink/60 transition group-open:rotate-45"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-ink/65 leading-relaxed pr-12">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section id="join" className="px-4 sm:px-6 pb-20 sm:pb-28" aria-labelledby="join-heading">
          <div className="max-w-6xl mx-auto bg-ink text-white rounded-[2rem] px-6 py-16 sm:px-16 sm:py-20 relative overflow-hidden">
            <div
              className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-primary/35 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative max-w-2xl">
              <h2 id="join-heading" className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.08]">
                Apply for the jobs you actually want.{' '}
                <span className="font-serif italic font-normal text-[#A9C2FF]">With confidence.</span>
              </h2>
              <p className="mt-5 text-lg text-white/70">
                We’re letting people in from the waitlist in small groups. Leave your email and we’ll save you a
                spot.
              </p>
              <div className="mt-8 max-w-lg">
                <WaitlistForm location="footer-cta" dark />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-4 sm:px-6 pb-12">
        <div className="max-w-6xl mx-auto border-t border-ink/10 pt-10 grid md:grid-cols-[1fr_2fr] gap-10">
          <div>
            <img src="/logo-light.svg" alt="JustApply" width="145" height="50" className="h-11 w-auto" />
            <p className="mt-4 text-sm text-ink/55">The job search workspace that helps you tell your story.</p>
            <p className="mt-6 text-sm text-ink/45">© {new Date().getFullYear()} justapply.eu</p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/50">Sources</h2>
            <ol className="mt-4 space-y-2 text-sm text-ink/60">
              {SOURCES.map((s) => (
                <li key={s.id} id={`source-${s.id}`} className="flex gap-2">
                  <span className="text-ink/40">[{s.id}]</span>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline decoration-ink/20 hover:decoration-ink">
                    {s.label}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </footer>
    </>
  )
}
