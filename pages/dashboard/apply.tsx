import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { withAuth } from '@/lib/middleware/withAuth'
import { useAuth } from '@/lib/context/AuthContext'
import { Button } from '@/components/common/Button'
import { supabase } from '@/lib/supabaseClient'

interface CV {
  id: string
  filename: string
}

interface GenerationResult {
  coverLetter: string
  matchedSkills: string[]
  tailoredExperience: string
}

function ApplyPage() {
  const [jobDescription, setJobDescription] = useState('')
  const [selectedCvId, setSelectedCvId] = useState('')
  const [cvs, setCvs] = useState<CV[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCvs, setIsLoadingCvs] = useState(true)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [error, setError] = useState('')
  const { session } = useAuth()
  const router = useRouter()

  // Fetch user's CVs on mount
  useEffect(() => {
    const fetchCvs = async () => {
      if (!session) return

      const { data, error: fetchError } = await supabase
        .from('cvs')
        .select('id, filename')
        .eq('user_id', session.user?.id)
        .order('created_at', { ascending: false })

      if (!fetchError && data) {
        setCvs(data)
        if (data.length > 0) {
          setSelectedCvId(data[0].id)
        }
      }
      setIsLoadingCvs(false)
    }

    fetchCvs()
  }, [session])

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      setError('Please paste a job description')
      return
    }

    if (!selectedCvId) {
      setError('Please select a CV')
      return
    }

    if (!session?.access_token) {
      setError('Authentication failed')
      return
    }

    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/generate-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          jobDescription,
          cvId: selectedCvId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Generation failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      console.error('Generation error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center mb-4">
            <Link href="/">
              <img
                src="/logo-light.svg"
                alt="justapply"
                className="h-10"
              />
            </Link>
            <button
              onClick={() => {
                supabase.auth.signOut()
                router.push('/')
              }}
              className="text-gray-600 hover:text-gray-900 font-medium transition text-sm"
            >
              Sign Out
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex gap-6 border-t border-gray-100 pt-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-primary transition">
              Home
            </Link>
            <Link href="/dashboard/upload" className="text-gray-600 hover:text-primary transition">
              Upload More Information
            </Link>
            <Link href="/dashboard/apply" className="text-gray-900 font-medium hover:text-primary transition">
              Apply to Jobs
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-8">
          {!result ? (
            <>
              {/* Header */}
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Apply to a Job
                </h1>
                <p className="text-xl text-gray-600">
                  Paste a job description and we'll generate a tailored cover letter.
                </p>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* CV Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Select which CV to use
                  </label>
                  {isLoadingCvs ? (
                    <div className="text-gray-600">Loading your CVs...</div>
                  ) : cvs.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800">
                        You haven't uploaded any CVs yet.{' '}
                        <Link href="/dashboard/upload" className="font-semibold underline">
                          Upload one here
                        </Link>
                      </p>
                    </div>
                  ) : (
                    <select
                      value={selectedCvId}
                      onChange={(e) => setSelectedCvId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {cvs.map((cv) => (
                        <option key={cv.id} value={cv.id}>
                          {cv.filename}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Job Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Job Description
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the full job description here..."
                    rows={10}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{error}</p>
                  </div>
                )}

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  loading={isLoading}
                  size="lg"
                  disabled={!selectedCvId || isLoadingCvs}
                >
                  Generate Tailored Application
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Results */}
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h1 className="text-4xl font-bold text-gray-900">
                    Your Tailored Application
                  </h1>
                  <Button
                    onClick={() => {
                      setResult(null)
                      setJobDescription('')
                    }}
                    variant="outline"
                  >
                    Generate Another
                  </Button>
                </div>

                {/* Matched Skills */}
                {result.matchedSkills && result.matchedSkills.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Matched Skills
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {result.matchedSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tailored Experience */}
                {result.tailoredExperience && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Relevant Experience
                    </h2>
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <p className="text-gray-700 leading-relaxed">
                        {result.tailoredExperience}
                      </p>
                    </div>
                  </div>
                )}

                {/* Cover Letter */}
                {result.coverLetter && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Cover Letter
                    </h2>
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="prose prose-sm max-w-none">
                        {result.coverLetter.split('\n').map((paragraph, idx) => (
                          <p key={idx} className="text-gray-700 leading-relaxed mb-4 last:mb-0">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                  <Button size="lg" className="flex-1">
                    Save Application
                  </Button>
                  <Button size="lg" variant="outline" className="flex-1">
                    Copy to Clipboard
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default withAuth(ApplyPage)
