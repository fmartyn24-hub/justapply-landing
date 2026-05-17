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

// Helper function to compute similarity between two strings
function stringSimilarity(a: string, b: string): number {
  const aLower = a.toLowerCase().trim()
  const bLower = b.toLowerCase().trim()

  // Exact match
  if (aLower === bLower) return 1.0

  // Check if one contains the other
  if (aLower.includes(bLower) || bLower.includes(aLower)) return 0.85

  // Levenshtein-like distance (simplified)
  let matches = 0
  const aWords = aLower.split(/\s+/)
  const bWords = bLower.split(/\s+/)

  for (const aWord of aWords) {
    for (const bWord of bWords) {
      if (aWord === bWord) matches++
    }
  }

  const similarity = (2 * matches) / (aWords.length + bWords.length)
  return similarity
}

// Helper function to detect if two components are likely duplicates
function areComponentsDuplicate(comp1: CareerComponent, comp2: CareerComponent): boolean {
  // Must be same type
  if (comp1.type !== comp2.type) return false

  // Title similarity must be high
  const titleSim = stringSimilarity(comp1.title, comp2.title)
  if (titleSim < 0.75) return false

  // For roles and projects, also check date overlap
  if ((comp1.type === 'role' || comp1.type === 'project') && (comp1.start_date || comp2.start_date)) {
    const start1 = comp1.start_date ? new Date(comp1.start_date).getTime() : 0
    const end1 = comp1.end_date ? new Date(comp1.end_date).getTime() : Infinity
    const start2 = comp2.start_date ? new Date(comp2.start_date).getTime() : 0
    const end2 = comp2.end_date ? new Date(comp2.end_date).getTime() : Infinity

    // If dates don't overlap significantly, probably different instances
    if (Math.abs(start1 - start2) > 365 * 24 * 60 * 60 * 1000) return false // More than 1 year apart
  }

  return true
}

// Helper function to deduplicate components
function deduplicateComponents(components: CareerComponent[]): CareerComponent[] {
  const seen = new Map<string, CareerComponent>()

  for (const comp of components) {
    // Create a key from type and normalized title
    const key = `${comp.type}:${comp.title.toLowerCase().trim()}`

    let foundDuplicate = false

    // Check against all existing keys for similarity
    for (const [existingKey, existingComp] of seen.entries()) {
      if (areComponentsDuplicate(existingComp, comp)) {
        // Merge with existing component
        const mergedTags = [...new Set([...(existingComp.tags || []), ...(comp.tags || [])])]
        const description =
          (comp.description?.length || 0) > (existingComp.description?.length || 0)
            ? comp.description
            : existingComp.description
        const impact_metrics = comp.impact_metrics || existingComp.impact_metrics
        const start_date = [existingComp.start_date, comp.start_date]
          .filter(Boolean)
          .sort()[0]
        const end_date = [existingComp.end_date, comp.end_date]
          .filter(Boolean)
          .sort()
          .pop()

        seen.set(existingKey, {
          ...existingComp,
          description,
          impact_metrics,
          tags: mergedTags,
          start_date,
          end_date,
        })

        foundDuplicate = true
        break
      }
    }

    if (!foundDuplicate) {
      seen.set(key, comp)
    }
  }

  return Array.from(seen.values())
}

