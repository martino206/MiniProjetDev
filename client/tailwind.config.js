/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink:   { DEFAULT: '#0f0e0c', 50: '#faf9f7', 100: '#f2f0ec', 200: '#e5e1d9', 300: '#ccc6b8', 400: '#a89e8a', 500: '#8a7f6a', 600: '#6e6352', 700: '#564d3e', 800: '#3d3830', 900: '#272420', 950: '#0f0e0c' },
        amber: { DEFAULT: '#d97706', 50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f' },
        sage:  { DEFAULT: '#6b7c6e', 50: '#f4f7f4', 100: '#e6ede7', 200: '#cddace', 300: '#a9bfab', 400: '#80a083', 500: '#6b7c6e', 600: '#516157', 700: '#424f48', 800: '#364039', 900: '#2d352f' },
      },
      screens: {
        xs: '475px',
      },
      typography: {
        DEFAULT: { css: { maxWidth: '68ch' } },
      },
    },
  },
  plugins: [],
}
