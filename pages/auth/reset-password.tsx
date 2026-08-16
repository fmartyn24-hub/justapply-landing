import { AuthLayout } from '@/components/auth/AuthLayout'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { useAuth } from '@/lib/context/AuthContext'

export default function ResetPasswordPage() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a new password for your account"
      bottomLink={{
        text: 'Remembered your password?',
        label: 'Sign in',
        href: '/auth/login',
      }}
    >
      <ResetPasswordForm />
    </AuthLayout>
  )
}
