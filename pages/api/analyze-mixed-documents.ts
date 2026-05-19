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
          content: `Analyze the following text which may contain multiple documents (CVs, cover letters, etc). Identify each document and classify it.

Return ONLY this format (no other text, no markdown):
DOCUMENT_TYPE:cv
CONTENT_START
[full CV text here]
CONTENT_END
DOCUMENT_TYPE:coverLetter
CONTENT_START
[full cover letter text here]
CONTENT_END

Use DOCUMENT_TYPE:cv for CVs/resumes and DOCUMENT_TYPE:coverLetter for cover letters.
Include all original text between CONTENT_START and CONTENT_END.

Text to analyze:
${text}`,
        },
      ],
    })

    const classifyContent = classifyResponse.content[0]
    if (classifyContent.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    const responseText = classifyContent.text.trim()

    // Parse delimiter-based format: DOCUMENT_TYPE:xxx\nCONTENT_START\n...\nCONTENT_END
    const documents: Array<{ type: 'cv' | 'coverLetter'; content: string }> = []
    const docMatches = responseText.match(/DOCUMENT_TYPE:(cv|coverLetter)\s*\nCONTENT_START\s*\n([\s\S]*?)\nCONTENT_END/g)

    if (docMatches && docMatches.length > 0) {
      for (const match of docMatches) {
        const typeMatch = match.match(/DOCUMENT_TYPE:(cv|coverLetter)/)
        const contentMatch = match.match(/CONTENT_START\s*\n([\s\S]*?)\nCONTENT_END/)

        if (typeMatch && contentMatch) {
          const type = typeMatch[1] as 'cv' | 'coverLetter'
          const content = contentMatch[1].trim()
          if (content.length > 50) {
            // Only include if content is substantial
            documents.push({ type, content })
          }
        }
      }
    }

    if (documents.length === 0) {
      console.error('No documents parsed from response:', responseText.substring(0, 500))
      throw new Error('No documents found in the pasted text')
    }

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
