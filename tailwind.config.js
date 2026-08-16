/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0959FE',
        dark: '#010722',
        light: '#f5f5f5',
        // Cool navy scale — replaces the old orange/magenta accents for a
        // dark-leaning, modern app UI built from the logo's own blue/near-black.
        // 900 matches `dark` above; use for surfaces, borders and secondary text.
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
        accent: {
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
