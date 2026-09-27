/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        survey: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        ku: {
          green: '#006a4e',
          light: '#2e8b57',
          gold: '#e0a927',
        }
      },
      fontFamily: {
        sans: ['Prompt', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sarabun: ['Sarabun', 'sans-serif'],
      },
      boxShadow: {
        'geo': '0 10px 25px -5px rgba(6, 78, 59, 0.08), 0 8px 10px -6px rgba(6, 78, 59, 0.04)',
        'geo-lg': '0 20px 30px -10px rgba(6, 78, 59, 0.15), 0 10px 15px -5px rgba(6, 78, 59, 0.08)',
      }
    },
  },
  plugins: [],
}
