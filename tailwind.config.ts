import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // The engine sets --tl-font-sans from config.theme.fonts.sans.
        sans: ['var(--tl-font-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
