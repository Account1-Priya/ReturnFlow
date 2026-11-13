/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // Dark-mode surface scale: a soft, blue-tinted charcoal.
        // Deliberately not pure black — keeps depth and reduces halation.
        night: {
          950: '#070b13', // deepest (page edge / overlays)
          900: '#0d1321', // page background
          850: '#121a2a', // recessed panels, table headers
          800: '#182133', // card / elevated surface
          750: '#1f2a40', // chips, inputs, hover fills
          700: '#2a3750', // borders, dividers
          600: '#3c4c6b', // strong borders, muted controls
        },
      },
      transitionDuration: {
        250: '250ms',
      },
    },
  },
  plugins: [],
};
