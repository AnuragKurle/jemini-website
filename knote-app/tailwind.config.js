/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Grid columns for different difficulty levels (including responsive variants)
    'grid-cols-3',
    'grid-cols-4',
    'grid-cols-5',
    'grid-cols-6',
    'grid-cols-7',
    'grid-cols-8',
    'grid-cols-10',
    'sm:grid-cols-4',
    'sm:grid-cols-7',
    'sm:grid-cols-8',
    'lg:grid-cols-10',
    // Bucket UI dynamic classes (green=Easy, blue=Medium, purple=Hard)
    'border-green-500', 'border-blue-500', 'border-purple-500',
    'bg-green-100', 'bg-blue-100', 'bg-purple-100',
    'text-green-600', 'text-blue-600', 'text-purple-600',
    'text-green-700', 'text-blue-700', 'text-purple-700',
    'text-green-600/80', 'text-blue-600/80', 'text-purple-600/80',
    'focus:border-green-500', 'focus:border-blue-500', 'focus:border-purple-500',
    'focus:ring-green-500/10', 'focus:ring-blue-500/10', 'focus:ring-purple-500/10',
    'border-t-4',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
        handwriting: ['Sacramento', 'cursive'],
      },
      animation: {
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          'from': { transform: 'translateY(50px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          'from': { opacity: '0', transform: 'scale(0.98)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      transitionDuration: {
        '400': '400ms',
      }
    },
  },
  plugins: [],
}
