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
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <body className="bg-white text-dark">
        {/* Navigation */}
        <nav className="fixed w-full bg-white border-b border-gray-100 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="text-2xl font-bold text-primary">justapply</div>
            <a href="#waitlist" className="text-sm font-medium text-primary hover:text-blue-700">
              Get Early Access
            </a>
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
              Stop applying. Start getting results.
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Upload your CV. Post the job. Get a tailored CV and cover letter in minutes. 
              justapply is the operating system for your job search.
            </p>
            <a href="#waitlist" className="inline-block bg-primary text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition">
              Join the Waitlist
            </a>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-light px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">How justapply Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="bg-white p-8 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">Upload Your CV</h3>
                <p className="text-gray-600">
                  Add your past CVs and career history. justapply learns your voice, achievements, and professional story.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-8 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">Paste the Job</h3>
                <p className="text-gray-600">
                  Paste the job description you're applying for. justapply scans for keywords, tone, and requirements.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-8 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">Get Documents</h3>
                <p className="text-gray-600">
                  Download a tailored CV and cover letter in your voice. Ready to apply in minutes, not hours.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">Why justapply</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-6 h-6 text-primary mt-1">✓</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Voice-Trained AI</h3>
                  <p className="text-gray-600">justapply learns from your past cover letters to write new ones in your authentic voice.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-6 h-6 text-primary mt-1">✓</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Keyword Matching</h3>
                  <p className="text-gray-600">AI analyzes job descriptions and crafts documents with the right keywords and tone.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-6 h-6 text-primary mt-1">✓</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Application Tracker</h3>
                  <p className="text-gray-600">Manage all your applications in one place. Track status, notes, and documents.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-6 h-6 text-primary mt-1">✓</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">One Free Application</h3>
                  <p className="text-gray-600">Generate your first CV and cover letter free. Upgrade for unlimited applications.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 bg-light px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">Simple Pricing</h2>
            <p className="text-xl text-gray-600 mb-16">Start free. Upgrade when you're ready.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Free */}
              <div className="bg-white p-8 rounded-lg border border-gray-200">
                <h3 className="text-2xl font-bold mb-4">Free</h3>
                <p className="text-4xl font-bold text-primary mb-6">€0</p>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    <span>1 CV + cover letter per month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    <span>AI voice training</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    <span>Application tracker</span>
                  </li>
                </ul>
                <button className="w-full border-2 border-primary text-primary py-2 rounded-lg font-semibold hover:bg-blue-50 transition">
                  Get Started
                </button>
              </div>

              {/* Pro */}
              <div className="bg-primary text-white p-8 rounded-lg border-2 border-primary">
                <h3 className="text-2xl font-bold mb-4">Pro</h3>
                <p className="text-4xl font-bold mb-6">€9/mo</p>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Unlimited applications</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Interview prep</span>
                  </li>
                </ul>
                <button className="w-full bg-white text-primary py-2 rounded-lg font-semibold hover:bg-gray-100 transition">
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Waitlist CTA */}
        <section id="waitlist" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to transform your job search?</h2>
            <p className="text-lg text-gray-600 mb-8">
              Join early users getting tailored CVs and cover letters in minutes.
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
              <div className="text-2xl font-bold mb-4 md:mb-0">justapply</div>
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
