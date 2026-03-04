import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fdfaf7',
          100: '#faf4ec',
          200: '#f5e8d5',
          DEFAULT: '#faf4ec',
        },
        peach: {
          50: '#fff4ed',
          100: '#ffe8d5',
          200: '#ffc9a0',
          300: '#ffa96b',
          400: '#ff8a42',
          500: '#f96b1b',
          600: '#ea5311',
          DEFAULT: '#ff8a42',
        },
        rose: {
          50: '#fff1f3',
          100: '#ffe4e9',
          200: '#fecdd6',
          300: '#fda4b5',
          400: '#fb7191',
          500: '#f43f6f',
          DEFAULT: '#fb7191',
        },
        sage: {
          50: '#f2f8f5',
          100: '#dcf0e6',
          200: '#bbdece',
          300: '#89c5ac',
          400: '#57a58a',
          500: '#3d8a72',
          DEFAULT: '#57a58a',
        },
        lavender: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          DEFAULT: '#c4b5fd',
        },
        warm: {
          50: '#faf9f7',
          100: '#f0ede8',
          200: '#ddd8cf',
          300: '#c4bdb1',
          400: '#a89d8f',
          500: '#8c7f71',
          600: '#6b5f52',
          700: '#4a3f35',
          800: '#2d2419',
          900: '#1a130e',
          DEFAULT: '#4a3f35',
        },
      },
      fontFamily: {
        sans: ['var(--font-nunito)', 'Nunito', 'system-ui', 'sans-serif'],
        heading: ['var(--font-poppins)', 'Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'warm-sm': '0 1px 3px rgba(74, 63, 53, 0.08), 0 1px 2px rgba(74, 63, 53, 0.06)',
        'warm': '0 4px 6px rgba(74, 63, 53, 0.07), 0 2px 4px rgba(74, 63, 53, 0.06)',
        'warm-md': '0 6px 16px rgba(74, 63, 53, 0.1), 0 3px 6px rgba(74, 63, 53, 0.07)',
        'warm-lg': '0 12px 28px rgba(74, 63, 53, 0.12), 0 6px 12px rgba(74, 63, 53, 0.08)',
      },
    },
  },
  plugins: [],
}

export default config
