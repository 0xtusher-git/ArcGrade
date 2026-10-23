/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0b1424',
          dark: '#081120',
          deeper: '#060b16',
        },
        teal: {
          DEFAULT: '#2dd4bf',
          light: '#5eead4',
          dark: '#14b8a6',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'x-slider': 'x-slider 40s linear infinite',
      },
      keyframes: {
        'x-slider': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(calc(-50% - 1.25rem))' },
        },
      },
    },
  },
  plugins: [],
};
