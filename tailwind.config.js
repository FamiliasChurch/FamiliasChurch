/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['Smooch Sans', 'sans-serif'],
        body: ['Raleway', 'sans-serif'],
      },
      colors: {
        // Cores Neutras Premium com suporte a opacidade (/10, /50, etc)
        "n-fundo": "rgb(var(--n-bg) / <alpha-value>)",
        "n-texto": "rgb(var(--n-text) / <alpha-value>)",
        "n-suave": "rgb(var(--n-dim) / <alpha-value>)",
        "n-borda": "rgb(var(--n-border) / <alpha-value>)",
        "primaria": "#163A30", // O verde original da sua igreja
      },
    },
  },
  plugins: [],
}