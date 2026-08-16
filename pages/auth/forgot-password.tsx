import { AuthLayout } from '@/components/auth/AuthLayout'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
      bottomLink={{
        text: 'Remembered your password?',
        label: 'Sign in',
        href: '/auth/login',
      }}
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
