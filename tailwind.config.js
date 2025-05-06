/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    'node_modules/preline/dist/*.js',
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          blue: '#00f2ff',
          pink: '#ff00e4',
          green: '#00ff9f',
          yellow: '#ffee00',
        },
      },
    },
  },
  plugins: [
    require('preline/plugin'),
  ],
} 