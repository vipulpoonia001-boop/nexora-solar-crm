/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef8f3',
          100: '#fdeee3',
          200: '#fbdcc9',
          300: '#f9c9b0',
          400: '#f7a65a',
          500: '#f59e0b',
          600: '#e8920d',
          700: '#d4750e',
          800: '#b85a0e',
          900: '#95460f',
        },
        solar: {
          50: '#fef8f3',
          100: '#fce9d6',
          200: '#fad8b8',
          300: '#f8c79a',
          400: '#fb923c',
          500: '#f59e0b',
          600: '#e8920d',
          700: '#d4750e',
          800: '#b85a0e',
          900: '#95460f',
        },
        accent: '#fb923c',
        secondary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'gradient-shift': 'gradientShift 8s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(245, 158, 11, 0.4)' },
          '100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.6)' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      boxShadow: {
        'soft': '0 2px 15px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 25px rgba(0, 0, 0, 0.12)',
        'large': '0 8px 40px rgba(0, 0, 0, 0.16)',
        'glow': '0 0 20px rgba(245, 158, 11, 0.25)',
        'warm-glow': '0 0 30px rgba(245, 158, 11, 0.3)',
      },
    },
  },
  plugins: [],
}
