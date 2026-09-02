/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Inter"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        ink: {
          950: '#05050a',
          900: '#090911',
          850: '#0c0c16',
          800: '#12121e',
          700: '#1a1a2a',
        },
      },
      animation: {
        'float-slow': 'floatY 5s ease-in-out infinite',
        'scroll-dot': 'scrollDot 2.2s ease-in-out infinite',
      },
      keyframes: {
        floatY: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        scrollDot: {
          '0%': { opacity: '0', transform: 'translateY(0)' },
          '30%': { opacity: '1' },
          '100%': { opacity: '0', transform: 'translateY(14px)' },
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 40px -8px rgba(34, 211, 238, 0.45)',
        'glow-violet': '0 0 40px -8px rgba(139, 92, 246, 0.45)',
      },
    },
  },
  plugins: [],
};
