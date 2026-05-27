/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Soporte para modo oscuro mediante la clase 'dark'
  theme: {
    extend: {
      colors: {
        ferre: {
          blue: {
            DEFAULT: '#1e3a8a', // Azul Marino Principal
            dark: '#172554',
            light: '#3b82f6',
            hover: '#1d4ed8',
          },
          yellow: {
            DEFAULT: '#eab308', // Amarillo Ferretería
            dark: '#ca8a04',
            light: '#fde047',
            hover: '#d97706',
          },
          dark: {
            DEFAULT: '#1f2937', // Gris Oscuro Principal (Sidebar / Tarjetas)
            bg: '#111827', // Fondo modo oscuro
            card: '#1f2937',
            border: '#374151',
          },
          gray: {
            DEFAULT: '#4b5563',
            light: '#f3f4f6',
            border: '#e5e7eb',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(15px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
