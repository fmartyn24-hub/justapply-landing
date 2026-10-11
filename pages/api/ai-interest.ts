import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Records "would you use this?" answers from locked AI features, so we can see
// which AI features are worth building/charging for before turning them on.
// Table: ai_feature_interest (see supabase_add_ai_feature_interest.sql).

const FEATURES = new Set(['import', 'match_analysis', 'cover_letter', 'cv_advice'])
const ANSWERS = new Set(['yes', 'maybe', 'no'])

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const serverSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: { user }, error: userError } = await serverSupabase.auth.getUser(authHeader.substring(7))
  if (userError || !user?.id) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const { feature, answer, comment } = req.body || {}
  if (!FEATURES.has(feature) || !ANSWERS.has(answer)) {
    return res.status(400).json({ success: false, error: 'Invalid feature or answer' })
  }

  const { error } = await (serverSupabase.from('ai_feature_interest') as any).insert({
    user_id: user.id,
    feature,
    answer,
    comment: typeof comment === 'string' && comment.trim() ? comment.trim().slice(0, 1000) : null,
  })

  if (error) {
    // Don't surface storage problems to the user (e.g. migration not applied
    // yet); the Vercel Analytics event fired client-side still counts it.
    console.error('ai-interest insert failed:', error.message)
    return res.status(202).json({ success: false })
  }

  return res.status(200).json({ success: true })
}
