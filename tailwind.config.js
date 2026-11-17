/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nintendo: {
          primary: '#e60012',
          primaryHover: '#ac000d',
          fg: '#484848',
          muted: '#727272',
          neutralLight: '#c8c8c8',
          onPrimary: '#ffffff',
          canvas: '#ffffff',
          surface: '#f8f8f8',
          surfaceAlt: '#efefef',
          hairline: '#dadada',
          focusRing: '#3946a0',
          accentBlue: '#4b5cce',
        },
      },
      fontFamily: {
        sans: ['Geologica', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        'none': '0px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'round': '16px',
        'utility': '20px',
        'pill': '48px',
      },
      boxShadow: {
        'nintendo-card': '0 2px 10px rgba(0, 0, 0, 0.05)',
        'nintendo-float': '0 10px 30px -5px rgba(72, 72, 72, 0.15)',
        'nintendo-focus': '0 0 0 4px #3946a0',
      },
      animation: {
        'bell-ring': 'ring 0.5s ease-in-out infinite',
        'shake': 'shake 0.4s ease-in-out',
        'pulse-subtle': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        ring: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '20%, 60%': { transform: 'rotate(-15deg)' },
          '40%, 80%': { transform: 'rotate(15deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        }
      }
    },
  },
  plugins: [],
}
