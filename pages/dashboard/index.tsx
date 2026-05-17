import { withAuth } from '@/lib/middleware/withAuth'
import { useAuth } from '@/lib/context/AuthContext'
import Link from 'next/link'
import { Button } from '@/components/common/Button'

function Dashboard() {
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout failed:', error)
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
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 font-medium transition text-sm"
            >
              Sign Out
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex gap-6 border-t border-gray-100 pt-4">
            <Link href="/dashboard" className="text-gray-900 font-medium hover:text-primary transition">
              Home
            </Link>
            <Link href="/dashboard/upload" className="text-gray-600 hover:text-primary transition">
              Upload More Information
            </Link>
            <Link href="/dashboard/applications" className="text-gray-600 hover:text-primary transition">
              My Applications
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome to <em>just apply</em>
            </h1>
            <p className="text-xl text-gray-600">
              Signed in as <span className="font-semibold">{user?.email}</span>
            </p>
          </div>

          {/* Onboarding Card */}
          <div className="bg-light border border-gray-200 rounded-lg p-8 max-w-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Step 1: Upload Your CV
                </h2>
                <p className="text-gray-600 mb-4">
                  Start by uploading your CV or resume. This helps us understand your background,
                  experience, and the unique value you bring to the table.
                </p>
                <p className="text-gray-600 mb-4">
                  It's not just about pasting CVs and cover letters. We learn what you've done,
                  what you've accomplished, and what you bring to the table.
                </p>
              </div>
              <div className="text-4xl font-bold text-primary ml-4 flex-shrink-0">
                1
              </div>
            </div>

            <Link href="/dashboard/upload">
              <Button size="lg" className="w-full sm:w-auto">
                Upload Your CV
              </Button>
            </Link>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mt-12">
            <div className="p-6 border border-gray-200 rounded-lg hover:border-primary transition">
              <h3 className="font-semibold text-gray-900 mb-2">
                Paste the Job
              </h3>
              <p className="text-gray-600 text-sm">
                Share the job description you're applying for, and we'll match it with your background.
              </p>
            </div>

            <div className="p-6 border border-gray-200 rounded-lg hover:border-primary transition">
              <h3 className="font-semibold text-gray-900 mb-2">
                Get Tailored Application
              </h3>
              <p className="text-gray-600 text-sm">
                Receive a custom CV and cover letter tailored specifically for that role.
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mt-8">
            <div className="text-center p-6 bg-light rounded-lg">
              <p className="text-3xl font-bold text-primary mb-1">0</p>
              <p className="text-sm text-gray-600">CVs Uploaded</p>
            </div>
            <div className="text-center p-6 bg-light rounded-lg">
              <p className="text-3xl font-bold text-primary mb-1">0</p>
              <p className="text-sm text-gray-600">Applications Generated</p>
            </div>
            <div className="text-center p-6 bg-light rounded-lg">
              <p className="text-3xl font-bold text-primary mb-1">0</p>
              <p className="text-sm text-gray-600">Jobs Tracked</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default withAuth(Dashboard)
