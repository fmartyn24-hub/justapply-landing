// Convert HTML to PDF using html-pdf-node with Chrome support
import { convertHtmlString } from 'html-pdf-node'

let browserPath: string | undefined

// Detect environment and set appropriate browser path
async function getBrowserPath(): Promise<string | undefined> {
  if (browserPath) return browserPath

  // For Vercel production, use @sparticuz/chromium
  if (process.env.VERCEL === '1') {
    try {
      const Chromium = (await import('@sparticuz/chromium')).default
      browserPath = await Chromium.executablePath()
      return browserPath
    } catch (error) {
      console.warn('Could not load Chromium from @sparticuz/chromium:', error)
    }
  }

  // For local development, system Chrome will be used automatically
  return undefined
}

export async function htmlToPdf(html: string): Promise<Buffer> {
  try {
    const executablePath = await getBrowserPath()

    const options = {
      format: 'A4',
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
      printBackground: true,
      args: ['--no-sandbox'],
      ...(executablePath && { args: ['--no-sandbox'] }),
    }

    const file = {
      content: html,
    }

    const buffer = await convertHtmlString(file, options)
    return buffer
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('HTML to PDF conversion error:', errorMsg)

    // Provide helpful error message for missing Chrome
    if (errorMsg.includes('Could not find Chrome') || errorMsg.includes('ENOENT')) {
      throw new Error(
        'Chrome/Chromium is not installed. ' +
          'Please install Chrome from https://www.google.com/chrome/ or Chromium for PDF export to work.'
      )
    }

    throw new Error(`Failed to convert HTML to PDF: ${errorMsg}`)
  }
}
