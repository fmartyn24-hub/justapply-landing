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

${text}

Return as JSON array of components with structure: type, title, description, start_date, end_date, impact_metrics, tags.`
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
      finalComponents = result
        .filter((comp) => comp.title && comp.type)
        .map((comp) => ({
          type: comp.type,
          title: String(comp.title).substring(0, 200),
          description: comp.description ? String(comp.description).substring(0, 1000) : undefined,
          start_date: comp.start_date || undefined,
          end_date: comp.end_date || undefined,
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
            finalComponents.map((comp) => ({
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
              start_date: changes.start_date ?? component.start_date,
              end_date: changes.end_date ?? component.end_date,
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
              .filter((comp) => comp.title && comp.type)
              .map((comp) => ({
                user_id: user.id,
                type: comp.type,
                title: String(comp.title).substring(0, 200),
                description: comp.description
                  ? String(comp.description).substring(0, 1000)
                  : null,
                start_date: comp.start_date || null,
                end_date: comp.end_date || null,
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
