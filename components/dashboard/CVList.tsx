import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Button } from '@/components/common/Button'

interface CV {
  id: string
  filename: string
  file_size_bytes: number
  created_at: string
  storage_path: string
}

export function CVList() {
  const [cvs, setCvs] = useState<CV[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserAndCVs = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUserId(user.id)

        const { data, error } = await supabase
          .from('cvs')
          .select('id, filename, file_size_bytes, created_at, storage_path')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (!error && data) {
          setCvs(data)
        }
      }

      setLoading(false)
    }

    fetchUserAndCVs()
  }, [])

  const handleDeleteCV = async (cvId: string, storagePath: string) => {
    if (!userId) return

    setDeleting(cvId)
    try {
      // Delete from storage
      await supabase.storage.from('cvs').remove([storagePath])

      // Delete from database
      await supabase.from('cvs').delete().eq('id', cvId)

      // Remove from local state
      setCvs(cvs.filter((cv) => cv.id !== cvId))
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete CV')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return <div className="text-gray-600">Loading your CVs...</div>
  }

  if (cvs.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-semibold text-yellow-900 mb-2">No CVs uploaded yet</h3>
        <p className="text-yellow-800 mb-4">
          Upload your CV to get started building your professional profile.
        </p>
        <Link href="/dashboard/upload">
          <Button>Upload Your CV</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Your CVs</h3>
        <div className="space-y-2">
          {cvs.map((cv) => (
            <div
              key={cv.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary transition"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{cv.filename}</p>
                <p className="text-sm text-gray-600">
                  {(cv.file_size_bytes / 1024).toFixed(1)} KB •{' '}
                  {new Date(cv.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/dashboard/upload">
                  <Button variant="outline" size="sm">
                    Upload Another
                  </Button>
                </Link>
                <button
                  onClick={() => {
                    if (confirm('Delete this CV? This cannot be undone.')) {
                      handleDeleteCV(cv.id, cv.storage_path)
                    }
                  }}
                  disabled={deleting === cv.id}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting === cv.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
        <h3 className="font-semibold text-blue-900 mb-2">Next: Build Your Career Profile</h3>
        <p className="text-blue-800 mb-4">
          Now let's build your professional story. Create a rich profile of your achievements, skills, projects, and impact. This will power your tailored applications.
        </p>
        <Link href="/dashboard/profile">
          <Button className="bg-blue-600 hover:bg-blue-700">
            Build Your Career Profile
          </Button>
        </Link>
      </div>
    </div>
  )
}
