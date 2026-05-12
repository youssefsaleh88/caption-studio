import { useState } from "react"

const POSITION_OPTIONS = [
  { value: "bottom-center", label: "أسفل" },
  { value: "center-center", label: "وسط" },
  { value: "top-center", label: "أعلى" },
]

const FONT_SIZE_OPTIONS = [
  { value: 4.5, label: "صغير" },
  { value: 5.5, label: "متوسط" },
  { value: 7.0, label: "كبير" },
  { value: 9.0, label: "ضخم" },
]

/**
 * StyleOptionsPanel — shown below a selected StylePresetCard.
 * Emits onChange({ color, bg_color, bg_enabled, font_size_pct, position })
 * whenever the user adjusts a value.
 */
export default function StyleOptionsPanel({ presetId, initial = {}, onChange }) {
  const [color, setColor] = useState(initial.color || "#FFFFFF")
  const [bgEnabled, setBgEnabled] = useState(initial.bg_enabled ?? true)
  const [bgColor, setBgColor] = useState(initial.bg_color || "#000000")
  const [fontSizePct, setFontSizePct] = useState(initial.font_size_pct || 5.5)
  const [position, setPosition] = useState(initial.position || "bottom-center")

  function emit(patch) {
    const next = { color, bg_enabled: bgEnabled, bg_color: bgColor, font_size_pct: fontSizePct, position, ...patch }
    onChange?.(next)
    return next
  }

  function handleColor(v) { setColor(v); emit({ color: v }) }
  function handleBgEnabled(v) { setBgEnabled(v); emit({ bg_enabled: v }) }
  function handleBgColor(v) { setBgColor(v); emit({ bg_color: v }) }
  function handleFontSize(v) { setFontSizePct(v); emit({ font_size_pct: v }) }
  function handlePosition(v) { setPosition(v); emit({ position: v }) }

  return (
    <div
      className="cap-animate-fade-up rounded-xl border border-line bg-surface-raised shadow-card overflow-hidden"
      style={{ marginTop: "0.5rem" }}
    >
      {/* Header */}
      <div
        className="px-3.5 py-2.5 flex items-center gap-2 border-b border-line"
        style={{ background: "var(--color-surface)" }}
      >
        <span aria-hidden="true" className="text-[16px]">🎨</span>
        <span className="text-[12px] font-extrabold text-ink-muted uppercase tracking-[0.08em]">
          تخصيص الستايل
        </span>
      </div>

      <div className="px-3.5 py-3 space-y-4">

        {/* Text color */}
        <div className="flex items-center justify-between gap-3">
          <label className="text-[13px] font-bold text-ink flex-1">
            لون النص
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => handleColor(e.target.value)}
              className="w-9 h-9 rounded-lg border-2 border-line cursor-pointer bg-transparent p-0.5"
              style={{ WebkitAppearance: "none" }}
              title="لون النص"
            />
            <span className="text-[11px] font-mono text-ink-muted uppercase">{color}</span>
          </div>
        </div>

        {/* Background */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-[13px] font-bold text-ink flex-1">
              خلفية النص
            </label>
            {/* Toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={bgEnabled}
              onClick={() => handleBgEnabled(!bgEnabled)}
              className={[
                "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition-colors duration-200 focus:outline-none",
                bgEnabled ? "border-primary bg-primary" : "border-line bg-line",
              ].join(" ")}
            >
              <span
                className={[
                  "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 mt-0.5",
                  bgEnabled ? "translate-x-5" : "translate-x-0.5",
                ].join(" ")}
              />
            </button>
          </div>

          {bgEnabled && (
            <div className="flex items-center justify-between gap-3 pl-2">
              <span className="text-[12px] font-semibold text-ink-soft">لون الخلفية</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => handleBgColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border-2 border-line cursor-pointer bg-transparent p-0.5"
                  style={{ WebkitAppearance: "none" }}
                  title="لون الخلفية"
                />
                <span className="text-[11px] font-mono text-ink-muted uppercase">{bgColor}</span>
              </div>
            </div>
          )}
        </div>

        {/* Font size */}
        <div className="space-y-1.5">
          <span className="text-[13px] font-bold text-ink block">حجم الخط</span>
          <div className="grid grid-cols-4 gap-1.5">
            {FONT_SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleFontSize(opt.value)}
                className={[
                  "cap-focus-ring rounded-lg py-1.5 text-[12px] font-extrabold border-2 transition-all",
                  fontSizePct === opt.value
                    ? "border-primary text-primary bg-primary/10"
                    : "border-line text-ink-soft hover:border-line-strong",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Position */}
        <div className="space-y-1.5">
          <span className="text-[13px] font-bold text-ink block">موضع الكابشن</span>
          <div className="grid grid-cols-3 gap-1.5">
            {POSITION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handlePosition(opt.value)}
                className={[
                  "cap-focus-ring rounded-lg py-1.5 text-[12px] font-extrabold border-2 transition-all",
                  position === opt.value
                    ? "border-primary text-primary bg-primary/10"
                    : "border-line text-ink-soft hover:border-line-strong",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
