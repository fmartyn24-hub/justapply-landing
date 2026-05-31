import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

// Advice step for the Just Apply flow. Given a pasted job ad and the user's
// career library, this returns:
//   - the keywords/competencies the employer cares about (for ATS-style match)
//   - a one-line "thesis" on why the candidate fits
//   - a recommended subset of the user's components, each with a reason tying it
//     to the job ad.
// The UI uses this to pre-select which components to highlight; the user then
// confirms/adjusts before generation runs.

interface Recommendation {
  id: string
  title: string
  type: string
  reason: string
}

interface AnalyzeResponse {
  success: boolean
  keywords?: string[]
  thesis?: string
  recommendations?: Recommendation[]
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyzeResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const token = authHeader.substring(7)
  const serverSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user }, error: userError } = await serverSupabase.auth.getUser(token)
  if (userError || !user?.id) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const { jobDescription, jobTitle, company } = req.body
  if (!jobDescription || typeof jobDescription !== 'string') {
    return res.status(400).json({ success: false, error: 'Job description is required' })
  }

  try {
    const { data: components, error: componentError } = await serverSupabase
      .from('career_components')
      .select('id, type, title, description, organization_name, start_date, end_date, impact_metrics, tags')
      .eq('user_id', user.id)

    if (componentError) throw componentError

    const list = (components || []) as any[]

    // Build an indexed list for the model. We ask the model to return INDICES,
    // not UUIDs, then map back server-side — models reproduce short integers
    // reliably but frequently mangle long UUIDs.
    const indexed = list
      .map((c, i) => {
        const dates = c.start_date ? ` (${c.start_date} – ${c.end_date || 'Present'})` : ''
        const org = c.organization_name ? ` @ ${c.organization_name}` : ''
        const metrics = c.impact_metrics ? ` · metrics: ${c.impact_metrics}` : ''
        const tags = Array.isArray(c.tags) && c.tags.length ? ` [${c.tags.join(', ')}]` : ''
        return `[${i}] (${c.type}) ${c.title}${org}${dates}: ${c.description || ''}${metrics}${tags}`
      })
      .join('\n')

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are an expert technical recruiter and career strategist. Analyse a job advert against a candidate's library of career components and advise which components to highlight in their application.

═══ JOB ═══
Title: ${jobTitle || 'Not specified'}
Company: ${company || 'Not specified'}
Description:
${jobDescription}

═══ CANDIDATE COMPONENTS (indexed) ═══
${indexed || '(The candidate has no saved components yet.)'}

═══ TASKS ═══
1. Extract the 6–12 keywords/competencies this employer most cares about — the skills, tools, qualities and domain terms an ATS or human screener will scan for. Use the employer's own wording where possible.
2. Recommend the components that best match THIS job. For each, write ONE sentence explaining the match, tied to a specific requirement or theme in the advert. Prefer quantified achievements, directly relevant skills, and on-point roles/projects. Recommend the strongest subset — typically 5–12 — not everything, and not nothing if good matches exist.
3. Write a single-sentence "thesis": why this candidate is well-suited to this role, beyond surface keyword overlap.

═══ OUTPUT ═══
Respond with valid JSON only — no preamble, no markdown fences:
{
  "keywords": ["keyword 1", "keyword 2"],
  "thesis": "one sentence",
  "recommended": [ { "index": 0, "reason": "one sentence tying it to the job" } ]
}

Rules:
- "index" must be an integer that exists in the indexed list above. Never invent indices.
- If the candidate has no components, return an empty "recommended" array but still fill "keywords" and a brief "thesis" from the advert.
- Keep reasons concrete and specific to this advert; no generic filler.`,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    let jsonText = content.text.trim()
    if (jsonText.startsWith('```json')) jsonText = jsonText.slice(7)
    else if (jsonText.startsWith('```')) jsonText = jsonText.slice(3)
    if (jsonText.endsWith('```')) jsonText = jsonText.slice(0, -3)

    let parsed: any
    try {
      parsed = JSON.parse(jsonText.trim())
    } catch {
      throw new Error('Failed to parse analysis from Claude')
    }

    const keywords: string[] = Array.isArray(parsed.keywords)
      ? parsed.keywords.filter((k: any) => typeof k === 'string').slice(0, 16)
      : []

    const thesis: string = typeof parsed.thesis === 'string' ? parsed.thesis : ''

    // Map model indices back to real component IDs, dropping anything invalid.
    const seen = new Set<number>()
    const recommendations: Recommendation[] = Array.isArray(parsed.recommended)
      ? parsed.recommended
          .map((r: any) => {
            const idx = Number(r?.index)
            if (!Number.isInteger(idx) || idx < 0 || idx >= list.length || seen.has(idx)) return null
            seen.add(idx)
            const c = list[idx]
            return {
              id: c.id,
              title: c.title,
              type: c.type,
              reason: typeof r?.reason === 'string' ? r.reason : '',
            }
          })
          .filter(Boolean) as Recommendation[]
      : []

    return res.status(200).json({ success: true, keywords, thesis, recommendations })
  } catch (error) {
    console.error('Analyze job error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyse job',
    })
  }
}
