import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function VerifyEmail() {
  const router = useRouter()
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState('')
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Check if there's a token from the email link
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      const type = params.get('type')

      if (accessToken && type === 'email') {
        setToken(accessToken)
        handleVerification(accessToken)
      }
    }
  }, [])

  const handleVerification = async (accessToken: string) => {
    try {
      // Exchange the token for a session
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: accessToken,
      })

      if (error) {
        throw error
      }

      setIsVerified(true)
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      console.error('Verification error:', err)
      setError(err instanceof Error ? err.message : 'Verification failed')
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center">
          <Link href="/">
            <img src="/logo-light.svg" alt="justapply" className="h-12 mx-auto mb-8" />
          </Link>

          {isVerified ? (
            <>
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Email verified!
              </h1>
              <p className="text-gray-600 mb-6">
                Great! Your email has been verified. Redirecting to your dashboard...
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  If you're not redirected, <Link href="/dashboard" className="font-semibold hover:underline">click here</Link>.
                </p>
              </div>
            </>
          ) : error ? (
            <>
              <div className="mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Verification failed
              </h1>
              <p className="text-gray-600 mb-6">
                {error}
              </p>
              <div className="space-y-3">
                <Link
                  href="/auth/signup"
                  className="block px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition text-center"
                >
                  Try again
                </Link>
                <Link
                  href="/auth/login"
                  className="block px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition text-center"
                >
                  Sign in
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Check your email
              </h1>
              <p className="text-gray-600 mb-6">
                We've sent a verification link to your email address. Click the link to confirm your email and get started with justapply.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mb-6">
                <p className="font-semibold mb-2">Tips:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Check your spam folder if you don't see the email</li>
                  <li>• The link expires in 24 hours</li>
                  <li>• You can close this tab once verified</li>
                </ul>
              </div>
              <Link
                href="/"
                className="block px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition text-center"
              >
                Back to home
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
