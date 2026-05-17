import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

interface ExtractResponse {
  success: boolean
  componentsAdded?: number
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

    // Fetch all user's CVs
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
    const combinedText = cvs
      .map((cv) => `### ${cv.filename}\n${cv.extracted_text}`)
      .join('\n\n---\n\n')

    // Use Claude to extract components
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `You are an expert career coach. Analyze the following CV(s) and extract career components that will be used to build a professional profile.

Extract ONLY information that is explicitly stated in the documents. For each component, be specific and data-driven.

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
      "description": "company and key responsibilities",
      "impact_metrics": "duration or key achievement in role",
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

    let extractedComponents
    try {
      extractedComponents = JSON.parse(responseText)
    } catch (parseError) {
      console.error('JSON parse error:', responseText)
      return res.status(500).json({
        success: false,
        error: 'Failed to parse extracted components',
      })
    }

    // Save components to database
    if (!extractedComponents.components || extractedComponents.components.length === 0) {
      return res.status(200).json({
        success: true,
        componentsAdded: 0,
      })
    }

    const { error: insertError } = await serverSupabase
      .from('career_components')
      .insert(
        extractedComponents.components.map((component: any) => ({
          user_id: user.id,
          type: component.type,
          title: component.title,
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
