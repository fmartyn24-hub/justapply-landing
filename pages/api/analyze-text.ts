import type { NextApiRequest, NextApiResponse } from 'next'
import { Anthropic } from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

interface CareerComponent {
  id?: string
  type: 'achievement' | 'skill' | 'role' | 'project' | 'kpi' | 'voice'
  title: string
  description?: string
  start_date?: string
  end_date?: string
  impact_metrics?: string
  tags: string[]
}

interface MergeResult {
  updates: Array<{
    id: string
    changes: Partial<CareerComponent>
  }>
  newComponents: CareerComponent[]
}

interface AnalyzeResponse {
  success: boolean
  components?: CareerComponent[]
  error?: string
  details?: string
}

const client = new Anthropic()

// Helper function to parse and normalize dates to YYYY-MM-DD
function normalizeDate(dateStr: string | undefined): string | undefined {
  if (!dateStr) return undefined

  const str = String(dateStr).trim()

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str
  }

  // YYYY-MM format - convert to YYYY-MM-01
  if (/^\d{4}-\d{2}$/.test(str)) {
    return `${str}-01`
  }

  // Just YYYY format - convert to YYYY-01-01
  if (/^\d{4}$/.test(str)) {
    return `${str}-01-01`
  }

  // MM/DD/YYYY or MM-DD-YYYY format (US style)
  const usMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (usMatch) {
    const month = String(usMatch[1]).padStart(2, '0')
    const day = String(usMatch[2]).padStart(2, '0')
    const year = usMatch[3]
    return `${year}-${month}-${day}`
  }

  // DD/MM/YYYY or DD-MM-YYYY format (EU style, if day > 12)
  const euMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (euMatch) {
    const possibleDay = parseInt(euMatch[1])
    const possibleMonth = parseInt(euMatch[2])
    // If first number > 12, it's likely DD/MM format
    if (possibleDay > 12) {
      const day = String(euMatch[1]).padStart(2, '0')
      const month = String(euMatch[2]).padStart(2, '0')
      const year = euMatch[3]
      return `${year}-${month}-${day}`
    }
  }

  // YYYY/MM/DD format
  const isoSlashMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (isoSlashMatch) {
    const year = isoSlashMatch[1]
    const month = String(isoSlashMatch[2]).padStart(2, '0')
    const day = String(isoSlashMatch[3]).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Month Year format: "January 2020", "Jan 2020"
  const monthYearMatch = str.match(
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})$/i
  )
  if (monthYearMatch) {
    const monthNames: Record<string, string> = {
      jan: '01', january: '01',
      feb: '02', february: '02',
      mar: '03', march: '03',
      apr: '04', april: '04',
      may: '05',
      jun: '06', june: '06',
      jul: '07', july: '07',
      aug: '08', august: '08',
      sep: '09', september: '09',
      oct: '10', october: '10',
      nov: '11', november: '11',
      dec: '12', december: '12',
    }
    const month = monthNames[monthYearMatch[1].toLowerCase()]
    const year = monthYearMatch[2]
    return `${year}-${month}-01`
  }

  // Month DD, YYYY or Month DD YYYY format: "January 15, 2020"
  const monthDayYearMatch = str.match(
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})$/i
  )
  if (monthDayYearMatch) {
    const monthNames: Record<string, string> = {
      jan: '01', january: '01',
      feb: '02', february: '02',
      mar: '03', march: '03',
      apr: '04', april: '04',
      may: '05',
      jun: '06', june: '06',
      jul: '07', july: '07',
      aug: '08', august: '08',
      sep: '09', september: '09',
      oct: '10', october: '10',
      nov: '11', november: '11',
      dec: '12', december: '12',
    }
    const month = monthNames[monthDayYearMatch[1].toLowerCase()]
    const day = String(monthDayYearMatch[2]).padStart(2, '0')
    const year = monthDayYearMatch[3]
    return `${year}-${month}-${day}`
  }

  // Q1/Q2/Q3/Q4 YYYY format: "Q1 2020"
  const quarterMatch = str.match(/^Q([1-4])\s+(\d{4})$/i)
  if (quarterMatch) {
    const quarter = parseInt(quarterMatch[1])
    const year = quarterMatch[2]
    const month = String((quarter - 1) * 3 + 1).padStart(2, '0')
    return `${year}-${month}-01`
  }

  // Try parsing with native Date as last resort
  try {
    const date = new Date(str)
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  } catch {
    // Continue to invalid format
  }

  // Invalid format
  return undefined
}

