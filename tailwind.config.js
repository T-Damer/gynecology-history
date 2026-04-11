/** @type {import("@types/tailwindcss/tailwind-config").TailwindConfig } */
module.exports = {
  content: ['./index.html', './src/**/!(tailwind).{ts,tsx}'],
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      spacing: {
        'safe-bottom': 'calc(env(safe-area-inset-bottom) + 1.25rem)',
      },
    },
  },
}
