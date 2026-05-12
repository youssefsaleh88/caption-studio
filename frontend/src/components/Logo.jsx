export default function Logo({ size = "md" }) {
  const dim = size === "lg" ? 44 : size === "sm" ? 32 : 38
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        aria-hidden="true"
        className="flex items-center justify-center rounded-2xl shadow-card"
        style={{
          width: dim,
          height: dim,
          background: "var(--color-primary-gradient)",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={dim * 0.55}
          height={dim * 0.55}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[17px] font-extrabold text-ink tracking-tight">
          Caption Studio
        </span>
        <span className="text-[11px] font-bold text-ink-muted">
          كابشن سريع لفيديوهاتك
        </span>
      </div>
    </div>
  )
}
