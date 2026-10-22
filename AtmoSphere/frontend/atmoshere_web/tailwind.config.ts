export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Emerald Green
        primary: '#006948',
        'primary-container': '#00855d',
        'on-primary': '#ffffff',
        'on-primary-container': '#ffffff',
        
        // Secondary - Dark Grey
        secondary: '#334155',
        'secondary-container': '#e0e3e5',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#334155',
        
        // Tertiary - Red/Error
        tertiary: '#ba1a1a',
        'tertiary-container': '#ffdad6',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#ba1a1a',
        
        // Surface colors - Neutral palette
        background: '#f7f9fb',
        surface: '#f7f9fb',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f2f4f6',
        'surface-container': '#eff1f3',
        'surface-container-high': '#e9ecf0',
        'surface-container-highest': '#e0e3e5',
        'on-surface': '#191c1e',
        'on-surface-variant': '#49454f',
        
        // Error
        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#ba1a1a',
        
        // Outline
        outline: '#79747e',
        'outline-variant': '#bccac0',
      },
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        md: '0.75rem',
        lg: '1rem',
      },
      spacing: {
        6: '1.5rem',
      },
      boxShadow: {
        'ambient': '0 12px 32px rgba(0, 105, 72, 0.06)',
      },
      backdropBlur: {
        '20': '20px',
      },
    },
  },
  plugins: [],
}
