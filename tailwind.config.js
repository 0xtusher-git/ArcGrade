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
          DEFAULT: '#1a3a5c',
          dark: '#0d1f33',
          deeper: '#07111e',
        },
        teal: {
          DEFAULT: '#4a9aba',
          light: '#6bb8d4',
          dark: '#2d7a9a',
        },
        beige: {
          DEFAULT: '#f5e6c8',
          light: '#faf3e5',
          dark: '#e8d4a8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'sky-gradient': 'linear-gradient(135deg, #07111e 0%, #1a3a5c 40%, #2d7a9a 70%, #4a9aba 90%, #f5e6c8 100%)',
        'card-glass': 'linear-gradient(135deg, rgba(26,58,92,0.6) 0%, rgba(74,154,186,0.15) 100%)',
        'score-good': 'linear-gradient(135deg, #00b894, #00cec9)',
        'score-neutral': 'linear-gradient(135deg, #fdcb6e, #e17055)',
        'score-bad': 'linear-gradient(135deg, #e17055, #d63031)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 8s linear infinite',
        'score-fill': 'scoreFill 1.5s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        glow: {
          from: { boxShadow: '0 0 20px rgba(74,154,186,0.3)' },
          to: { boxShadow: '0 0 40px rgba(74,154,186,0.7), 0 0 80px rgba(74,154,186,0.3)' },
        },
        scoreFill: {
          from: { strokeDashoffset: '440' },
          to: { strokeDashoffset: 'var(--dash-offset)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
