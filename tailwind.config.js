/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        'wax-deep': '#000814',
        'wax-navy': '#03045E',
        'wax-ocean': '#023E8A',
        'wax-blue': '#0077B6',
        'wax-mid': '#0096C7',
        'wax-wave': '#00B4D8',
        'wax-light': '#48CAE4',
        'wax-foam': '#90E0EF',
        'wax-gold': '#FFB703',
        'wax-ok': '#06D6A0',
        'wax-warn': '#FFD60A',
        'wax-err': '#E63946',
      },
      fontFamily: {
        'syne': ['Syne', 'sans-serif'],
        'dm': ['DM Sans', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}