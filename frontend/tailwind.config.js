/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#baddff',
          300: '#7cc2ff',
          400: '#36a3ff',
          500: '#0c85f2',
          600: '#0068d0',
          700: '#0053a8',
          800: '#04478b',
          900: '#0a3c73',
          950: '#07264c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
