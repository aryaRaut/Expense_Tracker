/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        'primary-container': '#8b5cf6',
        secondary: '#0ea5e9',
        tertiary: '#f43f5e',
        surface: '#f8fafc',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f1f5f9',
        'surface-container-highest': '#e2e8f0',
        'surface-bright': '#ffffff',
        'on-surface': '#1A202C',
        'on-surface-variant': '#64748B',
        'outline-variant': '#cbd5e1',
      },
      fontFamily: {
        manrope: ['Manrope', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '3rem',
      },
      boxShadow: {
        'ambient': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      }
    },
  },
  plugins: [],
}
