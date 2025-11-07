/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg': {
          'primary': '#0f1419',
          'secondary': '#1a1f2e',
          'tertiary': '#1a1f2e',
        },
        'accent': {
          'pink': '#ec4899',
          'pink-hover': '#f472b6',
          'purple': '#ec4899',
          'blue': '#ec4899',
          'green': '#10b981',
          'red': '#ef4444',
        },
        'border': {
          'primary': '#2d3748',
        },
        'text': {
          'primary': '#e5e7eb',
          'secondary': '#9ca3af',
        },
        'reddit': {
          'orange': '#ff4500',
          'orange-dark': '#cc3700',
        },
        'success': {
          'green': '#10b981',
        },
        'error': {
          'red': '#ef4444',
        },
      },
    },
  },
  plugins: [],
}