const MERGE_PROMPT = `You are an expert career coach helping someone maintain and enrich their career timeline.

Your task is to intelligently merge NEW career information with their EXISTING timeline, avoiding duplicates.

EXISTING COMPONENTS (with index positions for reference):
{existing_components}

NEW INFORMATION PROVIDED:
{new_text}

Your job is to:
1. CRITICALLY: Avoid creating duplicates. If you see the same title/company with same/overlapping dates, it's the SAME component
2. Update existing components with new details, metrics, or tags
3. Only add genuinely NEW components that don't already exist

STRICT MATCHING RULES:
- ROLE: Same company + overlapping/same dates = SAME ROLE (UPDATE, don't create new)
- SKILL: Same skill name/title = SAME SKILL (MERGE tags, add details)
- PROJECT: Same project name or very similar title = SAME PROJECT (UPDATE with new metrics/details)
- ACHIEVEMENT: Same achievement or milestone = SAME ACHIEVEMENT (MERGE details/tags)

EXACT MATCHING KEYWORDS (most critical):
- If new text mentions a company name that appears in existing roles, check if it's the same role or a different role
- For skills: "Python" mentioned twice = same skill, not two Python entries
- For projects: "Mobile App" and "Built mobile app" = SAME PROJECT

CRITICAL: When in doubt about whether something is the same or different, ALWAYS PREFER UPDATE over NEW
This prevents duplicate "Python" entries, duplicate "Senior Engineer at Company X" roles, etc.

For UPDATES, include:
- "id": The exact index position (0-based) of the component from the list above
- "changes": Only the fields being updated
  - For tags: MERGE (add new tags to existing, don't replace)
  - For metrics: Combine if both exist
  - For description: Use the more detailed version
  - For dates: Extend the range if needed (earliest start, latest end)

For NEW components, only include if:
- Different company AND role/skill not in list, OR
- Same company but CLEARLY different role (different position, different timeframe with gap), OR
- Completely new skill/achievement not mentioned before

Return ONLY valid JSON, no markdown, no explanation.

Example:
{
  "updates": [
    {
      "id": 2,
      "changes": {
        "tags": ["React", "TypeScript", "New tag"],
        "impact_metrics": "50% performance improvement"
      }
    }
  ],
  "new": [
    {
      "type": "skill",
      "title": "Kubernetes",
      "description": "Container orchestration",
      "tags": ["Kubernetes", "DevOps"],
      "start_date": null,
      "end_date": null,
      "impact_metrics": null
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
- end_date: ISO date YYYY-MM-DD if applicable (use null if not mentioned)
- impact_metrics: Quantifiable results if applicable
- tags: Array of relevant keywords

CRITICAL RULES FOR DATES:
- For roles: Extract the exact dates the role was held (e.g., if it says "Senior Engineer 2018-2020", use those dates)
- For achievements/projects: ONLY use dates if they are explicitly mentioned for that achievement/project
  - Example: "In 2019, I led project X" → start_date: 2019
  - Example: "During my time at Company Y (2018-2020), I achieved Z" → Z should have NO dates unless Z has its own date
  - Example: "Built a mobile app" with no date mentioned → start_date: null, end_date: null
- NEVER infer achievement dates from surrounding role dates unless the achievement explicitly says it happened during that role's dates
- Skills have no dates (start_date: null, end_date: null always)
- If a date is truly unknown, use null instead of guessing

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
    const validTypes = ['achievement', 'skill', 'role', 'project', 'kpi', 'voice']

    if (Array.isArray(result)) {
      // Direct extraction format (first analysis)
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

      // Deduplicate components (merge near-duplicates)
      finalComponents = deduplicateComponents(finalComponents)

      console.log('✅ First analysis, extracted', finalComponents.length, 'components after deduplication')

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
      let newComps = result.new || []

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

      // Add new components - with CRITICAL duplicate detection
      if (newComps.length > 0) {
        // Prepare components for insertion
        const newComponentsToInsert = newComps
          .filter((comp: any) => comp.title && comp.type && validTypes.includes(comp.type))
          .map((comp: any) => ({
            type: comp.type,
            title: String(comp.title).substring(0, 200),
            description: comp.description
              ? String(comp.description).substring(0, 1000)
              : undefined,
            start_date: normalizeDate(comp.start_date),
            end_date: normalizeDate(comp.end_date),
            impact_metrics: comp.impact_metrics
              ? String(comp.impact_metrics).substring(0, 500)
              : undefined,
            tags: Array.isArray(comp.tags)
              ? comp.tags.map((t: any) => String(t).substring(0, 50)).slice(0, 10)
              : [],
          }))

        // CRITICAL: Check if any "new" components are actually duplicates of existing components
        // This catches cases where Claude missed merging
        const genuinelyNewComponents: CareerComponent[] = []

        for (const newComp of newComponentsToInsert) {
          let isDuplicate = false

          // Check against all existing components
          if (existingComponents) {
            for (const existing of existingComponents) {
              if (
                existing.type === newComp.type &&
                areComponentsDuplicate(
                  existing as CareerComponent,
                  newComp
                )
              ) {
                // This new component is actually a duplicate - skip it
                isDuplicate = true
                console.log(`⚠️ Skipped duplicate: "${newComp.title}" (matches existing "${existing.title}")`)
                break
              }
            }
          }

          if (!isDuplicate) {
            genuinelyNewComponents.push(newComp)
          }
        }

        // Deduplicate the new components among themselves
        const deduplicatedComps = deduplicateComponents(genuinelyNewComponents)

        if (deduplicatedComps.length > 0) {
          const { error: insertError } = await serverSupabase
            .from('career_components')
            .insert(
              deduplicatedComps.map((comp) => ({
                user_id: user.id,
                type: comp.type,
                title: comp.title,
                description: comp.description || null,
                start_date: comp.start_date || null,
                end_date: comp.end_date || null,
                impact_metrics: comp.impact_metrics || null,
                tags: comp.tags,
                source: 'claude_analysis',
              }))
            )

          if (insertError) {
            console.error('Error inserting new components:', insertError)
          }
        }

        console.log(
          `✅ Merge complete: ${updateCount} updated, ${deduplicatedComps.length} genuinely new components added (${newComponentsToInsert.length - deduplicatedComps.length} duplicates filtered)`
        )
      } else {
        console.log(`✅ Merge complete: ${updateCount} components updated`)
      }
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
