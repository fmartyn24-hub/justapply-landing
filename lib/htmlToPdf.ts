// Convert HTML to PDF using html-pdf-node with Chrome support
import { generatePdf } from 'html-pdf-node'
import { execSync } from 'child_process'
import { existsSync } from 'fs'

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

  // For local development, detect Chrome/Chromium
  const chromePaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS Chrome
    '/opt/homebrew/bin/chromium', // macOS Homebrew Chromium
    '/usr/bin/chromium', // Linux Chromium
    '/usr/bin/google-chrome', // Linux Chrome
    '/snap/bin/chromium', // Linux snap
  ]

  for (const path of chromePaths) {
    if (existsSync(path)) {
      browserPath = path
      return browserPath
    }
  }

  return undefined
}

export async function htmlToPdf(html: string): Promise<Buffer> {
  try {
    const executablePath = await getBrowserPath()

    const args = ['--no-sandbox', '--disable-setuid-sandbox']

    const options: any = {
      format: 'A4',
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
      printBackground: true,
      args: args,
    }

    // Add executable path if detected
    if (executablePath) {
      options.executablePath = executablePath
    }

    const file = {
      content: html,
    }

    const buffer = await generatePdf(file, options)
    return buffer
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('HTML to PDF conversion error:', errorMsg)

    // Provide helpful error message for missing Chrome
    if (errorMsg.includes('Could not find Chrome') || errorMsg.includes('ENOENT') || errorMsg.includes('Failed to launch')) {
      throw new Error(
        'Chrome/Chromium is not installed. ' +
          'Please install Chrome from https://www.google.com/chrome/ or use: brew install chromium'
      )
    }

    throw new Error(`Failed to convert HTML to PDF: ${errorMsg}`)
  }
}
