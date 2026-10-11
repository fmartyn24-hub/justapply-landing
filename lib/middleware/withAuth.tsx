import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useAuth } from '@/lib/context/AuthContext'
import type { ComponentType } from 'react'

export function withAuth<P extends object>(Component: ComponentType<P>) {
  return function ProtectedRoute(props: P) {
    const { isAuthenticated, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.replace('/auth/login')
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

    if (!isAuthenticated) {
      return null
    }

    return <Component {...props} />
  }
}
