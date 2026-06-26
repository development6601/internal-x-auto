/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // 'class' strategy: dark mode is activated by adding the `dark` class to
  // <html>. Users toggle manually between light and dark in the app header.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        editorial: {
          base: 'var(--color-bg-base)',
          surface: 'var(--color-bg-surface)',
          secondary: 'var(--color-bg-secondary)',
          primary: 'var(--color-primary)',
          'primary-hover': 'var(--color-primary-hover)',
          'primary-active': 'var(--color-primary-active)',
          'text-primary': 'var(--color-text-primary)',
          'text-secondary': 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          disabled: 'var(--color-text-disabled)',
          border: 'var(--color-border-light)',
          'border-medium': 'var(--color-border-medium)',
          success: 'var(--color-success)',
          'success-bg': 'var(--color-success-bg)',
          warning: 'var(--color-warning)',
          'warning-bg': 'var(--color-warning-bg)',
          error: 'var(--color-error)',
          'error-bg': 'var(--color-error-bg)',
          info: 'var(--color-info)',
          'info-bg': 'var(--color-info-bg)',
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Palatino Linotype', 'Georgia', 'serif'],
        body: ['Syne', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        editorial: '10px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        modal: 'var(--shadow-modal)',
        'input-focus': 'var(--shadow-input-focus)',
        'button-primary': 'var(--shadow-button-primary)',
      },
      letterSpacing: {
        button: '0.08em',
        label: '0.1em',
        eyebrow: '0.18em',
        badge: '0.06em',
      },
    },
  },
  plugins: [],
}
