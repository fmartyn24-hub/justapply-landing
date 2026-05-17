import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import { randomUUID } from 'crypto'

interface UploadResponse {
  success: boolean
  cvId?: string
  filename?: string
  extractedTextLength?: number
  error?: string
  status?: number
}

// Initialize text extraction
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    console.log('Starting PDF extraction, buffer size:', buffer.length)
    const data = await pdfParse(buffer)
    console.log('PDF extraction successful, text length:', data.text.length)
    return data.text
  } catch (error) {
    console.error('PDF extraction error:', error instanceof Error ? error.message : error)
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    console.log('Starting DOCX extraction, buffer size:', buffer.length)
    const result = await mammoth.extractRawText({
      arrayBuffer: buffer as unknown as ArrayBuffer
    })
    console.log('DOCX extraction successful, text length:', result.value.length)
    return result.value
  } catch (error) {
    console.error('DOCX extraction error:', error instanceof Error ? error.message : error)
    throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    return extractTextFromPDF(buffer)
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return extractTextFromDOCX(buffer)
  }
  throw new Error('Unsupported file type')
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse>
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

    // Create authenticated Supabase client with the user's token
    const authenticatedSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    // Verify token and get user
    const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser(token)

    if (userError || !user?.id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const userId = user.id

    // Parse request body
    const contentType = req.headers['content-type']
    if (!contentType?.includes('application/octet-stream')) {
      return res.status(400).json({ success: false, error: 'Invalid content type' })
    }

    const fileBuffer = req.body as Buffer
    const filename = req.headers['x-filename'] as string
    const mimeType = req.headers['x-mime-type'] as string

    // Validate file
    const maxSize = 10 * 1024 * 1024 // 10 MB
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ success: false, error: 'No file provided' })
    }

    if (fileBuffer.length > maxSize) {
      return res.status(413).json({ success: false, error: 'File must be under 10 MB' })
    }

    if (!allowedTypes.includes(mimeType)) {
      return res.status(400).json({ success: false, error: 'Only PDF and DOCX files are supported' })
    }

    if (!filename) {
      return res.status(400).json({ success: false, error: 'Filename is required' })
    }

    // Extract text from file (optional - non-blocking)
    let extractedText = ''
    try {
      extractedText = await extractText(fileBuffer, mimeType)
      console.log('Text extraction successful')
    } catch (error) {
      console.error('Text extraction failed (continuing without text):', error)
      // Non-blocking - continue with empty text
      extractedText = '[Text extraction failed - file uploaded but text not extracted]'
    }

    // Truncate text if too long (50k chars)
    const maxTextLength = 50000
    if (extractedText.length > maxTextLength) {
      extractedText = extractedText.substring(0, maxTextLength)
    }

    // Generate storage path: /user_id/uuid-filename
    const fileExtension = mimeType === 'application/pdf' ? 'pdf' : 'docx'
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 100)
    const uuid = randomUUID()
    const storagePath = `${userId}/${uuid}-${sanitizedFilename}.${fileExtension}`

    // Upload to Supabase Storage
    const { error: uploadError } = await authenticatedSupabase.storage
      .from('cvs')
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError.error,
        details: JSON.stringify(uploadError),
        storagePath,
        fileSize: fileBuffer.length,
      })
      return res.status(500).json({
        success: false,
        error: 'Failed to upload file to storage',
        details: uploadError.message
      })
    }

    // Save metadata to cvs table
    const { data: cvRecord, error: dbError } = await authenticatedSupabase
      .from('cvs')
      .insert({
        user_id: userId,
        filename: sanitizedFilename,
        storage_path: storagePath,
        file_size_bytes: fileBuffer.length,
        mime_type: mimeType,
        extracted_text: extractedText,
        metadata: {
          originalFilename: filename,
          uploadedAt: new Date().toISOString(),
        },
      })
      .select('id')
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      // Attempt to clean up storage
      await authenticatedSupabase.storage.from('cvs').remove([storagePath])
      return res.status(500).json({ success: false, error: 'Failed to save CV metadata' })
    }

    // Update user_profiles to mark cv_uploaded = true
    const { error: updateError } = await authenticatedSupabase
      .from('user_profiles')
      .update({ cv_uploaded: true, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      // Don't fail the upload if this fails, but log it
    }

    return res.status(200).json({
      success: true,
      cvId: cvRecord.id,
      filename: sanitizedFilename,
      extractedTextLength: extractedText.length,
    })
  } catch (error) {
    console.error('Upload handler error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
