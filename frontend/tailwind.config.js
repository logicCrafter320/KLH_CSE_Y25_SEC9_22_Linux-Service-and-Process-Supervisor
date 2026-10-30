/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'linux-dark': '#0d1117',
        'linux-darker': '#010409',
        'linux-card': '#161b22',
        'linux-border': '#30363d',
        'linux-text': '#c9d1d9',
        'linux-text-secondary': '#8b949e',
        'linux-green': '#3fb950',
        'linux-red': '#f85149',
        'linux-yellow': '#d29922',
        'linux-blue': '#58a6ff',
        'linux-purple': '#bc8cff',
        'linux-orange': '#f0883e',
        'terminal-bg': '#1a1b26',
        'terminal-text': '#a9b1d6'
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)' }
        }
      }
    },
  },
  plugins: [],
}