const MERGE_PROMPT = `You are an expert career coach helping someone maintain and enrich their career timeline.

Your task is to intelligently merge NEW career information with their EXISTING timeline.

EXISTING COMPONENTS:
{existing_components}

NEW INFORMATION PROVIDED:
{new_text}

Your job is to:
1. Identify which NEW information enriches or updates EXISTING components
2. Identify which information is genuinely NEW and should be added
3. Return a JSON object with two arrays:
   - "updates": Components to update (include only the fields that changed)
   - "new": Genuinely new components to add

Rules for merging:
- Same company + overlapping dates = same role (merge/enrich)
- Same skill mentioned again = same skill component (add new details/tags)
- Same achievement/project mentioned differently = same component (merge)
- Different timeframe but same company = might be different role (assess context)
- New metrics for existing role = update that role with impact_metrics
- Additional tags for existing skill = merge tags

For UPDATES, include:
- "id": The index position of the existing component in the array above (0-based)
- "changes": Only the fields that are being updated (title, description, impact_metrics, tags, dates, etc.)
  - For tags, MERGE with existing (don't replace)
  - For metrics, append or combine if both exist

For NEW components, provide full structure like:
- type, title, description, start_date, end_date, impact_metrics, tags

Return ONLY valid JSON, no other text.

Example format:
{
  "updates": [
    {
      "id": 0,
      "changes": {
        "impact_metrics": "Increased user engagement by 40%",
        "tags": ["React", "TypeScript", "Performance"]
      }
    }
  ],
  "new": [
    {
      "type": "skill",
      "title": "Python",
      "description": "Strong Python proficiency for data analysis and scripting",
      "tags": ["Python", "Data Analysis"]
    }
  ]
}`

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyzeResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    // Get auth token from headers
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const token = authHeader.substring(7)

    // Verify token with Supabase
    const serverSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { user }, error: userError } = await serverSupabase.auth.getUser(token)

    if (userError || !user?.id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    // Get request body
    const { text } = req.body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'No text provided' })
    }

    if (text.length > 50000) {
      return res.status(400).json({
        success: false,
        error: 'Text is too long. Maximum 50,000 characters.',
      })
    }

    console.log('🔍 Analyzing text with Claude, length:', text.length)

    // Fetch existing components
    const { data: existingComponents, error: fetchError } = await serverSupabase
      .from('career_components')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching existing components:', fetchError)
      // Continue anyway, treat as first analysis
    }

    console.log('📊 Found', existingComponents?.length || 0, 'existing components')

    // Build the merge prompt
    let prompt: string
    if (existingComponents && existingComponents.length > 0) {
      const componentsStr = JSON.stringify(
        existingComponents.map((c, idx) => ({
          ...c,
          _index: idx, // Include index for reference
        })),
        null,
        2
      )
      prompt = MERGE_PROMPT.replace('{existing_components}', componentsStr).replace(
        '{new_text}',
        text
      )
    } else {
      // No existing components, just extract fresh
      prompt = `Extract all career components from this text. No existing timeline to merge with.

VALID COMPONENT TYPES (use ONLY these):
- achievement: Accomplishments, awards, certifications, major milestones
- skill: Technical skills, soft skills, languages, tools, frameworks
- role: Job titles, positions, roles held
- project: Significant projects, initiatives, or work led
- kpi: Key performance indicators, metrics, quantifiable results
- voice: Personal branding, unique value proposition, career philosophy

${text}

Return as JSON array of components. Each component must have:
- type: MUST be one of: achievement, skill, role, project, kpi, voice
- title: Concise, impactful title
- description: Detailed explanation (1-2 sentences)
- start_date: ISO date YYYY-MM-DD if applicable
- end_date: ISO date YYYY-MM-DD if applicable
- impact_metrics: Quantifiable results if applicable
- tags: Array of relevant keywords

IMPORTANT: Only return valid JSON array, no other text.`
    }

    // Call Claude API
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Extract text from response
    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')

    console.log('✅ Claude response received')

    // Parse JSON from response
    let jsonStr = responseText
    const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim()
    }

    let result: any
    try {
      result = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError)
      return res.status(500).json({
        success: false,
        error: 'Failed to parse analysis results',
        details: 'Claude response could not be parsed as JSON',
      })
    }

    // Handle both formats: direct array (first analysis) or merge result
    let finalComponents: CareerComponent[] = []
    let updateCount = 0

    if (Array.isArray(result)) {
      // Direct extraction format (first analysis)
      const validTypes = ['achievement', 'skill', 'role', 'project', 'kpi', 'voice']
      finalComponents = result
        .filter((comp: any) => comp.title && comp.type && validTypes.includes(comp.type))
        .map((comp: any) => ({
          type: comp.type,
          title: String(comp.title).substring(0, 200),
          description: comp.description ? String(comp.description).substring(0, 1000) : undefined,
          start_date: normalizeDate(comp.start_date),
          end_date: normalizeDate(comp.end_date),
          impact_metrics: comp.impact_metrics
            ? String(comp.impact_metrics).substring(0, 500)
            : undefined,
          tags: Array.isArray(comp.tags)
            ? comp.tags.map((t: any) => String(t).substring(0, 50)).slice(0, 10)
            : [],
        }))

      console.log('✅ First analysis, extracted', finalComponents.length, 'components')

      // Insert all new components
      if (finalComponents.length > 0) {
        const { error: insertError } = await serverSupabase
          .from('career_components')
          .insert(
            finalComponents.map((comp: CareerComponent) => ({
              user_id: user.id,
              type: comp.type,
              title: comp.title,
              description: comp.description || null,
              start_date: comp.start_date || null,
              end_date: comp.end_date || null,
              impact_metrics: comp.impact_metrics || null,
              tags: comp.tags || [],
              source: 'claude_analysis',
            }))
          )

        if (insertError) {
          console.error('Error inserting components:', insertError)
          return res.status(500).json({
            success: false,
            error: 'Failed to save components',
            details: insertError.message,
          })
        }
      }
    } else if (result.updates || result.new) {
      // Merge format (subsequent analyses)
      const updates = result.updates || []
      const newComps = result.new || []

      // Apply updates
      for (const update of updates) {
        if (existingComponents && existingComponents[update.id]) {
          const component = existingComponents[update.id]
          const changes = update.changes

          // Merge tags if present
          let mergedTags = component.tags || []
          if (changes.tags) {
            mergedTags = [...new Set([...mergedTags, ...changes.tags])]
          }

          const { error: updateError } = await serverSupabase
            .from('career_components')
            .update({
              title: changes.title ?? component.title,
              description: changes.description ?? component.description,
              start_date: normalizeDate(changes.start_date) ?? component.start_date,
              end_date: normalizeDate(changes.end_date) ?? component.end_date,
              impact_metrics: changes.impact_metrics ?? component.impact_metrics,
              tags: mergedTags,
              updated_at: new Date().toISOString(),
            })
            .eq('id', component.id)

          if (updateError) {
            console.error('Error updating component:', updateError)
          } else {
            updateCount++
          }
        }
      }

      // Add new components
      if (newComps.length > 0) {
        const { error: insertError } = await serverSupabase
          .from('career_components')
          .insert(
            newComps
              .filter((comp: any) => comp.title && comp.type && validTypes.includes(comp.type))
              .map((comp: any) => ({
                user_id: user.id,
                type: comp.type,
                title: String(comp.title).substring(0, 200),
                description: comp.description
                  ? String(comp.description).substring(0, 1000)
                  : null,
                start_date: normalizeDate(comp.start_date) || null,
                end_date: normalizeDate(comp.end_date) || null,
                impact_metrics: comp.impact_metrics
                  ? String(comp.impact_metrics).substring(0, 500)
                  : null,
                tags: Array.isArray(comp.tags)
                  ? comp.tags.map((t: any) => String(t).substring(0, 50)).slice(0, 10)
                  : [],
                source: 'claude_analysis',
              }))
          )

        if (insertError) {
          console.error('Error inserting new components:', insertError)
        }
      }

      console.log(
        `✅ Merge complete: ${updateCount} updated, ${newComps.length} new components`
      )
    }

    // Refetch all components to return
    const { data: allComponents } = await serverSupabase
      .from('career_components')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return res.status(200).json({
      success: true,
      components: allComponents || [],
    })
  } catch (error) {
    console.error('Analysis handler error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
