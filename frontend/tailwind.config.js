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
        captain: {
          base: "var(--bg-base)",
          card: "var(--bg-card)",
          surface: "var(--bg-surface)",
          accent: "var(--accent)",
          bright: "var(--accent-bright)",
          blue: "var(--blue)",
          muted: "var(--text-muted)",
          danger: "var(--danger)",
          success: "var(--success)",
        },
      },
      fontFamily: {
        sans: ["Tajawal", "Syne", "Noto Sans Arabic", "system-ui", "sans-serif"],
        display: ["Syne", "Tajawal", "system-ui", "sans-serif"],
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
        "cap-slide-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "cap-shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "cap-glow-pulse": {
          "0%, 100%": {
            textShadow:
              "0 0 8px rgb(108 99 255 / 0.45), 0 0 2px rgb(108 99 255 / 0.8)",
          },
          "50%": {
            textShadow:
              "0 0 16px rgb(139 128 255 / 0.9), 0 0 4px rgb(108 99 255 / 0.9)",
          },
        },
        "cap-thumb-grow": {
          from: { transform: "scale(1)" },
          to: { transform: "scale(1.2)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.55s ease forwards",
        "gradient-shift":
          "gradient-shift var(--cap-duration-gradient, 14s) ease infinite",
        "caret-pulse-soft":
          "caret-pulse-soft 1.1s ease-in-out infinite",
        "cap-slide-up": "cap-slide-up 0.4s ease forwards",
        "cap-shimmer": "cap-shimmer 1.8s linear infinite",
        "cap-glow-pulse": "cap-glow-pulse 1.2s ease-in-out infinite",
        "cap-thumb-grow": "cap-thumb-grow 0.15s ease forwards",
      },
    },
  },
  plugins: [],
}
