/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],

  // ⛔ IMPORTANT to avoid conflicts with Quasar utility classes
  prefix: 'tw-',

  theme: {
    extend: {},
  },

  plugins: [],
}
