import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'

interface DocumentAnalysis {
  type: 'cv' | 'coverLetter'
  content: string
  toneKeywords?: string
}

interface ApiResponse {
  success: boolean
  documents?: DocumentAnalysis[]
  components?: any[]
  voice?: { toneKeywords: string }
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { text } = req.body

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ success: false, error: 'Text is required' })
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    // Step 1: Split and classify documents
    const classifyResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `You are a document classifier. Analyze the following text which may contain multiple documents (CVs, cover letters, etc) mixed together.

Your task:
1. Identify where each document starts and ends (look for clear breaks, new person's name, "Dear", etc.)
2. Classify each as either "cv" or "coverLetter"
3. Extract the full text of each document, preserving all original content and formatting
4. Return ONLY valid JSON

CRITICAL: Ensure all JSON strings are properly escaped with backslashes for quotes and newlines.

Return EXACTLY this JSON structure (no markdown, no code blocks):
{"documents": [{"type": "cv", "content": "full text here"}, {"type": "coverLetter", "content": "full text here"}]}

Text to analyze:
${text}`,
        },
      ],
    })

    const classifyContent = classifyResponse.content[0]
    if (classifyContent.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    let jsonText = classifyContent.text.trim()

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7)
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3)
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3)
    }
    jsonText = jsonText.trim()

    let classified
    try {
      classified = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('Failed to parse Claude response. First 1000 chars:', jsonText.substring(0, 1000))
      console.error('Parse error:', parseError instanceof Error ? parseError.message : String(parseError))

      // Try to extract JSON object if it's embedded in other text
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          classified = JSON.parse(jsonMatch[0])
        } catch {
          throw new Error('Failed to parse document classification - the content may be too complex. Try pasting smaller sections.')
        }
      } else {
        throw new Error('Failed to parse document classification - the content may be too complex. Try pasting smaller sections.')
      }
    }
    const documents: DocumentAnalysis[] = classified.documents || []

    if (documents.length === 0) {
      return res.status(200).json({
        success: true,
        documents: [],
        components: [],
      })
    }

    // Step 2: Extract voice from cover letters
    let voiceToneKeywords = ''

    const coverLetters = documents.filter((doc) => doc.type === 'coverLetter')
    if (coverLetters.length > 0) {
      const voiceResponse = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Analyze the following cover letter(s) and extract the writer's communication tone and style.

Identify 5-8 keywords that describe their voice. Consider:
- Formality level (formal, conversational, casual)
- Writing style (narrative, direct, storytelling, data-driven)
- Personality signals (warm, confident, analytical, creative)
- Communication approach (collaborative, assertive, thoughtful, energetic)

Return ONLY a comma-separated list of keywords, no other text.

Cover letters:
${coverLetters.map((doc) => doc.content).join('\n\n---\n\n')}`,
          },
        ],
      })

      const voiceContent = voiceResponse.content[0]
      if (voiceContent.type === 'text') {
        voiceToneKeywords = voiceContent.text.trim()
      }
    }

    return res.status(200).json({
      success: true,
      documents,
      voice: voiceToneKeywords ? { toneKeywords: voiceToneKeywords } : undefined,
    })
  } catch (error) {
    console.error('Analyze mixed documents error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze documents',
    })
  }
}
