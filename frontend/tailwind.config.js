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
        serif: ['Space Grotesk', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        title: ['Space Grotesk', 'sans-serif'],
        sans: ['Outfit', 'Avenir Next', 'Avenir', 'Helvetica Neue', 'sans-serif'],
        body: ['Outfit', 'Avenir Next', 'Avenir', 'Helvetica Neue', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace']
      },
      colors: {
        varsity: {
          blue: '#1A56C4',
          blueHover: '#1545A2',
          blueContainer: '#E8EFFF',
          onBlueContainer: '#00194B',
          orange: '#B84D00',
          orangeBright: '#E8640A',
          orangeContainer: '#FFEEDB',
          onOrangeContainer: '#2E0E00',
          cream: '#F6F4F0',
          darkSurface: '#0B192C',
          ink: '#111111',
          inkMuted: '#666666',
          outline: '#CCCCCC',
          outlineVariant: '#EAEAEA'
        },
        slm: {
          pine: '#1A56C4',         // Varsity Blue Primary
          pineHover: '#1545A2',    // Darkened Varsity Blue
          clay: '#B84D00',         // Championship Orange Accent
          orange: '#B84D00',       // Championship Orange
          orangeContainer: '#FFEEDB', // Soft Orange Surface
          onOrangeContainer: '#2E0E00', // Dark Brown Text
          paper: '#F6F4F0',        // League Cream Background
          card: '#FFFFFF',         // Pure White Surface
          surfaceVariant: '#F0EEEA', // Segmented Control Background
          ink: '#111111',          // Ink Black Body Text
          inkMuted: '#666666',     // Muted Secondary Text
          border: '#EAEAEA'        // Outline Variant Border
        }
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px'
      },
      boxShadow: {
        'varsity': '0 2px 8px rgba(0,0,0,0.015)',
        'varsity-hover': '0 4px 16px rgba(26,86,196,0.05)',
        'varsity-btn': '0 2px 8px rgba(26,86,196,0.25)',
        'popover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'block': '0 2px 8px rgba(0, 0, 0, 0.015)'
      }
    },
  },
  plugins: [],
};
