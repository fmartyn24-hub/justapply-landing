import { useState } from 'react'
import { Button } from '@/components/common/Button'

interface Question {
  id: string
  category: 'goals' | 'values' | 'strengths'
  question: string
  placeholder: string
}

const QUESTIONS: Question[] = [
  {
    id: 'goal1',
    category: 'goals',
    question: 'What is your ideal role or position?',
    placeholder: 'e.g., Lead architect, product manager, startup founder...',
  },
  {
    id: 'goal2',
    category: 'goals',
    question: 'What industries or companies interest you most?',
    placeholder: 'e.g., AI/ML, fintech, climate tech...',
  },
  {
    id: 'values1',
    category: 'values',
    question: 'What work environment do you thrive in?',
    placeholder: 'e.g., fast-paced startup, structured enterprise, remote-first...',
  },
  {
    id: 'values2',
    category: 'values',
    question: 'What values are most important to you at work?',
    placeholder: 'e.g., impact, work-life balance, continuous learning, autonomy...',
  },
  {
    id: 'strengths1',
    category: 'strengths',
    question: 'What makes you unique or different from other professionals?',
    placeholder: 'e.g., uncommon skill combination, unique background, proven track record...',
  },
  {
    id: 'strengths2',
    category: 'strengths',
    question: 'What are you best known for?',
    placeholder: 'e.g., problem-solving, team leadership, innovation, mentoring...',
  },
]

interface ProfileQuestionsModalProps {
  onSubmit: (answers: Record<string, string>) => Promise<void>
  onClose: () => void
  saving?: boolean
}

export function ProfileQuestionsModal({ onSubmit, onClose, saving }: ProfileQuestionsModalProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Check if at least some questions are answered
    const answeredCount = Object.values(answers).filter((a) => a.trim().length > 0).length
    if (answeredCount === 0) {
      setError('Please answer at least one question')
      return
    }

    try {
      await onSubmit(answers)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save answers')
    }
  }

  const getCategory = (id: string) => QUESTIONS.find((q) => q.id === id)?.category

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Enrich Your Profile</h2>
              <p className="text-gray-600 text-sm mt-1">
                Answer a few questions to improve your cover letters and applications
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Goals Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Career Goals & Aspirations</h3>
            <div className="space-y-4">
              {QUESTIONS.filter((q) => q.category === 'goals').map((question) => (
                <div key={question.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {question.question}
                  </label>
                  <textarea
                    value={answers[question.id] || ''}
                    onChange={(e) =>
                      setAnswers({ ...answers, [question.id]: e.target.value })
                    }
                    placeholder={question.placeholder}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Values Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Work Style & Values</h3>
            <div className="space-y-4">
              {QUESTIONS.filter((q) => q.category === 'values').map((question) => (
                <div key={question.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {question.question}
                  </label>
                  <textarea
                    value={answers[question.id] || ''}
                    onChange={(e) =>
                      setAnswers({ ...answers, [question.id]: e.target.value })
                    }
                    placeholder={question.placeholder}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Strengths Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⭐ Unique Strengths</h3>
            <div className="space-y-4">
              {QUESTIONS.filter((q) => q.category === 'strengths').map((question) => (
                <div key={question.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {question.question}
                  </label>
                  <textarea
                    value={answers[question.id] || ''}
                    onChange={(e) =>
                      setAnswers({ ...answers, [question.id]: e.target.value })
                    }
                    placeholder={question.placeholder}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <Button type="submit" loading={saving} disabled={saving} className="flex-1">
              Save Answers
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="flex-1"
            >
              Skip for Now
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
