/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0F2438',
        navyActive: '#1C3D5C',
        teal: '#0E7C86',
        pagebg: '#EEF2F6',
        ink: '#12344B',
        muted: '#5B6B7C',
      },
      fontFamily: {
        sans: ['Lato', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}
