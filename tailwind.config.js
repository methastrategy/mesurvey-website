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
        'ios-sm': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'ios': '0 4px 16px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'ios-lg': '0 12px 32px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.03)',
        'ios-glow': '0 0 20px -3px rgba(0, 122, 255, 0.25)',
        'geo': '0 10px 25px -5px rgba(0, 122, 255, 0.08), 0 8px 10px -6px rgba(0, 122, 255, 0.04)',
        'geo-lg': '0 20px 30px -10px rgba(0, 122, 255, 0.15), 0 10px 15px -5px rgba(0, 122, 255, 0.08)',
      }
    },
  },
  plugins: [],
}
