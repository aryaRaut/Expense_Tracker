/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3525cd',
        'primary-container': '#4f46e5',
        secondary: '#006c49',
        tertiary: '#960014',
        surface: '#fcf8ff',
        'surface-container-low': '#f5f2ff',
        'surface-container-highest': '#e4e1ee',
        'surface-bright': '#ffffff',
        'on-surface': '#1b1b24',
        'outline-variant': '#c7c4d8',
      },
      fontFamily: {
        manrope: ['Manrope', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '3rem',
      },
      boxShadow: {
        'ambient': '0px 20px 40px rgba(27, 27, 36, 0.06)',
      }
    },
  },
  plugins: [],
}
