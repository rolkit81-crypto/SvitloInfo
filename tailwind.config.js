/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      animation: {
        'slide-left': 'slideInLeft 0.5s ease-out forwards',
        'slide-right': 'slideInRight 0.5s ease-out forwards',
        'dropdown': 'fadeInScale 0.2s ease-out forwards',
        'cinematic-in': 'cinematicIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'cinematic-out': 'cinematicOut 0.6s cubic-bezier(0.7, 0, 0.84, 0) forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
