/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Core palette
        ink: '#08080c',
        'ink-deep': '#040407',
        panel: '#101016',
        'panel-light': '#171720',
        surface: '#1d1d28',
        
        // Accent colors
        ice: '#e8c872',
        'ice-bright': '#f6e3a1',
        mint: '#61edba',
        'mint-deep': '#3bd49a',
        aurora: '#a78bfa',
        'aurora-bright': '#c4b5fd',
        solar: '#fbbf24',
        'solar-bright': '#fcd34d',
        rose: '#ff6e7a',
        'rose-bright': '#fda4af',
        
        // World colors
        'world-career': '#f472b6',
        'world-study': '#a78bfa',
        'world-project': '#34d399',
        'world-life': '#fbbf24',
        'world-knowledge': '#60a5fa',
        'world-hub': '#e8c872',
      },
      fontFamily: {
        display: ['Outfit', 'Space Grotesk', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'glow-radial': 'radial-gradient(circle, var(--tw-gradient-from), transparent 70%)',
        'grid-subtle': 'linear-gradient(rgba(232,200,114,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(232,200,114,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-subtle': '60px 60px',
      },
      boxShadow: {
        'glow-ice': '0 0 20px rgba(232,200,114,0.15), 0 0 60px rgba(232,200,114,0.05)',
        'glow-aurora': '0 0 20px rgba(167,139,250,0.15), 0 0 60px rgba(167,139,250,0.05)',
        'glow-mint': '0 0 20px rgba(97,237,186,0.15), 0 0 60px rgba(97,237,186,0.05)',
        'panel-lg': '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'glow-breathe': 'glowBreathe 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glowBreathe: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
