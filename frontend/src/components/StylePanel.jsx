import { useState } from "react"

const FONT_FAMILIES = [
  "Cairo",
  "Noto Sans Arabic",
  "Poppins",
  "Bebas Neue",
  "Space Mono",
  "DM Sans",
]

const TEXT_COLORS = [
  "#FFFFFF",
  "#FFD700",
  "#00FFFF",
  "#FF4444",
  "#000000",
  "#7C6EFA",
]

const BG_COLORS = ["#000000", "#1A1A24", "#7C6EFA", "#FF4444", "#FFFFFF"]

const POSITIONS = [
  { id: "top-left",      label: "↖" },
  { id: "top-center",    label: "↑" },
  { id: "top-right",     label: "↗" },
  { id: "middle-left",   label: "←" },
  { id: "center",        label: "·" },
  { id: "middle-right",  label: "→" },
  { id: "bottom-left",   label: "↙" },
  { id: "bottom-center", label: "↓" },
  { id: "bottom-right",  label: "↘" },
]

const TABS = [
  { id: "font",       label: "Font" },
  { id: "background", label: "Background" },
  { id: "effects",    label: "Effects" },
  { id: "position",   label: "Position" },
]

function Section({ label, children }) {
  return (
    <div className="mb-5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2">
        {label}
      </div>
      {children}
    </div>
  )
}

function Swatch({ color, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-7 h-7 rounded-md border transition-all",
        active
          ? "border-white scale-110 ring-2 ring-accent"
          : "border-white/20 hover:border-white/50",
      ].join(" ")}
      style={{ backgroundColor: color }}
      title={color}
    />
  )
}

export default function StylePanel({ style, onChange }) {
  const [tab, setTab] = useState("font")

  function set(patch) {
    onChange({ ...style, ...patch })
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-1 p-1 rounded-xl bg-dark border border-white/5 mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              "flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all",
              tab === t.id
                ? "bg-accent text-white shadow-lg shadow-accent/25"
                : "text-white/60 hover:text-white",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {tab === "font" && (
          <>
            <Section label="Font family">
              <select
                value={style.fontFamily}
                onChange={(e) => set({ fontFamily: e.target.value })}
                className="w-full bg-dark text-white border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Section>

            <Section label={`Size — ${style.fontsize}px`}>
              <input
                type="range"
                min={12}
                max={72}
                value={style.fontsize}
                onChange={(e) => set({ fontsize: Number(e.target.value) })}
                className="w-full accent-accent"
              />
            </Section>

            <Section label="Text color">
              <div className="flex items-center gap-2 flex-wrap">
                {TEXT_COLORS.map((c) => (
                  <Swatch
                    key={c}
                    color={c}
                    active={style.color?.toLowerCase() === c.toLowerCase()}
                    onClick={() => set({ color: c })}
                  />
                ))}
                <input
                  type="color"
                  value={style.color}
                  onChange={(e) => set({ color: e.target.value })}
                  className="w-7 h-7 rounded-md bg-transparent cursor-pointer border border-white/20"
                  title="Custom color"
                />
              </div>
            </Section>
          </>
        )}

        {tab === "background" && (
          <>
            <Section label="Background">
              <label className="flex items-center gap-2 text-sm text-white/85 cursor-pointer">
                <input
                  type="checkbox"
                  checked={style.bg_enabled !== false}
                  onChange={(e) => set({ bg_enabled: e.target.checked })}
                  className="w-4 h-4 accent-accent"
                />
                Show background
              </label>
            </Section>

            <Section label="Color">
              <div className="flex items-center gap-2 flex-wrap">
                {BG_COLORS.map((c) => (
                  <Swatch
                    key={c}
                    color={c}
                    active={style.bg_color?.toLowerCase() === c.toLowerCase()}
                    onClick={() => set({ bg_color: c })}
                  />
                ))}
                <input
                  type="color"
                  value={style.bg_color}
                  onChange={(e) => set({ bg_color: e.target.value })}
                  className="w-7 h-7 rounded-md bg-transparent cursor-pointer border border-white/20"
                  title="Custom color"
                />
              </div>
            </Section>

            <Section
              label={`Opacity — ${Math.round((style.bg_opacity ?? 0.6) * 100)}%`}
            >
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={style.bg_opacity}
                onChange={(e) => set({ bg_opacity: Number(e.target.value) })}
                className="w-full accent-accent"
              />
            </Section>
          </>
        )}

        {tab === "effects" && (
          <>
            <Section label={`Shadow — ${style.shadow}px`}>
              <input
                type="range"
                min={0}
                max={10}
                value={style.shadow}
                onChange={(e) => set({ shadow: Number(e.target.value) })}
                className="w-full accent-accent"
              />
            </Section>

            <Section label="Outline">
              <label className="flex items-center gap-2 text-sm text-white/85 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={!!style.outline_enabled}
                  onChange={(e) => set({ outline_enabled: e.target.checked })}
                  className="w-4 h-4 accent-accent"
                />
                Show outline
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {TEXT_COLORS.map((c) => (
                  <Swatch
                    key={c}
                    color={c}
                    active={
                      style.outline_color?.toLowerCase() === c.toLowerCase()
                    }
                    onClick={() => set({ outline_color: c })}
                  />
                ))}
                <input
                  type="color"
                  value={style.outline_color || "#000000"}
                  onChange={(e) => set({ outline_color: e.target.value })}
                  className="w-7 h-7 rounded-md bg-transparent cursor-pointer border border-white/20"
                  title="Custom color"
                />
              </div>
            </Section>
          </>
        )}

        {tab === "position" && (
          <Section label="Caption position">
            <div className="grid grid-cols-3 gap-2">
              {POSITIONS.map((p) => {
                const active = style.position === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => set({ position: p.id })}
                    className={[
                      "h-14 rounded-lg text-2xl flex items-center justify-center transition-all border",
                      active
                        ? "bg-accent text-white border-accent shadow-lg shadow-accent/30"
                        : "bg-dark text-white/65 border-white/10 hover:border-white/30",
                    ].join(" ")}
                    title={p.id}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}
