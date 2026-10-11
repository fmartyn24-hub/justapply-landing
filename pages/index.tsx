import Head from 'next/head'
import Link from 'next/link'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Inter, Instrument_Serif } from 'next/font/google'
import { track } from '@vercel/analytics'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

const SITE_URL = 'https://www.justapply.eu'
const SIGNUP = '/auth/signup'
const LOGIN = '/auth/login'
const TITLE = 'JustApply: tailored job applications from your career library'
const DESCRIPTION =
  'Build a library of everything you have done, see which parts fit each job you apply for, and write specific CVs and cover letters in minutes. Free account, no card needed.'

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

const LIBRARY_POINTS = [
  {
    title: 'Capture everything once',
    body: 'Roles, projects, achievements with real numbers, education, volunteering, skills. Upload your CV and we’ll read it into draft entries for you to check.',
  },
  {
    title: 'See what fits each job',
    body: 'Paste a posting and your library is ranked against it: which experiences fit best, the exact words they share, and the keywords you haven’t covered yet.',
  },
  {
    title: 'Use it everywhere',
    body: 'Your best-fit experiences flow into cover letter templates, CV tweaks and interview prep. Improve the library once, and every application gets better.',
  },
]

const LIBRARY_TIPS = [
  'Put a number on it: “grew sign-ups 40%” beats “grew sign-ups”.',
  'One achievement per entry, so each can be picked on its own.',
  'Include the unpaid stuff: societies, volunteering, side projects.',
  'Name the tools and methods you used. Postings name them too.',
]

const STEPS = [
  {
    n: '01',
    title: 'Build your career library',
    body: 'Upload your CV to get a head start, then add the things it leaves out: the context, the numbers, the projects you’re proud of.',
  },
  {
    n: '02',
    title: 'Paste the job you want',
    body: 'See which parts of your story speak to what this employer is asking for, and which of their keywords you haven’t shown yet.',
  },
  {
    n: '03',
    title: 'Apply, then track it',
    body: 'Write your cover letter from a template filled with your best-fit experience, export to Word or PDF, and follow it to an offer, with interview prep when you get there.',
  },
]

const FREE_FEATURES = [
  'Career library and visual timeline',
  'CV import: we read your CV into draft entries, no AI needed',
  'Job fit preview: which experiences match a posting, and the gaps',
  'Cover letter templates filled with your best-fit experience',
  'Application tracker with list and board views',
  'Interview prep built from the posting and your library',
  'Export to Word, PDF, ODT and plain text',
]

const AI_FEATURES = [
  'Match analysis that understands meaning, not just shared words',
  'First-draft cover letters in your own voice',
  'Specific, line-by-line advice for your existing CV',
  'Import from several documents at once, including your writing style',
]

const AUDIENCES = [
  {
    title: 'Students & graduates',
    body: 'Your projects, internships, societies and part-time jobs are real experience. JustApply helps you see it, and say it.',
  },
  {
    title: 'Career switchers',
    body: 'See which of your experiences transfer to the field you’re moving into, and the gaps worth filling first.',
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
    body: 'You check what goes into your library and what goes into each application. Edit anything, any time.',
  },
]

