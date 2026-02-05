/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'ios-bg': 'var(--ios-bg)',
        'ios-card': 'var(--ios-card)',
        'ios-border': 'var(--ios-card-border)',
        'ios-blue': 'var(--ios-blue)',
        'ios-gray': 'var(--ios-gray)',
        'text-primary': 'var(--ios-text-primary)',
        'text-secondary': 'var(--ios-text-secondary)',
        
        // Semantic System (Mapped to iOS Variables)
        'surface-card': 'var(--ios-card)',
        'surface-input': 'var(--input-bg)',
        'surface-input-focus': 'var(--input-bg-focus)',
        'surface-button': 'var(--ios-card)', // Buttons use card material in iOS
        'surface-button-hover': 'var(--ios-card-border)',
      },
      boxShadow: {
        'ios': 'var(--shadow-ios)',
        'ios-lg': 'var(--shadow-ios-lg)',
      },
      animation: {
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'spin-fast': 'spin 0.8s linear infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        gradientBG: {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' },
        }
      }
    },
  },
  plugins: [],
}
