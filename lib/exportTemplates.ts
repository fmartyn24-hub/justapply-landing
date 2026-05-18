export interface ExportTemplate {
  name: string
  id: 'modern' | 'professional' | 'ats'
  description: string
  colors: {
    primary: string
    heading: string
    text: string
    background?: string
    accent?: string
  }
  fonts: {
    headingSize: number
    bodySize: number
    lineHeight: number
  }
}

export const EXPORT_TEMPLATES: ExportTemplate[] = [
  {
    name: 'Modern',
    id: 'modern',
    description: 'Bold, colorful design with accent colors. Perfect for creative and tech roles.',
    colors: {
      primary: '2563EB', // Blue
      heading: '1F2937', // Dark gray
      text: '374151', // Medium gray
      background: 'DBEAFE', // Light blue
      accent: 'FF6B35', // Orange
    },
    fonts: {
      headingSize: 26,
      bodySize: 11,
      lineHeight: 280,
    },
  },
  {
    name: 'Professional',
    id: 'professional',
    description: 'Clean and minimal corporate design. Ideal for finance, law, and traditional companies.',
    colors: {
      primary: '1E3A8A', // Navy blue
      heading: '1F2937', // Dark gray
      text: '374151', // Medium gray
      accent: '6B7280', // Lighter gray
    },
    fonts: {
      headingSize: 24,
      bodySize: 11,
      lineHeight: 260,
    },
  },
  {
    name: 'ATS',
    id: 'ats',
    description: 'Plain text format optimized for Applicant Tracking Systems. Maximum compatibility.',
    colors: {
      primary: '000000', // Black
      heading: '000000', // Black
      text: '000000', // Black
    },
    fonts: {
      headingSize: 12, // Same as body for ATS
      bodySize: 11,
      lineHeight: 240,
    },
  },
]
