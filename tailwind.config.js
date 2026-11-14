/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#060911',
          900: '#0B0F19',
          850: '#0E1524',
          800: '#141D30',
          750: '#1A253E',
          700: '#22304F',
          600: '#32476F',
        },
        cyan: {
          accent: '#00E5FF',
          glow: '#38BDF8',
        },
        lunar: {
          sun: '#F59E0B',
          sunGlow: '#FBBF24',
          earth: '#3B82F6',
          earthGlow: '#60A5FA',
          both: '#10B981',
          shadow: '#475569',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

