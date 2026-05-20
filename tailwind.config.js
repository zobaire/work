/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        amethyst: '#10002b',
        amethystSoft: '#1a0440',
        velvet: '#5a189a',
        velvetSoft: '#7b2cbf',
        malachite: '#1dd561',
        platinum: '#f0f0f0',
        food: '#1dd561',
        transport: '#3b82f6',
        emergency: '#ef4444',
        leisure: '#5a189a',
        hygiene: '#9ca3af',
      },
      fontFamily: {
        display: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(90,24,154,0.45)',
        glowGreen: '0 0 30px rgba(29,213,97,0.55)',
      },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        sheen: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(120%)' },
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(29,213,97,0.55)' },
          '70%': { boxShadow: '0 0 0 18px rgba(29,213,97,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(29,213,97,0)' },
        },
        gradientShift: {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        floaty: 'floaty 4s ease-in-out infinite',
        sheen: 'sheen 2.4s linear infinite',
        pulseRing: 'pulseRing 1.6s ease-out infinite',
        gradientShift: 'gradientShift 14s ease infinite',
      },
    },
  },
  plugins: [],
};
