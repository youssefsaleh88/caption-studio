export default function StylePresetCard({ preset, selected, onSelect }) {
  const p = preset.preview
  const words = String(p.text).split(/\s+/)

  return (
    <button
      type="button"
      onClick={() => onSelect(preset.id)}
      aria-pressed={selected}
      className={[
        "cap-focus-ring relative w-full text-start rounded-lg border-2 transition-all overflow-hidden",
        selected
          ? "border-primary shadow-cardHover"
          : "border-line hover:border-line-strong",
      ].join(" ")}
    >
      <div
        className="relative h-24 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black flex items-end justify-center"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at top, #2a2a3a 0%, #0a0a14 100%)",
        }}
      >
        <span
          className={[
            "inline-flex items-center justify-center gap-1 leading-tight max-w-[90%] mb-2",
            p.bgClass || "",
          ].join(" ")}
          style={p.bgStyle}
          dir="auto"
        >
          {words.map((w, i) => {
            const isActive = i === p.activeWordIndex
            const wordStyle = {
              ...(p.outline
                ? { textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 2px #000" }
                : {}),
              ...(isActive && p.activeColor ? { color: p.activeColor } : {}),
            }
            return (
              <span
                key={i}
                className={[
                  p.textClass || "text-white font-extrabold text-[13px]",
                  isActive && p.activeColor ? "" : "",
                ].join(" ")}
                style={wordStyle}
              >
                {w}
              </span>
            )
          })}
        </span>
      </div>

      <div className="px-3 py-2.5 bg-surface flex items-start gap-2">
        <div
          aria-hidden="true"
          className={[
            "flex items-center justify-center w-5 h-5 rounded-full border-2 shrink-0 mt-0.5",
            selected
              ? "border-primary bg-primary"
              : "border-line-strong bg-surface",
          ].join(" ")}
        >
          {selected && (
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-extrabold text-ink leading-tight">
            {preset.name}
          </div>
          <div className="text-[11.5px] font-semibold text-ink-soft leading-snug mt-0.5">
            {preset.hint}
          </div>
        </div>
      </div>
    </button>
  )
}
