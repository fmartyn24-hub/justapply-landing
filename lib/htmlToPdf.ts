// Headless-Chrome HTML → PDF renderer.
//
// Renders a full HTML document to a print-accurate PDF. It works in two
// environments without code changes:
//   • Local dev: uses the Chromium that ships with the full `puppeteer` package.
//   • Vercel / AWS Lambda: uses `@sparticuz/chromium-min` driven by
//     `puppeteer-core`. The min package ships NO binary, so the deployed lambda
//     stays small; the matching Chromium pack is downloaded once per cold start
//     from a remote URL and cached in /tmp. This sidesteps Vercel's serverless
//     size limit (the full binary is ~66MB) and the file-tracing problem where
//     the bundler drops the `bin/*.br` files.
//
// Heavy deps are imported lazily so they never load during a normal request that
// doesn't export a PDF (and so the build doesn't try to bundle Chromium binaries).

// Detect a serverless (Lambda/Vercel) runtime.
const isServerless = !!(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL)

// Remote Chromium pack matching @sparticuz/chromium-min's version (x64 = Vercel).
// Overridable via env so the URL isn't pinned in code if the version bumps.
const CHROMIUM_PACK_URL =
  process.env.CHROMIUM_PACK_URL ||
  'https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar'

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  let browser: any
  try {
    if (isServerless) {
      // Serverless: puppeteer-core + @sparticuz/chromium-min (remote binary)
      const chromium = (await import('@sparticuz/chromium-min')).default
      const puppeteer = await import('puppeteer-core')
      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
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
