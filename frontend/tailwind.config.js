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
        blood: {
          50: '#ffebee',
          100: '#ffcdd2',
          200: '#ef9a9a',
          300: '#e57373',
          400: '#ef5350',
          500: '#f44336',
          600: '#e53935', // Primary theme red
          700: '#d32f2f',
          800: '#c62828',
          900: '#b71c1c',
        },
        cyber: {
          blue: '#1565C0',
          dark: '#0a0d14',
          card: '#111622',
          border: '#1e293b',
          glow: '#00f2fe'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(229, 57, 53, 0.2), 0 0 10px rgba(229, 57, 53, 0.2)' },
          '100%': { boxShadow: '0 0 15px rgba(229, 57, 53, 0.6), 0 0 25px rgba(229, 57, 53, 0.4)' },
        }
      }
    },
  },
  plugins: [],
}
