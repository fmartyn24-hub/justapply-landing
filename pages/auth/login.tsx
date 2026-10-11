import { AuthLayout } from '@/components/auth/AuthLayout'
import { LoginForm } from '@/components/auth/LoginForm'
import { useAuth } from '@/lib/context/AuthContext'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function LoginPage() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, loading, router])

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
      title="Welcome Back"
      subtitle="Sign in to your justapply account"
      bottomLink={{
        text: "Don't have an account?",
        label: 'Sign up',
        href: '/auth/signup',
      }}
    >
      <LoginForm />
    </AuthLayout>
  )
}
