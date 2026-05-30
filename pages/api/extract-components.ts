import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

interface ExtractedComponent {
  type: string
  title: string
  organization_name?: string | null
  start_date?: string | null
  end_date?: string | null
  primary_location?: string | null
  description?: string | null
  impact_metrics?: string | null
  tags?: string[]
}

// The career_components.start_date / end_date columns are Postgres `date`
// types, so loose values from the model ("2018-06", "2018", "Present") must be
// coerced to a full YYYY-MM-DD date or null before insert.
function normalizeDate(raw: any): string | null {
  if (!raw || typeof raw !== 'string') return null
  const s = raw.trim()
  if (!s || /^(present|current|now|ongoing|n\/?a)$/i.test(s)) return null
  const m = s.match(/(\d{4})(?:[-/.](\d{1,2}))?(?:[-/.](\d{1,2}))?/)
  if (!m) return null
  const year = m[1]
  const month = (m[2] || '01').padStart(2, '0')
  const day = (m[3] || '01').padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface ExtractResponse {
  success: boolean
  componentsAdded?: number
  components?: ExtractedComponent[]
  error?: string
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExtractResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    // Get auth token
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const token = authHeader.substring(7)

    // Create service role client
    const serverSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify user
    const { data: { user }, error: userError } = await serverSupabase.auth.getUser(token)
    if (userError || !user?.id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    // Resolve the source text to extract from. Two modes:
    //   1. Body text provided (e.g. freshly pasted CV from the Analyze flow):
    //      extract directly from that text.
    //   2. No body text (e.g. the "Extract components now" button): fall back to
    //      the user's stored CVs.
    const bodyText =
      typeof req.body?.text === 'string' ? req.body.text.trim() : ''

    let combinedText: string

    if (bodyText.length > 0) {
      combinedText = bodyText
      console.log('=== CV Component Extraction Debug (body text) ===')
      console.log('Body text length:', combinedText.length)
      console.log('First 500 chars:', combinedText.substring(0, 500))
      console.log('================================================')
    } else {
      // Fetch all user's stored CVs
      const { data: cvs, error: cvError } = await serverSupabase
        .from('cvs')
        .select('filename, extracted_text')
        .eq('user_id', user.id)

      if (cvError || !cvs || cvs.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No CVs found to extract from',
        })
      }

      // Combine all CV texts
      combinedText = cvs
        .map((cv) => `### ${cv.filename}\n${cv.extracted_text}`)
        .join('\n\n---\n\n')

      // Log details for debugging
      console.log('=== CV Component Extraction Debug (stored CVs) ===')
      console.log('Number of CVs found:', cvs.length)
      cvs.forEach((cv, idx) => {
        const textLength = cv.extracted_text?.length || 0
        console.log(`CV ${idx + 1}: "${cv.filename}"`)
        console.log(`  - extracted_text length: ${textLength}`)
        if (cv.extracted_text?.includes('[Text extraction failed')) {
          console.warn(`  - ⚠️ Contains extraction error message`)
        }
        if (textLength < 100) {
          console.warn(`  - ⚠️ Very short text (< 100 chars)`)
        }
      })
      console.log('Combined text length:', combinedText.length)
      console.log('First 500 chars of combined text:', combinedText.substring(0, 500))
      console.log('=================================================')
    }

    // Use Claude to extract components
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `You are an expert career coach. Analyze the following CV(s) and extract career components that will be used to build a professional profile.

Extract ONLY information that is explicitly stated in the documents. For each component, be specific and data-driven.

IMPORTANT — career progression: Create a SEPARATE "role" component for EVERY distinct position the person has held, INCLUDING multiple positions within the SAME company over time (promotions, title changes, lateral moves). Do NOT collapse a company into a single role and do NOT keep only the most recent title — each position is its own role component. For every role, include start_date and end_date (use "YYYY-MM" format, or "YYYY" if only the year is known) so growth within a company is preserved. For a role the person currently holds, set end_date to null. Include primary_location (e.g. "London, UK") when stated.

Return ONLY valid JSON in this exact format:
{
  "components": [
    {
      "type": "achievement",
      "title": "specific achievement title",
      "description": "what was accomplished and why it matters",
      "impact_metrics": "quantified result if available",
      "tags": ["relevant", "tags"]
    },
    {
      "type": "project",
      "title": "project name",
      "description": "what the project was and your role",
      "impact_metrics": "outcome/result",
      "tags": ["technology", "area"]
    },
    {
      "type": "kpi",
      "title": "metric or KPI achieved",
      "description": "what this measures",
      "impact_metrics": "the specific number/percentage",
      "tags": ["area"]
    },
    {
      "type": "skill",
      "title": "skill name",
      "description": "brief description of proficiency",
      "tags": ["category"]
    },
    {
      "type": "role",
      "title": "job title or position",
      "organization_name": "company or organization name",
      "start_date": "YYYY-MM when this position started (or YYYY if only year known)",
      "end_date": "YYYY-MM when this position ended, or null if it is the current role",
      "primary_location": "city, country if stated",
      "description": "key responsibilities and achievements",
      "impact_metrics": "key achievement in role",
      "tags": ["industry"]
    },
    {
      "type": "voice",
      "title": "communication style aspect",
      "description": "observed communication style from the documents",
      "tags": ["trait"]
    }
  ]
}

Documents to analyze:
${combinedText}`,
        },
      ],
    })

    // Extract JSON from response
    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    console.log('Claude response length:', responseText.length)
    console.log('Claude response first 500 chars:', responseText.substring(0, 500))

    let extractedComponents
    try {
      // Try to extract JSON from markdown code blocks if present
      let jsonText = responseText
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim()
      }
      extractedComponents = JSON.parse(jsonText)
      console.log('Successfully parsed JSON, components found:', extractedComponents.components?.length || 0)
    } catch (parseError) {
      console.error('JSON parse error:', responseText)
      return res.status(500).json({
        success: false,
        error: 'Failed to parse extracted components',
      })
    }

    // Save components to database
    if (!extractedComponents.components || extractedComponents.components.length === 0) {
      console.log('No components found in extraction response')
      return res.status(200).json({
        success: true,
        componentsAdded: 0,
        components: [],
      })
    }

    // Preview mode: return the extracted components for user review/approval
    // WITHOUT writing them to the library yet. The client adds the approved
    // ones via a follow-up insert. Triggered with ?preview=1.
    if (req.query.preview === '1') {
      const previewComponents: ExtractedComponent[] = extractedComponents.components.map(
        (component: any) => ({
          type: component.type,
          title: component.title,
          organization_name: component.organization_name || null,
          start_date: normalizeDate(component.start_date),
          end_date: normalizeDate(component.end_date),
          primary_location: component.primary_location || null,
          description: component.description || null,
          impact_metrics: component.impact_metrics || null,
          tags: Array.isArray(component.tags) ? component.tags : [],
        })
      )
      return res.status(200).json({
        success: true,
        components: previewComponents,
      })
    }

    const { error: insertError } = await serverSupabase
      .from('career_components')
      .insert(
        extractedComponents.components.map((component: any) => ({
          user_id: user.id,
          type: component.type,
          title: component.title,
          organization_name: component.organization_name || null,
          start_date: normalizeDate(component.start_date),
          end_date: normalizeDate(component.end_date),
          primary_location: component.primary_location || null,
          description: component.description || null,
          impact_metrics: component.impact_metrics || null,
          tags: component.tags || [],
          source: 'parsed_from_documents',
        }))
      )

    if (insertError) {
      console.error('Insert error:', insertError)
      return res.status(500).json({
        success: false,
        error: 'Failed to save extracted components',
      })
    }

    return res.status(200).json({
      success: true,
      componentsAdded: extractedComponents.components.length,
    })
  } catch (error) {
    console.error('Extraction error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
