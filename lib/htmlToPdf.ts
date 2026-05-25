// Convert HTML to PDF using html-pdf-node
import { convertHtmlString } from 'html-pdf-node'

export async function htmlToPdf(html: string): Promise<Buffer> {
  try {
    const options = {
      format: 'A4',
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
      printBackground: true,
    }

    const file = {
      content: html,
    }

    const buffer = await convertHtmlString(file, options)
    return buffer
  } catch (error) {
    console.error('HTML to PDF conversion error:', error)
    throw new Error(`Failed to convert HTML to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
