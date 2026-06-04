/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#080b14',
        surface: '#0d1117',
        'surface-raised': '#161b22',
        'surface-high': '#1c2333',
        border: '#30363d',
        'border-muted': '#21262d',
        danger: '#f85149',
        warning: '#e3b341',
        success: '#3fb950',
        accent: '#388bfd',
        purple: '#a371f7',
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeSlideUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        'fade-slide-up': 'fadeSlideUp 0.45s ease forwards',
        'pulse-slow': 'pulse 2s ease infinite',
      },
    },
  },
  plugins: [],
}
