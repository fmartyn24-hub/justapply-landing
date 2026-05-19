/**
 * Design System v1
 * Minimal, professional, refined.
 * Single source of truth for colors, spacing, typography.
 */

export const designSystem = {
  colors: {
    // Grayscale - primary
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    // Accent - single color for actions/highlights
    blue: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
    },
    // Semantic
    white: '#FFFFFF',
    text: '#1F2937', // gray-800
    textSecondary: '#6B7280', // gray-500
    textTertiary: '#9CA3AF', // gray-400
    border: '#E5E7EB', // gray-200
    bg: '#F9FAFB', // gray-50
    bgHover: '#F3F4F6', // gray-100
    accentBg: '#EFF6FF', // blue-50
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
  },

  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
  },

  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },

  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
  },

  // Component-specific token configs (remove gradients, use subtle styling)
  components: {
    card: {
      bg: 'white',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      padding: '12px',
      shadow: 'md',
    },
    button: {
      primary: {
        bg: '#2563EB',
        text: 'white',
        hover: '#1D4ED8',
      },
      secondary: {
        bg: '#F3F4F6',
        text: '#1F2937',
        border: '1px solid #E5E7EB',
        hover: '#E5E7EB',
      },
    },
    input: {
      bg: 'white',
      border: '1px solid #E5E7EB',
      borderRadius: '6px',
      padding: '8px 12px',
      focusBorder: '#3B82F6',
      focusRing: '2px solid rgba(59, 130, 246, 0.1)',
    },
  },
} as const
