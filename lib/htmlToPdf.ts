// Convert HTML to PDF using Puppeteer with Chrome support
import puppeteer from 'puppeteer'
import { existsSync } from 'fs'

let cachedBrowser: any = null
let browserCreationInProgress: Promise<any> | null = null

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
  // If browser creation is already in progress, wait for it
  if (browserCreationInProgress) {
    return browserCreationInProgress
  }

  // If we have a cached browser, check if it's still connected
  if (cachedBrowser) {
    try {
      await cachedBrowser.version()
      return cachedBrowser
    } catch (error) {
      console.log('Cached browser disconnected, creating new one')
      cachedBrowser = null
    }
  }

  // Create a new browser
  browserCreationInProgress = (async () => {
    try {
      const executablePath = await getChromiumPath()

      const launchOptions: any = {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Important for low-memory environments
          '--disable-gpu',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-default-apps',
        ],
      }

      if (executablePath) {
        launchOptions.executablePath = executablePath
      }

      cachedBrowser = await puppeteer.launch(launchOptions)
      return cachedBrowser
    } finally {
      browserCreationInProgress = null
    }
  })()

  return browserCreationInProgress
}

export async function htmlToPdf(html: string): Promise<Buffer> {
  let page = null
  try {
    const browser = await getBrowser()
    page = await browser.newPage()

    // Set up error handlers
    page.on('error', (err: Error) => {
      console.error('Page error:', err)
    })

    page.on('pageerror', (err: Error) => {
      console.error('Page javascript error:', err)
    })

    // Set viewport for A4 size
    await page.setViewport({ width: 794, height: 1123 })

    // Load HTML content with longer timeout
    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 30000 // 30 second timeout
    })

    // Wait a bit for any styles to load
    await page.waitForTimeout(1000)

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
      preferCSSPageSize: true,
      scale: 1,
    })

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
  } finally {
    // Always close the page, but don't close browser (keep it cached)
    if (page) {
      try {
        await page.close()
      } catch (err) {
        console.error('Error closing page:', err)
      }
    }
  }
}
