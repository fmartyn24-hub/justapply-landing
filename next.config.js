/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Keep the headless-Chrome packages out of the webpack bundle. @sparticuz/
    // chromium ships native/brotli binaries that must be required at runtime (not
    // bundled), and puppeteer's bundled Chromium should never be webpacked.
    serverComponentsExternalPackages: ['puppeteer', 'puppeteer-core', '@sparticuz/chromium-min'],
  },
}

module.exports = nextConfig
