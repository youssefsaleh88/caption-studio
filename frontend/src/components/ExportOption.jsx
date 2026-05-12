export default function ExportOption({
  icon,
  title,
  hint,
  badge,
  selected,
  onSelect,
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "cap-focus-ring w-full text-start",
        "flex items-center gap-3.5 p-4 rounded-lg border-2 transition-all",
        selected
          ? "border-primary bg-surface shadow-cardHover"
          : "border-line bg-surface hover:border-line-strong hover:shadow-card",
      ].join(" ")}
      aria-pressed={selected}
    >
      <div
        aria-hidden="true"
        className={[
          "flex items-center justify-center w-12 h-12 rounded-md shrink-0 text-[22px]",
          selected ? "text-white" : "text-ink",
        ].join(" ")}
        style={{
          background: selected
            ? "var(--color-primary-gradient)"
            : "var(--color-surface-warm)",
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[16px] font-extrabold text-ink">{title}</span>
          {badge && (
            <span className="cap-pill bg-ok-bg text-ok">{badge}</span>
          )}
        </div>
        <p className="text-[13px] font-semibold text-ink-soft leading-snug">
          {hint}
        </p>
      </div>
      <div
        aria-hidden="true"
        className={[
          "flex items-center justify-center w-6 h-6 rounded-full border-2 shrink-0",
          selected ? "border-primary bg-primary" : "border-line-strong bg-surface",
        ].join(" ")}
      >
        {selected && (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    </button>
  )
}
