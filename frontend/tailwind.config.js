/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base
        bg: {
          primary: '#080C14',
          secondary: '#0D1421',
          card: '#111827',
          elevated: '#1A2235',
        },
        // Brand
        amber: {
          400: '#FBBF24',
          500: '#F59E0B',
          DEFAULT: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
        },
        cyan: {
          400: '#22D3EE',
          500: '#06B6D4',
          DEFAULT: '#0891B2',
          600: '#0E7490',
        },
        // Severity
        severity: {
          low: '#22C55E',
          medium: '#F59E0B',
          high: '#F97316',
          critical: '#EF4444',
        },
        // Status
        status: {
          open: '#3B82F6',
          progress: '#8B5CF6',
          resolved: '#22C55E',
          closed: '#6B7280',
        },
        border: {
          DEFAULT: '#1E293B',
          subtle: '#0F172A',
          focus: '#F97316',
        }
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        body: ['"Manrope"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(249,115,22,0.04) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(249,115,22,0.04) 1px, transparent 1px)`,
        'hero-gradient': 'radial-gradient(ellipse 80% 60% at 60% 40%, rgba(249,115,22,0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 80% at 20% 80%, rgba(6,182,212,0.08) 0%, transparent 70%)',
        'card-gradient': 'linear-gradient(135deg, rgba(26,34,53,0.8) 0%, rgba(17,24,39,0.9) 100%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'count-up': 'countUp 0.8s ease-out',
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(-100%)' },
          '50%': { transform: 'translateY(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(249,115,22,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(249,115,22,0.6), 0 0 40px rgba(249,115,22,0.2)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'amber': '0 0 20px rgba(249,115,22,0.25)',
        'cyan': '0 0 20px rgba(6,182,212,0.25)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'elevated': '0 8px 32px rgba(0,0,0,0.5)',
      }
    },
  },
  plugins: [],
}
