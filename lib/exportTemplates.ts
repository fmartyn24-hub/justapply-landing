export interface ExportTemplate {
  name: string
  id: 'modern' | 'professional' | 'ats' | 'minimalist' | 'creative' | 'academic' | 'executive'
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
    name: 'Minimalist',
    id: 'minimalist',
    description: 'Clean, elegant, and modern. Focuses on content and readability.',
    colors: {
      primary: '000000', // Black
      heading: '1A1A1A', // Dark black
      text: '2A2A2A', // Dark gray
      accent: 'E0E0E0', // Light gray
    },
    fonts: {
      headingSize: 22,
      bodySize: 10,
      lineHeight: 260,
    },
  },
  {
    name: 'Creative',
    id: 'creative',
    description: 'Bold, eye-catching design with sidebar layout. Perfect for designers and creatives.',
    colors: {
      primary: '667EEA', // Purple
      heading: '667EEA', // Purple
      text: '333333', // Dark gray
      background: '764BA2', // Dark purple
      accent: 'FF6B35', // Orange
    },
    fonts: {
      headingSize: 24,
      bodySize: 11,
      lineHeight: 280,
    },
  },
  {
    name: 'Academic',
    id: 'academic',
    description: 'Scholarly and structured format. Ideal for research, education, and academic roles.',
    colors: {
      primary: '1F1F1F', // Dark black
      heading: '1F1F1F', // Dark black
      text: '333333', // Dark gray
      accent: '555555', // Medium gray
    },
    fonts: {
      headingSize: 24,
      bodySize: 11,
      lineHeight: 280,
    },
  },
  {
    name: 'Executive',
    id: 'executive',
    description: 'Premium, sophisticated design. Perfect for C-suite and senior leadership roles.',
    colors: {
      primary: '1A1A2E', // Dark navy
      heading: '1A1A2E', // Dark navy
      text: '2C3E50', // Slate gray
      background: 'F8F9FA', // Light gray
      accent: 'D4A574', // Gold/tan
    },
    fonts: {
      headingSize: 22,
      bodySize: 10,
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
