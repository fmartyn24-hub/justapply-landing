import type { NextApiRequest, NextApiResponse } from 'next'
import { Anthropic } from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

interface CareerComponent {
  type: 'achievement' | 'skill' | 'role' | 'project' | 'kpi' | 'voice'
  title: string
  description?: string
  start_date?: string
  end_date?: string
  impact_metrics?: string
  tags: string[]
}

interface AnalyzeResponse {
  success: boolean
  components?: CareerComponent[]
  error?: string
  details?: string
}

const client = new Anthropic()

const ANALYZE_PROMPT = `You are an expert career coach and resume analyzer. Your task is to analyze the provided career information (CV, cover letter, or other career details) and extract meaningful career components.

Extract and interpret the following types of components:
- achievement: Accomplishments, awards, certifications, major milestones
- skill: Technical skills, soft skills, languages, tools, frameworks (list the most important ones)
- role: Job titles, positions, roles held
- project: Significant projects, initiatives, or work you've led
- kpi: Key performance indicators, metrics, quantifiable results
- voice: Personal branding, unique value proposition, career philosophy (extract 1-2 key messages)

For each component, provide:
- type: The category (achievement, skill, role, project, kpi, or voice)
- title: A concise, impactful title
- description: A detailed explanation (1-2 sentences)
- start_date: ISO date if applicable (YYYY-MM-DD format)
- end_date: ISO date if applicable (YYYY-MM-DD format)
- impact_metrics: Quantifiable results or impact (e.g., "Increased sales by 30%")
- tags: Array of relevant keywords/skills

Return the response as a valid JSON array of components. Only return the JSON array, no other text.

Example format:
[
  {
    "type": "achievement",
    "title": "Led product launch",
    "description": "Spearheaded cross-functional team to launch new feature that increased user retention by 25%",
    "start_date": "2023-06-01",
    "end_date": "2023-09-15",
    "impact_metrics": "25% increase in user retention",
    "tags": ["leadership", "product", "cross-functional"]
  },
  {
    "type": "skill",
    "title": "React & TypeScript",
    "description": "Expert-level proficiency in modern React development with TypeScript, including hooks, state management, and performance optimization",
    "tags": ["React", "TypeScript", "Frontend"]
  }
]

Now analyze this career information and extract all relevant components:`

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

    // Call Claude API
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${ANALYZE_PROMPT}\n\n---\n\n${text}`,
        },
      ],
    })

    // Extract text from response
    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')

    console.log('✅ Claude response received, length:', responseText.length)

    // Parse JSON from response (handle code blocks)
    let jsonStr = responseText
    const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim()
    }

    let components: CareerComponent[] = []
    try {
      components = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError)
      console.error('Response text:', responseText.substring(0, 500))
      return res.status(500).json({
        success: false,
        error: 'Failed to parse analysis results',
        details: 'Claude response could not be parsed as JSON',
      })
    }

    // Validate and sanitize components
    if (!Array.isArray(components)) {
      return res.status(500).json({
        success: false,
        error: 'Invalid response format',
        details: 'Expected an array of components',
      })
    }

    // Ensure all components have required fields
    const validatedComponents = components
      .filter((comp) => comp.title && comp.type)
      .map((comp) => ({
        type: comp.type as CareerComponent['type'],
        title: String(comp.title).substring(0, 200),
        description: comp.description ? String(comp.description).substring(0, 1000) : undefined,
        start_date: comp.start_date || undefined,
        end_date: comp.end_date || undefined,
        impact_metrics: comp.impact_metrics ? String(comp.impact_metrics).substring(0, 500) : undefined,
        tags: Array.isArray(comp.tags) ? comp.tags.map((t) => String(t).substring(0, 50)).slice(0, 10) : [],
      }))

    console.log('✅ Analysis complete, extracted', validatedComponents.length, 'components')

    return res.status(200).json({
      success: true,
      components: validatedComponents,
    })
  } catch (error) {
    console.error('Analysis handler error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
