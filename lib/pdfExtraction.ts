// @ts-ignore - pdf-parse lacks type definitions
import pdfParse from 'pdf-parse/lib/pdf-parse.js'

/**
 * Robust PDF text extraction with fallback strategies
 * 1. Fast path: pdf-parse for standard PDFs
 * 2. Fallback: OCR.Space API for complex PDFs
 */
export async function extractTextFromPDFRobust(buffer: Buffer): Promise<string> {
  console.log('🔍 Starting PDF extraction, buffer size:', buffer.length)

  // Strategy 1: Try pdf-parse (works for most standard PDFs, very fast)
  try {
    console.log('  → Strategy 1: Trying pdf-parse')
    const data = await pdfParse(buffer)

    if (data.text && data.text.trim().length > 50) {
      console.log('  ✅ pdf-parse successful, extracted', data.text.length, 'characters')
      return data.text
    } else {
      console.log('  ⚠️ pdf-parse returned minimal text:', data.text.length, 'chars, trying OCR.Space...')
      throw new Error('Insufficient text extracted')
    }
  } catch (error) {
    console.warn('  ℹ️ pdf-parse not suitable:', error instanceof Error ? error.message : error)
  }

  // Strategy 2: Fall back to OCR.Space API (handles complex/scanned PDFs)
  try {
    console.log('  → Strategy 2: Using OCR.Space API for complex PDFs')
    const text = await extractWithOCRSpace(buffer)
    console.log('  ✅ OCR.Space successful, extracted', text.length, 'characters')
    return text
  } catch (error) {
    console.warn('  ❌ OCR.Space also failed:', error instanceof Error ? error.message : error)
  }

  // Both methods failed
  throw new Error(
    'PDF text extraction failed. This PDF may be:\n' +
    '- Encrypted or password-protected\n' +
    '- Corrupted or malformed\n' +
    '- In an unsupported format\n\n' +
    'Try re-saving from the original source (Word, Google Docs, etc.) as a fresh PDF.'
  )
}

/**
 * Extract text from PDF using OCR.Space API (free tier)
 * Handles scanned documents, complex layouts, and any PDF format
 * Reliable fallback for PDFs that pdf-parse cannot handle
 */
async function extractWithOCRSpace(buffer: Buffer): Promise<string> {
  const base64 = buffer.toString('base64')

  const response = await fetch('https://api.ocr.space/parse', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base64Image: `data:application/pdf;base64,${base64}`,
      apikey: 'K87899142C88957', // OCR.Space free API key
      language: 'eng',
    }),
  })

  if (!response.ok) {
    throw new Error(`OCR.Space API error: ${response.statusText}`)
  }

  // @ts-ignore - OCR.Space response types
  const result = await response.json()

  if (result.IsErroredOnProcessing) {
    throw new Error(`OCR.Space error: ${result.ErrorMessage || 'Unknown error'}`)
  }

  const text = result.ParsedText || ''

  if (!text.trim()) {
    throw new Error('OCR.Space returned no text')
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
