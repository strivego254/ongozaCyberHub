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
        och: {
          midnight: '#0A0A0C',
          defender: '#0648A8',
          mint: '#33FFC1',
          gold: '#C89C15',
          orange: '#F55F28',
          steel: '#A8B0B8',
        },
      },
      backgroundImage: {
        'defender-gradient': 'linear-gradient(135deg, #0648A8, #0A0A0C)',
        'leadership-gradient': 'linear-gradient(135deg, #C89C15, #0A0A0C)',
      },
      letterSpacing: {
        tight: '-0.02em',
        tighter: '-0.03em',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(3, 72, 168, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(3, 72, 168, 0.8), 0 0 30px rgba(51, 255, 193, 0.4)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 10px rgba(3, 72, 168, 0.5)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 20px rgba(3, 72, 168, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}
export default config

