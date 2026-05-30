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
      console.log('✓ Using @sparticuz/chromium at:', path)
      return path
    } catch (error) {
      console.warn('⚠ Could not load @sparticuz/chromium, will try system Chrome:', error instanceof Error ? error.message : String(error))
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
      console.log('✓ Found Chrome at:', path)
      return path
    }
  }

  console.warn('⚠ No Chrome/Chromium binary found, launching with default')
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
          '--disable-extensions',
          '--disable-plugins',
          '--disable-web-resources',
        ],
      }

      if (executablePath) {
        launchOptions.executablePath = executablePath
      }

      console.log('Launching browser with options:', {
        headless: launchOptions.headless,
        executablePath: executablePath ? 'set' : 'default',
      })

      cachedBrowser = await puppeteer.launch(launchOptions)
      console.log('✓ Browser launched successfully')
      return cachedBrowser
    } finally {
      browserCreationInProgress = null
    }
  })()

  return browserCreationInProgress
}

// Simple HTML cleanup to reduce size and potential issues
function cleanHtmlForPdf(html: string): string {
  // Remove scripts
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  // Remove style tags (keep inline styles)
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  // Remove comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '')
  return cleaned
}

export async function htmlToPdf(html: string): Promise<Buffer> {
  let page: any = null
  const startTime = Date.now()

  try {
    console.log('Starting PDF generation...')
    const browser = await getBrowser()

    console.log('Creating new page...')
    page = await browser.newPage()

    // Set up error handlers
    page.on('error', (err: Error) => {
      console.error('Page error event:', err.message)
    })

    page.on('pageerror', (err: Error) => {
      console.error('Page javascript error:', err.message)
    })

    // Clean up HTML to reduce memory usage
    const cleanedHtml = cleanHtmlForPdf(html)
    console.log(`HTML size: ${html.length} bytes -> ${cleanedHtml.length} bytes after cleanup`)

    // Set viewport for A4 size
    console.log('Setting viewport...')
    await page.setViewport({ width: 794, height: 1123 })

    // Load HTML content with timeout
    console.log('Setting page content...')
    await Promise.race([
      page.setContent(cleanedHtml, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('setContent timeout')), 20000)
      ),
    ])

    console.log('Waiting for fonts and images...')
    await page.waitForTimeout(500)

    // Generate PDF
    console.log('Generating PDF...')
    const pdfPromise = page.pdf({
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

    // Add timeout to PDF generation
    const buffer = await Promise.race([
      pdfPromise,
      new Promise<Buffer>((_, reject) =>
        setTimeout(() => reject(new Error('PDF generation timeout after 30s')), 30000)
      ),
    ])

    const duration = Date.now() - startTime
    console.log(`✓ PDF generated successfully in ${duration}ms`)

    return Buffer.from(buffer)
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error(`✗ PDF conversion failed after ${duration}ms:`, {
      message: errorMsg,
      vercel: process.env.VERCEL,
      env: process.env.VERCEL_ENV,
    })

    // Invalidate browser on crash
    if (errorMsg.includes('Session closed') || errorMsg.includes('Protocol error')) {
      console.log('Invalidating browser due to crash')
      cachedBrowser = null
    }

    throw new Error(`Failed to convert HTML to PDF: ${errorMsg}`)
  } finally {
    // Always close the page, but don't close browser (keep it cached)
    if (page) {
      try {
        await page.close()
      } catch (err) {
        console.error('Error closing page:', err instanceof Error ? err.message : String(err))
      }
    }
  }
}
