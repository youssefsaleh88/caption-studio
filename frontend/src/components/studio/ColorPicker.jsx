const PRESET_TEXT = [
  "#FFFFFF",
  "#FFD700",
  "#00FFFF",
  "#FF4444",
  "#000000",
  "#6c63ff",
]

export default function ColorPicker({
  value,
  onChange,
  presets = PRESET_TEXT,
  allowCustom = true,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((c) => {
        const active =
          String(value || "").toLowerCase() === String(c).toLowerCase()
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={[
              "w-9 h-9 rounded-full border-2 transition-all shrink-0",
              active
                ? "border-[var(--accent-bright)] scale-110 shadow-[0_0_12px_var(--accent-glow)]"
                : "border-white/15 hover:border-white/35",
            ].join(" ")}
            style={{ backgroundColor: c }}
            aria-label={c}
          />
        )
      })}
      {allowCustom ? (
        <label className="relative w-9 h-9 rounded-full border-2 border-dashed border-white/25 cursor-pointer overflow-hidden shrink-0 hover:border-[var(--accent)]/50">
          <span className="sr-only">Custom</span>
          <input
            type="color"
            value={value?.startsWith("#") ? value : "#ffffff"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer p-0 border-0"
          />
        </label>
      ) : null}
    </div>
  )
}
