/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: "#0F0F13",
          surface: "#1A1A24",
          elevated: "#24243A",
        },
        accent: {
          DEFAULT: "#7C6EFA",
          hover: "#9585FB",
          muted: "#3D3580",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        mono: ["Space Mono", "monospace"],
      },
    },
  },
  plugins: [],
}
