import { ReactNode } from 'react'
import Link from 'next/link'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  bottomLink?: {
    text: string
    label: string
    href: string
  }
}

export function AuthLayout({
  children,
  title,
  subtitle,
  bottomLink,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto">
        <div className="mb-8">
          <Link href="/">
            <img
              src="/logo-light.svg"
              alt="justapply"
              className="h-10 mx-auto mb-6"
            />
          </Link>
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-center text-gray-600">{subtitle}</p>
          )}
        </div>

        <div className="bg-white py-8">
          {children}
        </div>

        {bottomLink && (
          <p className="text-center text-gray-600 text-sm mt-6">
            {bottomLink.text}{' '}
            <Link href={bottomLink.href} className="text-primary font-semibold hover:underline">
              {bottomLink.label}
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
