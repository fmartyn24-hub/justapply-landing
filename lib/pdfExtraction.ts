import pdfParse from 'pdf-parse/lib/pdf-parse.js'
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract'

/**
 * Robust PDF text extraction with multiple fallback strategies
 * 1. Fast path: pdf-parse for standard PDFs
 * 2. Fallback: AWS Textract for scanned/complex PDFs
 * Works with any PDF format, including scanned documents
 */
export async function extractTextFromPDFRobust(buffer: Buffer): Promise<string> {
  console.log('🔍 Starting PDF extraction, buffer size:', buffer.length)

  // Strategy 1: Try pdf-parse (works for most standard PDFs, very fast)
  try {
    console.log('  → Strategy 1: Trying pdf-parse (fast, for standard PDFs)')
    const data = await pdfParse(buffer)

    if (data.text && data.text.trim().length > 50) {
      console.log('  ✅ pdf-parse successful, extracted', data.text.length, 'characters')
      return data.text
    } else {
      console.log('  ⚠️ pdf-parse returned minimal text:', data.text.length, 'chars, trying fallback...')
      throw new Error('Insufficient text extracted')
    }
  } catch (error) {
    console.warn('  ℹ️ pdf-parse not suitable for this PDF:', error instanceof Error ? error.message : error)
  }

  // Strategy 2: Fall back to AWS Textract (works with ANY PDF, including scanned)
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    try {
      console.log('  → Strategy 2: Using AWS Textract (handles scanned PDFs, complex formats)')
      const text = await extractWithTextract(buffer)
      console.log('  ✅ AWS Textract successful, extracted', text.length, 'characters')
      return text
    } catch (error) {
      console.warn('  ❌ AWS Textract failed:', error instanceof Error ? error.message : error)
    }
  } else {
    console.log('  ℹ️ AWS Textract not configured (AWS credentials not found)')
  }

  // No extraction method succeeded
  throw new Error(
    'PDF text extraction failed. This usually means the PDF is:\n' +
    '- A scanned image (no embedded text)\n' +
    '- Encrypted or password-protected\n' +
    '- Corrupted or malformed\n\n' +
    'To fix this:\n' +
    '1. Try saving the PDF again from the source (Word, Acrobat, etc.)\n' +
    '2. Convert to DOCX format - this usually works better\n' +
    '3. Or paste your CV text directly in the text area'
  )
}

/**
 * Extract text from PDF using AWS Textract
 * Handles scanned documents, complex layouts, and any PDF format
 */
async function extractWithTextract(buffer: Buffer): Promise<string> {
  const client = new TextractClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })

  const command = new DetectDocumentTextCommand({
    Document: {
      Bytes: buffer,
    },
  })

  const response = await client.send(command)

  // Extract text from Textract response
  const text = response.Blocks?.filter((block) => block.BlockType === 'LINE')
    .map((block) => block.Text)
    .join('\n') || ''

  if (!text.trim()) {
    throw new Error('Textract returned no text')
  }

  return text
}

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth')
    console.log('🔍 Starting DOCX extraction, buffer size:', buffer.length)
    const result = await mammoth.extractRawText({
      arrayBuffer: buffer as unknown as ArrayBuffer,
    })
    console.log('  ✅ DOCX extraction successful, extracted', result.value.length, 'characters')
    return result.value
  } catch (error) {
    console.error('  ❌ DOCX extraction error:', error instanceof Error ? error.message : error)
    throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    return extractTextFromPDFRobust(buffer)
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return extractTextFromDOCX(buffer)
  }
  throw new Error('Unsupported file type. Please use PDF or DOCX.')
}
