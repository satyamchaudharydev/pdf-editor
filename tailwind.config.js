/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'oklch(0.985 0.004 255)',
        ink: 'oklch(0.22 0.012 255)',
        muted: 'oklch(0.53 0.012 255)',
        line: 'oklch(0.9 0.007 255)',
        accent: 'oklch(0.55 0.16 255)'
      },
      boxShadow: {
        editor: '0 18px 60px oklch(0.22 0.012 255 / 0.12)'
      }
    }
  },
  plugins: []
}
