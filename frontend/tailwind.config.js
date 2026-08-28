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
        dark: {
          bg: '#090D16',
          card: '#111827',
          border: '#1F2937',
          hover: '#1F293D'
        },
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          accent: '#06B6D4'
        },
        status: {
          safe: '#10B981',
          safeBg: 'rgba(16, 185, 129, 0.12)',
          monitor: '#F59E0B',
          monitorBg: 'rgba(245, 158, 11, 0.12)',
          risk: '#EF4444',
          riskBg: 'rgba(239, 68, 68, 0.12)',
          anomaly: '#EC4899',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
