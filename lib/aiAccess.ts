import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

// Single source of truth for who may use AI-powered (paid, Claude-backed)
// features. While AI is in beta, it's OFF for everyone except admins unless
// NEXT_PUBLIC_AI_FEATURES=on is set for the deployment. The flag is public so
// the client can render locks; the server re-checks on every AI request, so a
// tampered client can't spend API credits.

export const DEFAULT_ADMIN_EMAIL = 'fmartyn24@gmail.com'

export const AI_LOCKED_MESSAGE = "AI features aren't available on your account yet. They're in beta."

export function aiOpenToEveryone(): boolean {
  return process.env.NEXT_PUBLIC_AI_FEATURES === 'on'
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false
  const admins = (process.env.AI_ADMIN_EMAILS || DEFAULT_ADMIN_EMAIL)
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return admins.includes(email.toLowerCase())
}

export function canUseAi(email?: string | null): boolean {
  return aiOpenToEveryone() || isAdminEmail(email)
}

// Verifies the bearer token and AI access. On failure it has already sent the
// 401/403 response and returns null, so callers just `if (!ctx) return`.
export async function requireAiUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ user: User; serverSupabase: SupabaseClient } | null> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized' })
    return null
  }

  const serverSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: { user }, error } = await serverSupabase.auth.getUser(authHeader.substring(7))
  if (error || !user?.id) {
    res.status(401).json({ success: false, error: 'Unauthorized' })
    return null
  }

  if (!canUseAi(user.email)) {
    res.status(403).json({ success: false, error: AI_LOCKED_MESSAGE })
    return null
  }

  return { user, serverSupabase }
}
