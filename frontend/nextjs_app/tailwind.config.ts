import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Palette (Cyber + Mission Tone)
        'och-midnight': '#0A0A0C',
        'defender-blue': '#0648A8',
        'cyber-mint': '#33FFC1',
        'signal-orange': '#F55F28',
        'steel-grey': '#A8B0B8',
        
        // Secondary Palette (Africa-inspired)
        'sahara-gold': '#C89C15',
        'desert-clay': '#E36F46',
        'savanna-green': '#4FAF47',
        'night-sky-blue': '#213A7F',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'h1': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'h2': ['26px', { lineHeight: '1.3', fontWeight: '700' }],
        'h3': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-l': ['18px', { lineHeight: '1.6' }],
        'body-m': ['16px', { lineHeight: '1.6' }],
        'body-s': ['14px', { lineHeight: '1.5' }],
      },
      letterSpacing: {
        'tight': '-0.02em',
        'tighter': '-0.03em',
      },
      borderRadius: {
        'card': '6px',
        'card-soft': '8px',
      },
      backgroundImage: {
        'defender-gradient': 'linear-gradient(135deg, #0648A8 0%, #0A0A0C 100%)',
        'leadership-gradient': 'linear-gradient(135deg, #C89C15 0%, #0A0A0C 100%)',
      },
      boxShadow: {
        'mint-glow': '0 0 20px rgba(51, 255, 193, 0.3)',
        'blue-glow': '0 0 20px rgba(6, 72, 168, 0.3)',
        'gold-glow': '0 0 20px rgba(200, 156, 21, 0.3)',
      },
      animation: {
        'pulse-mint': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radar-sweep 3s linear infinite',
      },
      keyframes: {
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
