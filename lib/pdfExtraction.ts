// @ts-ignore - pdf-parse lacks type definitions
import pdfParse from 'pdf-parse/lib/pdf-parse.js'

/**
 * Robust PDF text extraction with fallback strategies
 * 1. pdfjs-dist: modern, actively-maintained parser — handles the widest range of real-world PDFs
 * 2. pdf-parse: fast fallback for anything pdfjs-dist trips on
 * 3. OCR.Space API: last resort for scanned/image-only PDFs (free tier caps at 1MB)
 */
export async function extractTextFromPDFRobust(buffer: Buffer): Promise<string> {
  console.log('🔍 Starting PDF extraction, buffer size:', buffer.length)

  try {
    console.log('  → Strategy 1: Trying pdfjs-dist')
    const text = await extractWithPdfjs(buffer)
    if (text && text.trim().length > 50) {
      console.log('  ✅ pdfjs-dist successful, extracted', text.length, 'characters')
      return text
    }
    console.log('  ⚠️ pdfjs-dist returned minimal text:', text.length, 'chars, trying pdf-parse...')
  } catch (error) {
    console.warn('  ℹ️ pdfjs-dist not suitable:', error instanceof Error ? error.message : error)
  }

  try {
    console.log('  → Strategy 2: Trying pdf-parse')
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

  // Strategy 3: Fall back to OCR.Space API (handles complex/scanned PDFs, free tier: 1MB max)
  const OCR_SIZE_LIMIT = 1024 * 1024
  if (buffer.length > OCR_SIZE_LIMIT) {
    console.warn('  ⚠️ Skipping OCR.Space — file exceeds free-tier 1MB limit:', buffer.length, 'bytes')
  } else {
    try {
      console.log('  → Strategy 3: Using OCR.Space API for complex PDFs')
      const text = await extractWithOCRSpace(buffer)
      console.log('  ✅ OCR.Space successful, extracted', text.length, 'characters')
      return text
    } catch (error) {
      console.warn('  ❌ OCR.Space also failed:', error instanceof Error ? error.message : error)
    }
  }

  // All methods failed
  throw new Error(
    'PDF text extraction failed. This PDF may be:\n' +
    '- Encrypted or password-protected\n' +
    '- A scanned image over 1MB (too large for our OCR fallback)\n' +
    '- Corrupted or malformed\n\n' +
    'Try re-saving from the original source (Word, Google Docs, etc.) as a fresh PDF, or upload a DOCX instead.'
  )
}

async function extractWithPdfjs(buffer: Buffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    isEvalSupported: false,
  }).promise

  const pages: string[] = []
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum)
    const content = await page.getTextContent()
    const pageText = content.items.map((item: any) => ('str' in item ? item.str : '')).join(' ')
    pages.push(pageText)
  }
  await doc.destroy()
  return pages.join('\n\n')
}

/**
 * Extract text from PDF using OCR.Space API (free tier)
 * Handles scanned documents, complex layouts, and any PDF format
 * Reliable fallback for PDFs that pdfjs-dist/pdf-parse cannot handle
 */
async function extractWithOCRSpace(buffer: Buffer): Promise<string> {
  const base64 = buffer.toString('base64')

  const response = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base64Image: `data:application/pdf;base64,${base64}`,
      apikey: 'K87899142C88957', // OCR.Space free API key
      language: 'eng',
      filetype: 'PDF',
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
    const result = await mammoth.extractRawText({ buffer })
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
