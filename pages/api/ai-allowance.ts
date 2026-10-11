import type { NextApiRequest, NextApiResponse } from 'next'
import { authenticateUser, canUseAi, freeImportConfigured, freeImportLimit, freeImportsRemaining } from '@/lib/aiAccess'

// What AI the signed-in user can use right now, so the UI can offer the free
// import (or not) without guessing. The AI routes enforce the same rules.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const ctx = await authenticateUser(req, res)
  if (!ctx) return

  const full = canUseAi(ctx.user.email)
  return res.status(200).json({
    success: true,
    aiEnabled: full,
    freeImport: {
      available: !full && freeImportConfigured(),
      remaining: full ? 0 : await freeImportsRemaining(ctx.serverSupabase, ctx.user.id),
      limit: freeImportLimit(),
    },
  })
}
