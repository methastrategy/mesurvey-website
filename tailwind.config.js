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
        indigo: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
          DEFAULT: '#6366f1',
          hover: '#818cf8',
          pressed: '#4f46e5',
        },
        canvas: {
          light: '#ffffff',
          dark: '#0a0a0b',
          DEFAULT: 'var(--canvas)',
        },
        surface: {
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
        },
        hairline: {
          light: 'rgba(0, 0, 0, 0.08)',
          dark: 'rgba(255, 255, 255, 0.08)',
          DEFAULT: 'var(--border-hairline)',
        },
        amber: {
          DEFAULT: '#f59e0b',
          500: '#f59e0b',
        },
        emerald: {
          DEFAULT: '#10b981',
          500: '#10b981',
        },
        rose: {
          DEFAULT: '#f43f5e',
          500: '#f43f5e',
        },
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
          500: '#6366f1',
          600: '#4f46e5',
          700: '#0052B3',
          800: '#0c3d7a',
          900: '#0f172a',
          950: '#0a0a0b',
        },
        ku: {
          green: '#006a4e',
          light: '#2e8b57',
          gold: '#e0a927',
        }
      },
      borderRadius: {
        micro: '2px',
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'Prompt', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'SF Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'hairline': '0 0 0 1px rgba(0, 0, 0, 0.08)',
        'hairline-dark': '0 0 0 1px rgba(255, 255, 255, 0.08)',
        'indigo-glow': '0 4px 24px rgba(99, 102, 241, 0.08)',
        'focus-ring': '0 0 0 2px #6366f1',
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'tactile': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'tactile-hover': '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'rested': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
