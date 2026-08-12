const path = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'src/**/*.{js,ts,jsx,tsx}')
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Poppins', 'sans-serif'],
        sans: ['Open Sans', 'sans-serif'],
        body: ['Open Sans', 'sans-serif'],
        mono: ['monospace']
      },
      colors: {
        slm: {
          pine: '#4F46E5',        // Primary Deep Indigo
          clay: '#EA580C',        // SS4 Orange Primary Accent
          orange: '#EA580C',      // SS4 Orange
          orangeContainer: '#FFEDD5', // M3 Soft Warm Orange Surface
          onOrangeContainer: '#9A3412', // Deep Rust Accent Text
          paper: '#F8FAFC',       // M3 Neutral Surface Light
          card: '#ffffff',        // M3 Elevated Card Surface
          ink: '#1E293B',         // M3 On-Surface Dark Navy Ink
          inkMuted: '#64748B',    // M3 Muted Ink
          border: '#E2E8F0'       // M3 Outline Variant Border
        }
      },
      borderRadius: {
        '3xl': '20px',
        '4xl': '28px'
      },
      boxShadow: {
        'popover': '0 10px 30px -5px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.08)',
        'block': '0 4px 20px -2px rgba(79, 70, 229, 0.12), 0 2px 6px -1px rgba(0, 0, 0, 0.06)'
      }
    },
  },
  plugins: [],
};
