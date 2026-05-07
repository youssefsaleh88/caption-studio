/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: "var(--cap-bg-root)",
          surface: "var(--cap-bg-surface)",
          elevated: "var(--cap-bg-elevated)",
        },
        accent: {
          DEFAULT: "var(--cap-accent)",
          hover: "var(--cap-accent-hover)",
          muted: "var(--cap-accent-muted)",
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
        "caret-pulse-soft": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.55s ease forwards",
        "gradient-shift":
          "gradient-shift var(--cap-duration-gradient, 14s) ease infinite",
        "caret-pulse-soft":
          "caret-pulse-soft 1.1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
