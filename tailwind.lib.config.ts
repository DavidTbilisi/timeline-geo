import type { Config } from 'tailwindcss'

/**
 * Tailwind for the published library: utilities used by the engine's own
 * components only, no preflight (consumers keep their own base styles; the
 * engine stylesheet carries the reset it needs).
 */
export default {
  content: ['./src/lib/**/*.{vue,ts}'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--tl-font-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
