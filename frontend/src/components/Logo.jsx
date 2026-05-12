export default function Logo({ size = "md" }) {
  const dim = size === "lg" ? 44 : size === "sm" ? 32 : 38
  const s = dim / 36
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        aria-hidden="true"
        className="flex items-center justify-center rounded-2xl border"
        style={{
          width: dim,
          height: dim,
          background: "oklch(0.94 0.02 132 / 0.16)",
          borderColor: "oklch(0.72 0.12 128 / 0.35)",
        }}
      >
        <svg
          width={36 * s}
          height={36 * s}
          viewBox="0 0 36 36"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="4"
            y="8"
            width="28"
            height="17"
            rx="4"
            fill="oklch(0.41 0.13 135 / 0.18)"
          />
          <rect
            x="4"
            y="8"
            width="28"
            height="17"
            rx="4"
            stroke="oklch(0.41 0.13 135)"
            strokeWidth="1.8"
            fill="none"
          />
          <rect x="9" y="13" width="18" height="2.5" rx="1.25" fill="oklch(0.41 0.13 135)" />
          <rect
            x="9"
            y="18"
            width="11"
            height="2.5"
            rx="1.25"
            fill="oklch(0.41 0.13 135)"
            opacity="0.5"
          />
          <circle cx="28" cy="9" r="5" fill="oklch(0.52 0.14 130)" />
          <path
            d="M26 9h4M28 7v4"
            stroke="oklch(0.94 0.02 132)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[17px] font-extrabold text-ink tracking-tight" dir="ltr">
          Clip<span style={{ color: "var(--color-primary-alt)" }}>t</span>
        </span>
        <span className="text-[11px] font-bold text-ink-muted">
          حوّل فيديوهاتك في ثواني
        </span>
      </div>
    </div>
  )
}
