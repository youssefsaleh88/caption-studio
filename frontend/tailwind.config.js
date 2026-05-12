/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          alt: "var(--color-primary-alt)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          alt: "var(--color-secondary-alt)",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          warm: "var(--color-surface-warm)",
        },
        bg: "var(--color-bg)",
        ink: {
          DEFAULT: "var(--color-text-primary)",
          soft: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
        },
        ok: {
          DEFAULT: "var(--color-success)",
          bg: "var(--color-success-bg)",
        },
        info: {
          DEFAULT: "var(--color-processing)",
          bg: "var(--color-processing-bg)",
        },
        warn: {
          DEFAULT: "var(--color-danger)",
          bg: "var(--color-danger-bg)",
        },
        line: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
        },
      },
      fontFamily: {
        sans: ["Nunito", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        cardHover: "var(--shadow-card-hover)",
        button: "var(--shadow-button)",
        buttonHover: "var(--shadow-button-hover)",
      },
      backgroundImage: {
        "gradient-primary": "var(--color-primary-gradient)",
        "gradient-secondary": "var(--color-secondary-gradient)",
      },
    },
  },
  plugins: [],
}
