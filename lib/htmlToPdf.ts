// Headless-Chrome HTML → PDF renderer.
//
// Renders a full HTML document to a print-accurate PDF. It works in two
// environments without code changes:
//   • Local dev: uses the Chromium that ships with the full `puppeteer` package.
//   • Vercel / AWS Lambda: uses `@sparticuz/chromium` (a Lambda-sized Chromium)
//     driven by `puppeteer-core`, which keeps the serverless bundle within limits.
//
// Heavy deps are imported lazily so they never load during a normal request that
// doesn't export a PDF (and so the build doesn't try to bundle Chromium binaries).

// Detect a serverless (Lambda/Vercel) runtime.
const isServerless = !!(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL)

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  let browser: any
  try {
    if (isServerless) {
      // Serverless: puppeteer-core + @sparticuz/chromium
      const chromium = (await import('@sparticuz/chromium')).default
      const puppeteer = await import('puppeteer-core')
      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
      })
    } else {
      // Local dev: full puppeteer with its bundled Chromium.
      const puppeteer = await import('puppeteer')
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })
    }

    const page = await browser.newPage()
    // Render at the on-screen document width so layouts match the preview.
    await page.setContent(html, { waitUntil: 'networkidle0' })
    await page.emulateMediaType('print')

    const pdf = await page.pdf({
      format: 'letter',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })

    return Buffer.from(pdf)
  } finally {
    if (browser) {
      await browser.close().catch(() => {})
    }
  }
}
