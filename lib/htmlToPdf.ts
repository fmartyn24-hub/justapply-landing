// Convert HTML to PDF using puppeteer
import puppeteer from 'puppeteer'

export async function htmlToPdf(html: string): Promise<Buffer> {
  let browser
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()

    // Set content
    await page.setContent(html, { waitUntil: 'load' })

    // Generate PDF with A4 size
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
      printBackground: true,
    })

    return Buffer.from(pdf)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
