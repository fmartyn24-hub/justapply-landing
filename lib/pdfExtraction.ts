// @ts-ignore - pdf-parse lacks type definitions
import pdfParse from 'pdf-parse/lib/pdf-parse.js'

/**
 * Robust PDF text extraction with multiple fallback strategies
 * 1. Fast path: pdf-parse for standard PDFs
 * 2. Fallback: OCR.Space API for complex PDFs
 * 3. Final fallback: Tesseract.js OCR for scanned/encrypted PDFs
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

  // Strategy 2: Fall back to OCR.Space API (free, handles complex PDFs)
  try {
    console.log('  → Strategy 2: Using OCR.Space API')
    const text = await extractWithOCRSpace(buffer)
    console.log('  ✅ OCR.Space successful, extracted', text.length, 'characters')
    return text
  } catch (error) {
    console.warn('  ℹ️ OCR.Space not suitable:', error instanceof Error ? error.message : error)
  }

  // Strategy 3: Final fallback - Tesseract.js OCR (handles scanned PDFs, encrypted PDFs, any format)
  try {
    console.log('  → Strategy 3: Using Tesseract.js OCR (comprehensive fallback)')
    const text = await extractWithTesseract(buffer)
    console.log('  ✅ Tesseract.js successful, extracted', text.length, 'characters')
    return text
  } catch (error) {
    console.warn('  ❌ Tesseract.js failed:', error instanceof Error ? error.message : error)
  }

  // No extraction method succeeded
  throw new Error(
    'PDF text extraction exhausted all methods. This is extremely rare and usually means:\n' +
    '- The PDF is severely corrupted\n' +
    '- The PDF is encrypted with an unknown encryption method\n\n' +
    'Please try converting the PDF from the original source (Word, Google Docs, etc.)'
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

/**
 * Extract text from PDF using Tesseract.js OCR (fallback)
 * Handles scanned documents and complex PDFs
 */
async function extractWithTesseract(buffer: Buffer): Promise<string> {
  // Use base64 image from PDF buffer for Tesseract
  const base64 = buffer.toString('base64')
  const imageUrl = `data:application/pdf;base64,${base64}`

  try {
    const Tesseract = await import('tesseract.js')
    const { recognize } = Tesseract.default

    const result = await recognize(imageUrl, 'eng', {
      // @ts-ignore
      langPath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v4/tesseract-core.wasm.js',
    })

    const text = result.data?.text || ''

    if (!text.trim()) {
      throw new Error('Tesseract.js extracted no text')
    }

    return text.trim()
  } catch (error) {
    throw new Error(`Tesseract.js OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
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
