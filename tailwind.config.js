/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        slateDeep: '#0f172a',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(249, 115, 22, 0.25), 0 10px 25px rgba(15, 23, 42, 0.45)',
      },
    },
  },
  plugins: [],
}
