/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ─── BizOS Brand Colors ────────────────────────
        brand: {
          50:  '#EEEDFF',
          100: '#D4D1FF',
          200: '#AEA8FF',
          300: '#8E86FF',
          400: '#7B72FF',
          500: '#6C63FF', // Primary indigo-violet
          600: '#5A52E0',
          700: '#4840B8',
          800: '#362F90',
          900: '#241F68',
        },
        // ─── Surface Colors (Dark Theme) ───────────────
        surface: {
          DEFAULT: '#0D0D0F', // Base background
          raised:  '#141417', // Card surfaces
          overlay: '#1A1A1F', // Dropdowns, modals
          border:  '#1E1E24', // Default borders
          hover:   '#2A2A35', // Hover state borders
        },
        // ─── Semantic Colors ───────────────────────────
        success: {
          DEFAULT: '#10B981',
          light:   '#34D399',
          dark:    '#059669',
          muted:   '#10B98115',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light:   '#FBBF24',
          dark:    '#D97706',
          muted:   '#F59E0B15',
        },
        danger: {
          DEFAULT: '#EF4444',
          light:   '#F87171',
          dark:    '#DC2626',
          muted:   '#EF444415',
        },
        // ─── Text Colors ──────────────────────────────
        text: {
          primary:   '#F5F5F7',
          secondary: '#A1A1AA',
          tertiary:  '#71717A',
          disabled:  '#52525B',
        },
        // ─── Landing page background ──────────────────
        landing: '#08080A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'display': ['clamp(3rem, 5vw, 5rem)', { lineHeight: '1.1', fontWeight: '700' }],
        'heading': ['clamp(2rem, 3.5vw, 3.5rem)', { lineHeight: '1.15', fontWeight: '700' }],
        'subheading': ['clamp(1.25rem, 2vw, 1.75rem)', { lineHeight: '1.4', fontWeight: '500' }],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'typing': 'typing 1.5s steps(40) forwards',
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(108, 99, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(108, 99, 255, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6C63FF 0%, #8B5CF6 50%, #A78BFA 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0D0D0F 0%, #141417 100%)',
        'gradient-card': 'linear-gradient(145deg, #141417 0%, #1A1A1F 100%)',
        'gradient-glow': 'radial-gradient(ellipse at center, rgba(108, 99, 255, 0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(108, 99, 255, 0.15)',
        'glow-md': '0 0 20px rgba(108, 99, 255, 0.2)',
        'glow-lg': '0 0 40px rgba(108, 99, 255, 0.3)',
      },
    },
  },
  plugins: [],
}
