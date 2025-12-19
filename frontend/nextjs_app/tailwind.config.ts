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
        'mission-success': '#10B981',
        'mission-warning': '#F59E0B',
        'mission-critical': '#EF4444',
        'mission-primary': '#3B82F6',
        'mission-recipe': '#059669',
        och: {
          midnight: '#0A0A0C',
          defender: '#0648A8',
          mint: '#33FFC1',
          gold: '#C89C15',
          orange: '#F55F28',
          steel: '#A8B0B8',
          slate: {
            50: '#F8F9FA',
            100: '#F1F3F5',
            200: '#E9ECEF',
            300: '#DEE2E6',
            400: '#CED4DA',
            500: '#ADB5BD',
            600: '#868E96',
            700: '#495057',
            800: '#343A40',
            900: '#212529',
          },
        },
        dashboard: {
          bg: '#0a0f1e',
          card: '#1e293b',
          accent: '#00d4ff',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          glass: 'rgba(30,41,59,0.8)',
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
        'flicker': 'flicker 1.5s ease-in-out infinite',
        'fadeIn': 'fadeIn 0.3s ease-in-out',
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
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config

