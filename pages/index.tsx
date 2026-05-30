import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()

  const handleGetStarted = () => {
    router.push('/auth/signup')
  }

  return (
    <>
      <Head>
        <title>justapply.eu - Your AI-Powered Job Search OS</title>
        <meta name="description" content="Build your professional story. Document your achievements, timeline, and skills in one place — then generate tailored applications in minutes." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>

      <div className="bg-white text-dark">
        {/* Navigation */}
        <nav className="fixed w-full bg-white border-b border-gray-100 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
            <img src="/logo-light.svg" alt="justapply" className="h-12" />
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
              Know what to say about yourself.
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Whether you're a student with projects, switching careers, or have years of experience, the problem is the same. You don't know how to talk about what you've done. justapply learns your story and helps you articulate it for every job you apply to.
            </p>
            <button
              onClick={handleGetStarted}
              className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition inline-block"
            >
              Get Started
            </button>
          </div>
        </section>

        {/* The Problem / The Reality */}
        <section className="py-20 bg-light px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-16">The real bottleneck</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
              <div className="p-8 bg-white rounded-lg border border-gray-200">
                <p className="text-6xl font-bold mb-2" style={{color: '#FE6F09'}}>43%</p>
                <p className="text-lg text-gray-600">of candidates spend 30+ minutes on a single application</p>
              </div>
              <div className="p-8 bg-white rounded-lg border border-gray-200">
                <p className="text-6xl font-bold mb-2" style={{color: '#90055D'}}>51</p>
                <p className="text-lg text-gray-600">resumes needed on average to secure one job offer</p>
              </div>
              <div className="p-8 bg-white rounded-lg border border-gray-200">
                <p className="text-6xl font-bold mb-2" style={{color: '#FE6F09'}}>2-3%</p>
                <p className="text-lg text-gray-600">of sent resumes result in an interview</p>
              </div>
            </div>
            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
              You're not applying for fewer jobs because you're lazy. You're applying for fewer jobs because every application feels like you have to craft something perfect from scratch. The friction stops you before you even start.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-4">Build your career story once</h2>
            <p className="text-xl text-gray-600 text-center mb-16">
              Then call upon it whenever you find a role that matters.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="bg-light p-8 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">It's not just pasting CVs and cover letters</h3>
                <p className="text-gray-600">
                  Upload past CVs, cover letters, projects you've built, internships, volunteer work. justapply asks questions about what you learned and what you accomplished. Because your value isn't just what's on a CV.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-light p-8 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">Paste the job</h3>
                <p className="text-gray-600">
                  Paste the job description. Our AI matches it with your experience and tailors your application to highlight what matters most to that role.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-light p-8 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold">Just Apply</h3>
              </div>
            </div>
          </div>
        </section>

        {/* Why justapply */}
        <section className="py-20 bg-light px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">Why justapply works</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex gap-4 p-4 rounded-lg" style={{borderLeft: '4px solid #FE6F09', backgroundColor: 'rgba(254, 111, 9, 0.03)'}}>
                <div className="flex-shrink-0 w-6 h-6 text-blue-600 mt-1">✓</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">You only describe yourself once</h3>
                  <p className="text-gray-600">Upload your CV or paste your experience. Tell us what you've learned and accomplished. Then let it work for every application. No more starting from scratch.</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-lg" style={{borderLeft: '4px solid #90055D', backgroundColor: 'rgba(144, 5, 93, 0.03)'}}>
                <div className="flex-shrink-0 w-6 h-6 text-blue-600 mt-1">✓</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Perfect for every role</h3>
                  <p className="text-gray-600">Paste the job description. We'll find what's relevant to that specific role and tailor your CV and cover letter. You're not generic. Your application shouldn't be either.</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-lg" style={{borderLeft: '4px solid #FE6F09', backgroundColor: 'rgba(254, 111, 9, 0.03)'}}>
                <div className="flex-shrink-0 w-6 h-6 text-blue-600 mt-1">✓</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Actually relevant</h3>
                  <p className="text-gray-600">Your application shows exactly why you're a fit for that job. Not buzzwords. Not fluff. Just your actual experience, skills, and impact—packaged in a way that matters to them.</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-lg" style={{borderLeft: '4px solid #90055D', backgroundColor: 'rgba(144, 5, 93, 0.03)'}}>
                <div className="flex-shrink-0 w-6 h-6 text-blue-600 mt-1">✓</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Faster. Better. Less stress.</h3>
                  <p className="text-gray-600">No more hours spent on one cover letter. No more wondering if you're "qualified enough." Apply to more jobs, faster, with confidence that your application is actually good.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Waitlist CTA */}
        <section id="waitlist" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to actually apply for the jobs you want?</h2>
            <p className="text-lg text-gray-600 mb-8">
              Join the early waitlist. We're building justapply for everyone tired of spending hours perfecting CVs instead of chasing opportunities.
            </p>

            <button
              onClick={handleGetStarted}
              className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition inline-block"
            >
              Get Started
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-dark text-white py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
              <img src="/logo-dark.svg" alt="justapply" className="h-12 mb-4 md:mb-0" />
            </div>
            <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
              <p>© 2026 justapply.eu. Your operating system for job search.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
