/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta Alqia
        alqia: {
          // Azules base
          'deep':      '#202D3D',
          'dark':      '#18212D',
          'darker':    '#111923',
          // Acción
          'copper':    '#F98058',
          'copper-hover': '#F86A3A',
          // Texto
          'secondary': '#A7B3C2',
          'muted':     '#718096',
          // Semánticos
          'success':   '#4ADE80',
          'warning':   '#FACC15',
          'risk':      '#FB7185',
          'info':      '#38BDF8',
        },
      },
      fontFamily: {
        sans:  ['Questrial', 'system-ui', 'sans-serif'],
        data:  ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass':        '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glass-hover':  '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
        'card':         '0 2px 12px rgba(0,0,0,0.2)',
        'copper-glow':  '0 0 20px rgba(249,128,88,0.3)',
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.25rem',
      },
      backgroundImage: {
        'gradient-alqia': 'linear-gradient(135deg, #202D3D 0%, #111923 100%)',
        'gradient-copper': 'linear-gradient(135deg, #F98058 0%, #F86A3A 100%)',
      },
      animation: {
        'fade-in':      'fadeIn 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-up':     'slideUp 0.25s ease-out',
        'pulse-soft':   'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%':   { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
