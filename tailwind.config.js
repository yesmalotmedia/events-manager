/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-main)', 'Helvetica', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef3fa',
          100: '#d5e2f2',
          200: '#adc5e5',
          300: '#7aa3d4',
          400: '#4A7FA5',
          500: '#2C4A7C',
          600: '#243d68',
          700: '#1c3054',
          800: '#142340',
          900: '#0c172c',
        },
        gold: {
          50:  '#fdf8e7',
          100: '#f9edbb',
          200: '#f3d96e',
          300: '#e8c136',
          400: '#C8990A',
          500: '#B8860B',
          600: '#9a7009',
          700: '#7a5907',
          800: '#5c4205',
          900: '#3d2c03',
        },
        stone: {
          50:  '#FAF7F2',
          100: '#F5F0E8',
          200: '#E8DFD0',
          300: '#D4C5AD',
          400: '#B8A48A',
          500: '#96806A',
          600: '#755F4D',
          700: '#574437',
          800: '#3A2D25',
          900: '#2A1F14',
          950: '#1a1209',
        }
      }
    },
  },
  plugins: [],
}
