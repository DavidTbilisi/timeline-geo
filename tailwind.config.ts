import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans Georgian"', 'sans-serif'],
      },
      colors: {
        period: {
          1:  '#ad1f26',
          2:  '#db2f2c',
          3:  '#bb3380',
          4:  '#903a95',
          5:  '#63479b',
          6:  '#3b6eb5',
          7:  '#23a6c5',
          8:  '#33bdbb',
          9:  '#52b148',
          10: '#b6bf34',
          11: '#eec826',
          12: '#e9a327',
          13: '#ed7c2c',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
