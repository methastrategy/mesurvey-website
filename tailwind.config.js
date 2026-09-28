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
        ios: {
          blue: '#007AFF',
          blueDark: '#0A84FF',
          indigo: '#5856D6',
          purple: '#AF52DE',
          teal: '#30B0C7',
          mint: '#00C7BE',
          gray: {
            50: '#F9F9FB',
            100: '#F2F2F7',
            200: '#E5E5EA',
            300: '#D1D1D6',
            400: '#C7C7CC',
            500: '#AEAEB2',
            600: '#8E8E93',
            700: '#636366',
            800: '#3A3A3C',
            900: '#1C1C1E',
            950: '#000000',
          }
        },
        survey: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7dc5fc',
          400: '#38a5f8',
          500: '#007AFF',
          600: '#0066D6',
          700: '#0052B3',
          800: '#0c3d7a',
          900: '#0f172a',
          950: '#0a0f1d',
        },
        ku: {
          green: '#006a4e',
          light: '#2e8b57',
          gold: '#e0a927',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Prompt', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'hairline': '0 0 0 1px rgba(0, 0, 0, 0.06)',
        'hairline-dark': '0 0 0 1px rgba(255, 255, 255, 0.08)',
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'tactile': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'tactile-hover': '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'rested': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