const FAQ = [
  {
    q: 'What is JustApply?',
    a: 'JustApply is a job search workspace built around a career library: a structured record of everything you have done. For each job you apply to, it shows which parts of your library fit, helps you write a specific cover letter and CV, and tracks the application from draft to offer.',
  },
  {
    q: 'Is JustApply free?',
    a: 'Yes. Create a free account, no card needed. The free plan includes the career library, CV import, job fit preview, cover letter templates, the application tracker, interview prep and exports. AI features are in beta and will be an optional upgrade.',
  },
  {
    q: 'Why is the career library so important?',
    a: 'Because every application is only as good as the evidence behind it. The more specific your library, with real numbers and the tools you used, the better JustApply can match you to a job and the stronger each application becomes.',
  },
  {
    q: 'Does JustApply apply to jobs for me?',
    a: 'No, and that’s deliberate. Mass auto-applying is a big part of why recruiters are overwhelmed and candidates get ghosted. JustApply helps you send fewer, more specific applications that show why you fit each role.',
  },
  {
    q: 'What are the AI features, and when are they coming?',
    a: 'AI features, like first-draft cover letters in your voice and line-by-line CV advice, are in private beta. Leave your email on this page and we’ll invite you as we open them up.',
  },
  {
    q: 'Who is JustApply for?',
    a: 'Anyone who finds it hard to talk about what they’ve done: students and recent graduates, people changing careers, and experienced professionals who need to pick the right evidence for each role.',
  },
  {
    q: 'Can I export my CV and cover letter?',
    a: 'Yes. Cover letters can be exported to Word (.docx), PDF, OpenDocument (.odt) and plain text, using clean, recruiter-friendly templates.',
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
      featureList: FREE_FEATURES,
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

function SignupButton({ location, children, className = '' }: { location: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={SIGNUP}
      onClick={() => track('Signup Click', { location })}
      className={`inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-primary text-white font-semibold hover:bg-[#0049e0] transition ${className}`}
    >
      {children}
    </Link>
  )
}

// Email capture for the AI beta (stored in the `emails` table via /api/subscribe).
function AiWaitlistForm({ location }: { location: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: FormEvent) => {
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
      track('AI Waitlist Signup', { location })
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <p role="status" className="rounded-xl bg-white/10 px-4 py-3 text-sm text-white">
        You’re on the list. We’ll invite you as AI features open up.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col sm:flex-row gap-2 p-1.5 rounded-2xl bg-white/10 ring-1 ring-white/15">
        <label htmlFor={`ai-email-${location}`} className="sr-only">
          Email address
        </label>
        <input
          id={`ai-email-${location}`}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-transparent text-base text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-5 py-3 rounded-xl bg-white text-ink font-semibold hover:bg-white/90 transition disabled:opacity-60 whitespace-nowrap"
        >
          {status === 'loading' ? 'Joining…' : 'Get early access'}
        </button>
      </div>
      {status === 'error' && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  )
}

function SourceRef({ id }: { id: number }) {
  return (
    <a
      href={`#source-${id}`}
      className="align-super text-[0.3em] font-medium text-current opacity-50 ml-1 tracking-normal hover:opacity-100"
    >
      [{id}]
    </a>
  )
}

function Check({ className = 'text-primary' }: { className?: string }) {
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

// Illustrative product mock built in HTML: the library, ranked against a job.
function HeroMock() {
  const library = [
    { type: 'Achievement', title: 'Grew newsletter to 18k subscribers', meta: '+240% in 14 months', fit: 'Strong fit' },
    { type: 'Role', title: 'Marketing Coordinator', meta: 'Northwind · 2022 – Present', fit: 'Strong fit' },
    { type: 'Skill', title: 'Campaign analytics', meta: 'GA4, Looker Studio', fit: 'Good fit' },
    { type: 'Project', title: 'Relaunched student society website', meta: 'Volunteer · 2021', fit: null },
  ]
  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-grid rounded-[2rem]" aria-hidden="true" />
      <div className="relative grid grid-cols-1 gap-4 min-w-0">
        <div className="bg-white rounded-2xl p-5 ring-1 ring-ink/10 shadow-xl shadow-ink/5 sm:mr-10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/50">Applying to</p>
          <p className="font-semibold mt-1">Growth Marketing Manager · Fabrikam</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {['✓ email', '✓ newsletter', '✓ analytics', 'lifecycle', 'SQL'].map((k) => (
              <span
                key={k}
                className={`text-xs px-2.5 py-1 rounded-full ${
                  k.startsWith('✓') ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'ring-1 ring-dashed ring-ink/20 text-ink/50'
                }`}
              >
                {k}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-ink text-white rounded-2xl p-5 shadow-xl shadow-ink/10">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">Your library, ranked for this job</p>
            <span className="text-xs text-white/50">24 entries</span>
          </div>
          <ol className="space-y-2">
            {library.map((c, i) => (
              <li
                key={c.title}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${c.fit ? 'bg-primary/20 ring-1 ring-primary/50' : 'bg-white/5 opacity-60'}`}
              >
                <span className="text-xs text-white/40 w-3">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium truncate">{c.title}</span>
                  <span className="block text-xs text-white/50 truncate">
                    {c.type} · {c.meta}
                  </span>
                </span>
                {c.fit && (
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 flex-shrink-0 ${
                      c.fit === 'Strong fit' ? 'bg-emerald-400/20 text-emerald-200' : 'bg-white/10 text-blue-200'
                    }`}
                  >
                    {c.fit}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div className={`${inter.variable} ${serif.variable} font-landing bg-paper text-ink min-h-screen`}>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={`${SITE_URL}/`} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} />
      </Head>

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to content
      </a>

      {/* Navigation */}
      <header className="fixed top-0 inset-x-0 z-50 bg-paper/85 backdrop-blur border-b border-ink/5">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4" aria-label="Main">
          <a href="#top" aria-label="JustApply home" className="flex-shrink-0">
            <img src="/logo-light.svg" alt="JustApply" width={145} height={50} className="h-11 w-auto" />
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm text-ink/70">
            <a href="#library" className="hover:text-ink transition">Career library</a>
            <a href="#how-it-works" className="hover:text-ink transition">How it works</a>
            <a href="#pricing" className="hover:text-ink transition">Free vs AI</a>
            <a href="#faq" className="hover:text-ink transition">FAQ</a>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href={LOGIN} className="text-sm font-medium text-ink/70 hover:text-ink transition">
              Log in
            </Link>
            <Link
              href={SIGNUP}
              onClick={() => track('Signup Click', { location: 'nav' })}
              className="text-sm font-semibold px-4 py-2 rounded-xl bg-ink text-white hover:bg-ink/85 transition whitespace-nowrap"
            >
              Sign up free
            </Link>
          </div>
        </nav>
      </header>

      <main id="main">
        {/* Hero */}
        <section id="top" className="pt-28 sm:pt-36 pb-20 sm:pb-28 px-4 sm:px-6 overflow-hidden">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-14 lg:gap-16 items-center">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                Free account · No card needed
              </p>
              <h1 className="mt-6 text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-7xl font-semibold tracking-tight">
                Know what to say <span className="font-serif italic font-normal">about yourself.</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-ink/70 leading-relaxed max-w-xl">
                Build a library of everything you’ve done. For every job you apply to, JustApply shows which parts of
                your story fit best, so each application is specific, not generic.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
                <SignupButton location="hero">Create your free account</SignupButton>
                <a href="#library" className="text-center px-6 py-3.5 rounded-xl font-semibold text-ink/80 ring-1 ring-ink/15 hover:bg-white transition">
                  See how it works
                </a>
              </div>
              <p className="mt-3 text-sm text-ink/50">Free plan. No credit card. Takes about a minute.</p>
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
                Volume is losing. <span className="font-serif italic font-normal text-[#A9C2FF]">Specificity is winning.</span>
              </h2>
              <p className="mt-6 text-lg text-white/70 leading-relaxed">
                AI made it effortless to send a hundred generic applications. Recruiters are drowning in them, and
                candidates are getting ghosted. The applications that still get through are the ones that show, with
                real evidence, why <em>this</em> person fits <em>this</em> role.
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

        {/* Career library */}
        <section id="library" className="px-4 sm:px-6 py-20 sm:py-28" aria-labelledby="library-heading">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Your career library</p>
              <h2 id="library-heading" className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.08]">
                The better your library, <span className="font-serif italic font-normal">the better every application.</span>
              </h2>
              <p className="mt-5 text-lg text-ink/65 leading-relaxed">
                Your library is the engine of JustApply. It holds the evidence of what you can do, and every
                application draws from it. Put the work in once, and it pays back every time you apply.
              </p>
            </div>
            <div className="mt-12 grid md:grid-cols-3 gap-5">
              {LIBRARY_POINTS.map((p, i) => (
                <div key={p.title} className="bg-white rounded-2xl p-7 ring-1 ring-ink/10">
                  <p className="font-serif italic text-4xl text-primary">0{i + 1}</p>
                  <h3 className="mt-6 text-xl font-semibold">{p.title}</h3>
                  <p className="mt-3 text-ink/65 leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-ink text-white p-7 sm:p-8 grid md:grid-cols-[1fr_2fr] gap-6">
              <div>
                <h3 className="text-xl font-semibold">What makes a strong library</h3>
                <p className="mt-2 text-white/60 text-sm">Small habits that make the job fit preview, and your applications, sharper.</p>
              </div>
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                {LIBRARY_TIPS.map((t) => (
                  <li key={t} className="flex gap-3 text-white/85 text-sm leading-relaxed">
                    <Check className="text-[#7FA6FF]" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="bg-white border-y border-ink/5 px-4 sm:px-6 py-20 sm:py-28" aria-labelledby="how-heading">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">How it works</p>
              <h2 id="how-heading" className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.08]">
                Describe yourself once. <span className="font-serif italic font-normal">Use it everywhere.</span>
              </h2>
            </div>
            <ol className="mt-14 grid md:grid-cols-3 gap-5">
              {STEPS.map((s) => (
                <li key={s.n} className="bg-paper rounded-2xl p-7">
                  <p className="font-serif italic text-4xl text-primary">{s.n}</p>
                  <h3 className="mt-6 text-xl font-semibold">{s.title}</h3>
                  <p className="mt-3 text-ink/65 leading-relaxed">{s.body}</p>
                </li>
              ))}
            </ol>
            <div className="mt-10">
              <SignupButton location="how-it-works">Start your library, free</SignupButton>
            </div>
          </div>
        </section>

        {/* Free vs AI */}
        <section id="pricing" className="px-4 sm:px-6 py-20 sm:py-28" aria-labelledby="pricing-heading">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Free vs AI</p>
              <h2 id="pricing-heading" className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.08]">
                Everything you need to apply well, <span className="font-serif italic font-normal">free.</span>
              </h2>
              <p className="mt-5 text-lg text-ink/65 leading-relaxed">
                There’s always a free way to use JustApply. AI features are in beta; leave your email to get early
                access as they open up.
              </p>
            </div>
            <div className="mt-12 grid lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl p-7 sm:p-8 ring-1 ring-ink/10 flex flex-col">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-2xl font-semibold">Free</h3>
                  <p className="text-ink/60">€0</p>
                </div>
                <ul className="mt-6 space-y-3 flex-1">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex gap-3 text-ink/80">
                      <Check />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <SignupButton location="pricing" className="mt-8 w-full">
                  Create your free account
                </SignupButton>
              </div>
              <div id="ai" className="bg-ink text-white rounded-2xl p-7 sm:p-8 relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/40 blur-3xl" aria-hidden="true" />
                <div className="relative">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-2xl font-semibold">With AI</h3>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#A9C2FF] bg-white/10 px-2.5 py-1 rounded-full">
                      Early access
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
                  <div className="mt-8">
                    <p className="text-sm text-white/70 mb-3">Get an invite when AI features open up:</p>
                    <AiWaitlistForm location="pricing" />
                  </div>
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
                Wherever you are in your career, the hard part is the same: knowing which parts of your story matter
                for this role, and saying them well.
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
            <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-primary/35 blur-3xl" aria-hidden="true" />
            <div className="relative max-w-2xl">
              <h2 id="join-heading" className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.08]">
                Apply for the jobs you actually want.{' '}
                <span className="font-serif italic font-normal text-[#A9C2FF]">With confidence.</span>
              </h2>
              <p className="mt-5 text-lg text-white/70">
                Start your career library today. It’s free, and every entry you add makes your next application
                stronger.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
                <SignupButton location="footer-cta">Create your free account</SignupButton>
                <Link href={LOGIN} className="text-center px-6 py-3.5 rounded-xl font-semibold text-white/80 ring-1 ring-white/20 hover:bg-white/10 transition">
                  I already have an account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-4 sm:px-6 pb-12">
        <div className="max-w-6xl mx-auto border-t border-ink/10 pt-10 grid md:grid-cols-[1fr_2fr] gap-10">
          <div>
            <img src="/logo-light.svg" alt="JustApply" width={145} height={50} className="h-11 w-auto" />
            <p className="mt-4 text-sm text-ink/55">The job search workspace that helps you tell your story.</p>
            <div className="mt-6 flex gap-4 text-sm text-ink/55">
              <Link href={SIGNUP} className="hover:text-ink">Sign up</Link>
              <Link href={LOGIN} className="hover:text-ink">Log in</Link>
              <Link href="/terms" className="hover:text-ink">Terms</Link>
            </div>
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
    </div>
  )
}
