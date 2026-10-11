import { Inter, Instrument_Serif } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

export default function App({ Component, pageProps }) {
  return (
    <div className={`${inter.variable} ${serif.variable} font-sans`}>
      <Component {...pageProps} />
      {/* Vercel Web Analytics (page views) + Speed Insights (Core Web Vitals).
          Both are no-ops locally and only report once enabled in the Vercel dashboard. */}
      <Analytics />
      <SpeedInsights />
    </div>
  )
}
