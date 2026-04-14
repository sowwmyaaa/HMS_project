/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hostel: {
          primary: '#0d4f8b',
          secondary: '#1a6bb3',
          accent: '#c41e3a',
          cream: '#f8f4e8',
          gold: '#c9a227',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
