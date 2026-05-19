/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0959FE',
        dark: '#010722',
        light: '#f5f5f5',
        orange: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#FE6F09',
          700: '#EA580C',
          800: '#C2410C',
          900: '#7C2D12',
        },
        magenta: {
          50: '#FDF2F8',
          100: '#FCE7F3',
          200: '#FBCFE8',
          300: '#F8B4D8',
          400: '#F472B6',
          500: '#EC4899',
          600: '#90055D',
          700: '#831843',
          800: '#500724',
          900: '#3D0A1F',
        },
        accent: {
          orange: '#FE6F09',
          magenta: '#90055D',
          navy: '#052790',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
