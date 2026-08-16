import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/lib/context/AuthContext'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'

export function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { updatePassword } = useAuth()
  const router = useRouter()

  const validatePassword = (password: string) => password.length >= 8
  const passwordsMatch = password && confirmPassword && password === confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password) {
      setError('Password is required')
      return
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await updatePassword(password)
      router.push('/dashboard')
    } catch (err) {
      console.error('Update password error:', err)
      if (err instanceof Error) {
        if (err.message.includes('session') || err.message.includes('Auth session missing')) {
          setError('This reset link has expired or already been used. Request a new one.')
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <Input
        type="password"
        label="New password"
        placeholder="At least 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
      />

      <Input
        type="password"
        label="Confirm new password"
        placeholder="Re-enter your new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={loading}
        error={confirmPassword && !passwordsMatch ? 'Passwords do not match' : undefined}
      />

      <Button type="submit" size="md" loading={loading} className="w-full">
        Reset password
      </Button>
    </form>
  )
}
