/**
 * Design System v1
 * Minimal, professional, refined.
 * Single source of truth for colors, spacing, typography.
 */

export const designSystem = {
  colors: {
    // Cool navy scale — dark surfaces, borders, secondary text.
    navy: {
      50: '#EEF1FB',
      100: '#D7DCF0',
      200: '#AEB6DE',
      300: '#7C88BD',
      400: '#525E92',
      500: '#333E6E',
      600: '#212B54',
      700: '#151C3D',
      800: '#0B1029',
      900: '#010722',
    },
    // Brand primary — the sole accent color
    blue: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      500: '#0959FE',
      600: '#0845D4',
      700: '#0633AA',
    },
    darkBlue: {
      50: '#F0F2FE',
      500: '#052790',
      600: '#041E76',
    },
    // Semantic — dark theme
    white: '#FFFFFF',
    text: '#F5F7FA', // near-white
    textSecondary: '#AEB6DE', // navy-200
    textTertiary: '#7C88BD', // navy-300
    border: '#212B54', // navy-600
    bg: '#010722', // navy-900 (page background)
    bgHover: '#0B1029', // navy-800 (surface / card background)
    accentBg: 'rgba(9, 89, 254, 0.14)', // translucent blue tint
    success: '#10B981',
    successBg: 'rgba(16, 185, 129, 0.14)',
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

  // Component-specific token configs — dark theme, blue as the sole accent
  components: {
    card: {
      bg: '#0B1029', // navy-800
      border: '1px solid #212B54', // navy-600
      borderRadius: '8px',
      padding: '12px',
      shadow: 'md',
    },
    button: {
      primary: {
        bg: '#0959FE',
        text: 'white',
        hover: '#0845D4',
      },
      secondary: {
        bg: '#151C3D', // navy-700
        text: '#F5F7FA',
        border: '1px solid #212B54', // navy-600
        hover: '#212B54',
      },
    },
    input: {
      bg: '#0B1029', // navy-800
      border: '1px solid #212B54', // navy-600
      borderRadius: '6px',
      padding: '8px 12px',
      focusBorder: '#0959FE',
      focusRing: '2px solid rgba(9, 89, 254, 0.2)',
    },
  },
} as const
