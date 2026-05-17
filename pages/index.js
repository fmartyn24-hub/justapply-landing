import Head from 'next/head'
import { useState } from 'react'

export default function Home() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')

  const handleSubscribe = async (e) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setStatus('success')
        setEmail('')
        setTimeout(() => setStatus(''), 3000)
      } else {
        setStatus('error')
      }
    } catch (error) {
      setStatus('error')
    }
  }

  return (
    <>
      <Head>
        <title>justapply.eu - Your AI-Powered Job Search OS</title>
        <meta name="description" content="Apply smarter. Land your next role with AI-tailored CVs, cover letters, and a job search operating system." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>

      <body className="bg-white text-dark">
        {/* Navigation */}
        <nav className="fixed w-full bg-white border-b border-gray-100 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
            <img src="/logo-light.svg" alt="justapply" className="h-12" />
            <a href="#waitlist" className="text-sm font-medium text-white bg-primary px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              Join the Waitlist
            </a>
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
              Your career deserves better than a blank page.
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Stop overthinking every CV and cover letter. Build a personal component library from your years of work.
              Then generate tailored applications in seconds—using your voice, your achievements, your story.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 mb-8 justify-center">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary sm:max-w-xs"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
              </button>
            </form>
            {status === 'success' && (
              <p className="text-green-600 font-semibold">✓ Welcome to the waitlist!</p>
            )}
            {status === 'error' && (
              <p className="text-red-600 font-semibold">Something went wrong. Try again.</p>
            )}
          </div>
        </section>

        {/* The Problem / The Reality */}
        <section className="py-20 bg-light px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-16">The Real Bottleneck</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
              <div className="p-8 bg-white rounded-lg border border-gray-200">
                <p className="text-6xl font-bold mb-2" style={{color: '#FE6F09'}}>43%</p>
                <p className="text-lg text-gray-600">of candidates spend 30+ minutes on a single application</p>
              </div>
              <div className="p-8 bg-white rounded-lg border border-gray-200">
                <p className="text-6xl font-bold mb-2" style={{color: '#90055D'}}>51</p>
                <p className="text-lg text-gray-600">resumes needed on average to secure one job offer</p>
              </div>
              <div className="p-8 bg-white rounded-lg border border-gray-200">
                <p className="text-6xl font-bold mb-2" style={{color: '#FE6F09'}}>5</p>
                <p className="text-lg text-gray-600">months average from resume writing to job offer</p>
              </div>
              <div className="p-8 bg-white rounded-lg border border-gray-200">
                <p className="text-6xl font-bold mb-2" style={{color: '#90055D'}}>2-3%</p>
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
            <h2 className="text-4xl font-bold text-center mb-4">Build Your Career Story Once</h2>
            <p className="text-xl text-gray-600 text-center mb-16">
              Then call upon it whenever you find a role that matters.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="bg-light p-8 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">Upload your past work</h3>
                <p className="text-gray-600">
                  It's not just pasting CVs and cover letters, but I would also want justapply to ask you a set of questions to get to know you better, from what it can't find out on your CV.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-light p-8 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">Paste the job</h3>
                <p className="text-gray-600">
                  No, perfect. But the point is it will be perfect because it's based on you.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-light p-8 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">Apply</h3>
                <p className="text-gray-600">
                  justapply.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why justapply */}
        <section className="py-20 bg-light px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">Why justapply changes the game</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex gap-4 p-4 rounded-lg" style={{borderLeft: '4px solid #FE6F09', backgroundColor: 'rgba(254, 111, 9, 0.03)'}}>
                <div className="flex-shrink-0 w-6 h-6 text-primary mt-1">✓</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Everything you've achieved, always accessible</h3>
                  <p className="text-gray-600">Stop forgetting the great things you've done. Your career dictionary lives in one place. All your past achievements, the projects you loved, the skills you learned. When a job excites you, it's all there to pull from.</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-lg" style={{borderLeft: '4px solid #90055D', backgroundColor: 'rgba(144, 5, 93, 0.03)'}}>
                <div className="flex-shrink-0 w-6 h-6 text-primary mt-1">✓</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Apply in minutes, not hours</h3>
                  <p className="text-gray-600">Stop spending an entire evening perfecting a cover letter. You've already done the work. justapply finds what's relevant from your career history and adapts it to the job. You're ready to apply while the role is still fresh in your mind.</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-lg" style={{borderLeft: '4px solid #FE6F09', backgroundColor: 'rgba(254, 111, 9, 0.03)'}}>
                <div className="flex-shrink-0 w-6 h-6 text-primary mt-1">✓</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Stop second-guessing whether you're qualified</h3>
                  <p className="text-gray-600">You skip jobs because you don't meet every single requirement. Don't. justapply shows you exactly what you bring to that role. The skills, the projects, the achievements that matter. Your story speaks for itself.</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-lg" style={{borderLeft: '4px solid #90055D', backgroundColor: 'rgba(144, 5, 93, 0.03)'}}>
                <div className="flex-shrink-0 w-6 h-6 text-primary mt-1">✓</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Feel relieved instead of anxious</h3>
                  <p className="text-gray-600">You should feel confident that nothing's been left behind. That all your career moves are working for you. Not stressed that you forgot something important or didn't phrase it right. You built it once. It's there when you need it.</p>
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

            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
              </button>
            </form>

            {status === 'success' && (
              <p className="mt-4 text-green-600 font-semibold">✓ Welcome to the waitlist!</p>
            )}
            {status === 'error' && (
              <p className="mt-4 text-red-600 font-semibold">Something went wrong. Try again.</p>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-dark text-white py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
              <img src="/logo-dark.svg" alt="justapply" className="h-12 mb-4 md:mb-0" />
              <div className="flex gap-6 text-sm">
                <a href="#" className="hover:text-primary">Privacy</a>
                <a href="#" className="hover:text-primary">Terms</a>
                <a href="#" className="hover:text-primary">Contact</a>
              </div>
            </div>
            <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
              <p>© 2026 justapply.eu. Your AI operating system for job search.</p>
            </div>
          </div>
        </footer>
      </body>
    </>
  )
}
