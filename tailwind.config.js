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
        },
        animation: {
          'fade-in-down': 'fade-in-down 0.5s ease-out',
          'speakingBorder': 'speakingBorder 1s infinite',
        }
      },
    },
    variants: {
      extend: {},
    },
    plugins: [],
};
