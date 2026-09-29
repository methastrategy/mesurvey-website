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
        canvas: {
          light: '#f3f1eb',
          dark: '#050505',
          DEFAULT: 'var(--bg)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          1: 'var(--surface)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        hairline: {
          light: 'rgba(20, 36, 27, 0.14)',
          dark: '#262626',
          DEFAULT: 'var(--border)',
        },
        ink: {
          1: 'var(--text-1)',
          2: 'var(--text-2)',
          3: 'var(--text-3)',
          DEFAULT: 'var(--text-1)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          2: 'var(--accent-2)',
          text: 'var(--accent-text)',
        },
        indigo: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#34d399',
          500: '#15803d',
          600: '#15803d',
          700: '#166534',
          800: '#14532d',
          900: '#052e16',
          950: '#022c22',
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent)',
          pressed: 'var(--accent)',
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
        ku: {
          green: '#15803d',
          light: '#34d399',
          gold: '#b45309',
        }
      },
      borderRadius: {
        card: 'var(--card-radius)',
        btn: 'var(--btn-radius)',
        micro: '2px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Prompt', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Prompt', 'sans-serif'],
        mono: ['"Geist Mono"', '"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'card': 'var(--shadow)',
        'hairline': '0 0 0 1px var(--border)',
        'focus-ring': '0 0 0 2px var(--accent)',
      }
    },
  },
  plugins: [],
}
