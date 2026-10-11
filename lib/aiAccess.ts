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

// ── Free AI allowance ─────────────────────────────────────────────────────
// Free accounts get a small number of AI CV imports (the activation moment),
// billed to a SEPARATE Anthropic key so free-tier spend is visible on its own.
// Off unless ANTHROPIC_API_KEY_FREE_TIER is set. Usage is counted in ai_usage.

export const FREE_IMPORT_FEATURE = 'import'
export const DEFAULT_FREE_TIER_MODEL = 'claude-sonnet-5'

export function freeImportLimit(): number {
  const n = parseInt(process.env.FREE_AI_IMPORTS_PER_USER || '1', 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export function freeImportConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY_FREE_TIER && freeImportLimit() > 0
}

export function freeTierModel(): string {
  return process.env.FREE_TIER_AI_MODEL || DEFAULT_FREE_TIER_MODEL
}

export async function freeImportsRemaining(serverSupabase: SupabaseClient, userId: string): Promise<number> {
  if (!freeImportConfigured()) return 0
  const { count, error } = await serverSupabase
    .from('ai_usage')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('feature', FREE_IMPORT_FEATURE)
  // If usage can't be read, fail closed rather than hand out unlimited imports.
  if (error) return 0
  return Math.max(0, freeImportLimit() - (count || 0))
}

export async function recordAiUsage(
  serverSupabase: SupabaseClient,
  row: { user_id: string; feature: string; model: string; input_tokens?: number; output_tokens?: number }
): Promise<void> {
  const { error } = await (serverSupabase.from('ai_usage') as any).insert(row)
  if (error) console.error('ai_usage insert failed:', error.message)
}

async function authenticate(
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
  return { user, serverSupabase }
}

// Verifies the bearer token and AI access. On failure it has already sent the
// 401/403 response and returns null, so callers just `if (!ctx) return`.
export async function requireAiUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ user: User; serverSupabase: SupabaseClient } | null> {
  const ctx = await authenticate(req, res)
  if (!ctx) return null

  if (!canUseAi(ctx.user.email)) {
    res.status(403).json({ success: false, error: AI_LOCKED_MESSAGE })
    return null
  }

  return ctx
}

// Like requireAiUser, but also lets a free account through when it still has
// a free import left. `mode` tells the route which key/model to use and
// whether to record the usage afterwards.
export async function requireAiUserOrFreeImport(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ user: User; serverSupabase: SupabaseClient; mode: 'full' | 'free_import' } | null> {
  const ctx = await authenticate(req, res)
  if (!ctx) return null

  if (canUseAi(ctx.user.email)) return { ...ctx, mode: 'full' }

  if ((await freeImportsRemaining(ctx.serverSupabase, ctx.user.id)) > 0) {
    return { ...ctx, mode: 'free_import' }
  }

  res.status(403).json({ success: false, error: "You've used your free AI import. AI features are in beta." })
  return null
}

export { authenticate as authenticateUser }
