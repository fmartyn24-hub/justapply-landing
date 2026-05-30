// Convert HTML to PDF using Puppeteer with Chrome support
import puppeteer from 'puppeteer'
import { existsSync } from 'fs'

let cachedBrowser: any = null

// Get Chromium executable path for Vercel
async function getChromiumPath(): Promise<string | undefined> {
  // For Vercel production, use @sparticuz/chromium
  if (process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview') {
    try {
      const Chromium = (await import('@sparticuz/chromium')).default
      const path = await Chromium.executablePath()
      console.log('Using @sparticuz/chromium path:', path)
      return path
    } catch (error) {
      console.error('Error loading @sparticuz/chromium:', error)
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
      console.log('Found Chrome at:', path)
      return path
    }
  }

  return undefined
}

async function getBrowser() {
  if (cachedBrowser) {
    return cachedBrowser
  }

  const executablePath = await getChromiumPath()

  const launchOptions: any = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  }

  if (executablePath) {
    launchOptions.executablePath = executablePath
  }

  cachedBrowser = await puppeteer.launch(launchOptions)
  return cachedBrowser
}

export async function htmlToPdf(html: string): Promise<Buffer> {
  let browser = null
  try {
    browser = await getBrowser()
    const page = await browser.newPage()

    // Set viewport and paper format for PDF
    await page.setViewport({ width: 1200, height: 1600 })

    // Load HTML content
    await page.setContent(html, { waitUntil: 'networkidle0' })

    // Generate PDF
    const buffer = await page.pdf({
      format: 'A4',
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
      printBackground: true,
      scale: 1,
    })

    await page.close()

    return Buffer.from(buffer)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('HTML to PDF conversion error:', {
      message: errorMsg,
      vercel: process.env.VERCEL,
      env: process.env.VERCEL_ENV,
      stack: error instanceof Error ? error.stack : undefined,
    })

    throw new Error(`Failed to convert HTML to PDF: ${errorMsg}`)
  }
}
