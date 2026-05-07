import { useState } from "react"

export default function RangeSlider({
  min,
  max,
  step,
  value,
  onChange,
  formatValue,
}) {
  const [pressed, setPressed] = useState(false)
  const display = formatValue ? formatValue(value) : String(value)

  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        className={[
          "flex-1 h-2 rounded-full appearance-none bg-white/10 cursor-pointer captain-range",
          pressed ? "scale-y-110 origin-center transition-transform" : "",
        ].join(" ")}
        style={{
          accentColor: "var(--accent)",
        }}
      />
      <span className="shrink-0 min-w-[3.25rem] text-end text-sm font-mono tabular-nums text-[var(--text-secondary)]">
        {display}
      </span>
    </div>
  )
}
