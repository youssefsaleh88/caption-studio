/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: "#0B0B10",
          surface: "#16161E",
          elevated: "#1E1E2A",
        },
        accent: {
          DEFAULT: "#8B7CFF",
          hover: "#A395FF",
          muted: "#4A3F8C",
        },
      },
      fontFamily: {
        sans: ["Inter", "Cairo", "Noto Sans Arabic", "system-ui", "sans-serif"],
        mono: ["Space Mono", "monospace"],
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.55s ease forwards",
        "gradient-shift": "gradient-shift 14s ease infinite",
      },
    },
  },
  plugins: [],
}
