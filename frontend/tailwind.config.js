/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          primary: '#1a1b1e',
          secondary: '#2c2d31',
          accent: '#3b82f6',
          text: '#e2e8f0',
        }
      }
    },
  },
  plugins: [],
} 