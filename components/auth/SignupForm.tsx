import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/lib/context/AuthContext'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'

interface SignupFormProps {
  onSuccess?: () => void
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp, signIn } = useAuth()
  const router = useRouter()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 8
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validation
      if (!email.trim()) {
        setError('Email is required')
        setLoading(false)
        return
      }

      if (!validateEmail(email)) {
        setError('Please enter a valid email address')
        setLoading(false)
        return
      }

      if (!password) {
        setError('Password is required')
        setLoading(false)
        return
      }

      if (!validatePassword(password)) {
        setError('Password must be at least 8 characters')
        setLoading(false)
        return
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }

      if (!agreeToTerms) {
        setError('You must agree to the terms to continue')
        setLoading(false)
        return
      }

      // Sign up
      await signUp(email, password)

      // Auto sign in after signup
      try {
        await signIn(email, password)
        if (onSuccess) onSuccess()
        router.push('/dashboard')
      } catch (signInErr) {
        console.error('Auto sign-in failed:', signInErr)
        // Even if auto sign-in fails, show success message to check email
        setError('Account created! Check your email to verify your account, then sign in.')
      }
    } catch (err) {
      console.error('Signup error:', err)
      if (err instanceof Error) {
        if (err.message.includes('already registered')) {
          setError('This email is already registered. Try signing in instead.')
        } else if (err.message.includes('password')) {
          setError('Password does not meet requirements')
        } else {
          setError(err.message)
        }
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = password.length >= 8 ? 'strong' : 'weak'
  const passwordsMatch = password && confirmPassword && password === confirmPassword

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <Input
        type="email"
        label="Email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />

      <div>
        <Input
          type="password"
          label="Password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        {password && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 rounded">
              <div
                className={`h-full rounded ${
                  passwordStrength === 'strong'
                    ? 'bg-green-500 w-full'
                    : 'bg-yellow-500 w-1/2'
                }`}
              />
            </div>
            <span className="text-xs font-medium text-gray-600">
              {passwordStrength === 'strong' ? 'Strong' : 'Weak'}
            </span>
          </div>
        )}
      </div>

      <Input
        type="password"
        label="Confirm Password"
        placeholder="Re-enter your password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={loading}
        error={
          confirmPassword && !passwordsMatch
            ? 'Passwords do not match'
            : undefined
        }
      />

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agreeToTerms}
          onChange={(e) => setAgreeToTerms(e.target.checked)}
          disabled={loading}
          className="w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-primary cursor-pointer"
        />
        <span className="text-sm text-gray-600">
          I agree to the{' '}
          <a href="/terms" className="text-primary font-semibold hover:underline">
            terms of service
          </a>
        </span>
      </label>

      <Button
        type="submit"
        size="md"
        loading={loading}
        className="w-full"
      >
        Create Account
      </Button>
    </form>
  )
}
