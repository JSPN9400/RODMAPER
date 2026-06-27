/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0effe',
          100: '#e3e0fd',
          200: '#cbc5fc',
          300: '#b0a4f9',
          400: '#9480f5',
          500: '#7c6af7',
          600: '#6b55ee',
          700: '#5c44d9',
          800: '#4b38b1',
          900: '#3d2f8e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
