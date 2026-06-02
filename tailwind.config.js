/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FAF6F0',
          100: '#F2E8D7',
          200: '#E5D2B3',
          300: '#C5A880',
          400: '#B89047',
          500: '#D4AF37', // Rich luxury gold
          600: '#B28E2B',
          700: '#8E6F20',
          800: '#685016',
          900: '#45340D',
        },
        obsidian: {
          50: '#F6F6F6',
          100: '#E7E7E7',
          200: '#D1D1D1',
          300: '#B0B0B0',
          400: '#888888',
          500: '#1C1C1E',
          600: '#121212', // Editorial Card Background
          700: '#0A0A0A', // Editorial Layout Background
          800: '#050505',
          900: '#000000', // Pure editorial solid black
        }
      },
      fontFamily: {
        cormorant: ['"Cormorant Garamond"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      backgroundImage: {
        'luxury-gold-gradient': 'linear-gradient(135deg, #FAF6F0 0%, #C5A880 50%, #D4AF37 100%)',
        'dark-radial': 'radial-gradient(circle at center, #121212 0%, #050505 100%)',
        'gold-metallic-border': 'linear-gradient(to right, #C5A880, #D4AF37, #E5D2B3, #C5A880)',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 2.5s infinite linear',
        'pulse-subtle': 'pulseSubtle 3s infinite ease-in-out',
        'slide-card': 'slideCard 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.85', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
        slideCard: {
          '0%': { opacity: '0', transform: 'translateX(80px) rotate(2deg)' },
          '100%': { opacity: '1', transform: 'translateX(0) rotate(0deg)' },
        }
      }
    },
  },
  plugins: [],
}
