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
        // Mid-century modern palette
        cream: '#FAF7F2',
        'warm-white': '#FEFDFB',
        tan: '#E8DFD4',
        mustard: '#C9A227',
        'burnt-orange': '#CC5500',
        walnut: '#3D2B1F',
        sage: '#87A878',
        olive: '#6B7F59',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      borderRadius: {
        DEFAULT: '6px',
        lg: '8px',
      },
    },
  },
  plugins: [],
}

export default config
