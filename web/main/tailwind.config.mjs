/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        void: {
          950: '#0a0a0f',
          900: '#0f1117',
          800: '#1a1d29',
          700: '#252a3d',
        },
        terminal: {
          cyan: '#00e5ff',
          magenta: '#ff00e5',
          yellow: '#ffe500',
          green: '#00ff88',
          red: '#ff4444',
          white: '#e0e0e0',
          muted: '#6b7280',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
