/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: 'media', // or 'media' or 'class'
  theme: {
    extend: {
      keyframes: {
        'fade-in-down': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        'speakingBorder': {
          '0%, 100%': { borderColor: 'blue', boxShadow: '0 0 10px blue' },
          '50%': { borderColor: 'lightblue', boxShadow: '0 0 20px lightblue' },
        },
        'fadeIn': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slideIn': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in-down': 'fade-in-down 0.5s ease-out',
        'speakingBorder': 'speakingBorder 1s infinite',
        'fadeIn': 'fadeIn 0.5s ease-out',
        'slideIn': 'slideIn 0.5s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin-slow 3s linear infinite', // 3초 동안 한 바퀴 회전
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};