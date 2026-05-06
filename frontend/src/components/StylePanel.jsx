import { useState } from "react"
import { useTranslation } from "react-i18next"

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
  { id: "captions",   label: "Captions" },
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
  const { t } = useTranslation()
  const [tab, setTab] = useState("font")

  function set(patch) {
    onChange({ ...style, ...patch })
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-1 p-1 rounded-xl bg-dark border border-white/5 mb-4">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.id}
            type="button"
            onClick={() => setTab(tabItem.id)}
            className={[
              "flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all",
              tab === tabItem.id
                ? "bg-accent text-white shadow-lg shadow-accent/25"
                : "text-white/60 hover:text-white",
            ].join(" ")}
          >
            {t(`style.tabs.${tabItem.id}`)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {tab === "font" && (
          <>
            <Section label={t("style.fontFamily")}>
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

            <Section
              label={t("style.sizePct", {
                pct: Number(style.font_size_pct ?? 5.5).toFixed(1),
              })}
            >
              <input
                type="range"
                min={2}
                max={12}
                step={0.5}
                value={Number(style.font_size_pct ?? 5.5)}
                onChange={(e) =>
                  set({ font_size_pct: Number(e.target.value) })
                }
                className="w-full accent-accent"
              />
            </Section>

            <Section label={t("style.textColor")}>
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
            <Section label={t("style.bgSection")}>
              <label className="flex items-center gap-2 text-sm text-white/85 cursor-pointer">
                <input
                  type="checkbox"
                  checked={style.bg_enabled !== false}
                  onChange={(e) => set({ bg_enabled: e.target.checked })}
                  className="w-4 h-4 accent-accent"
                />
                {t("style.showBg")}
              </label>
            </Section>

            <Section label={t("style.bgColorLabel")}>
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
              label={t("style.opacity", {
                pct: Math.round((style.bg_opacity ?? 0.6) * 100),
              })}
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
            <Section label={t("style.shadow", { n: style.shadow })}>
              <input
                type="range"
                min={0}
                max={10}
                value={style.shadow}
                onChange={(e) => set({ shadow: Number(e.target.value) })}
                className="w-full accent-accent"
              />
            </Section>

            <Section label={t("style.outline")}>
              <label className="flex items-center gap-2 text-sm text-white/85 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={!!style.outline_enabled}
                  onChange={(e) => set({ outline_enabled: e.target.checked })}
                  className="w-4 h-4 accent-accent"
                />
                {t("style.outlineShow")}
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
          <Section label={t("style.captionPos")}>
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

        {tab === "captions" && (
          <>
            <Section label={t("style.captions.displayMode")}>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => set({ caption_mode: "sentences" })}
                  className={[
                    "flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                    style.caption_mode !== "sliding"
                      ? "bg-accent text-white border-accent"
                      : "bg-dark text-white/70 border-white/10 hover:border-white/25",
                  ].join(" ")}
                >
                  {t("style.captions.sentences")}
                </button>
                <button
                  type="button"
                  onClick={() => set({ caption_mode: "sliding" })}
                  className={[
                    "flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                    style.caption_mode === "sliding"
                      ? "bg-accent text-white border-accent"
                      : "bg-dark text-white/70 border-white/10 hover:border-white/25",
                  ].join(" ")}
                >
                  {t("style.captions.chunks")}
                </button>
              </div>
            </Section>

            <Section
              label={t("style.captions.timingOffset", {
                v: `${(style.timing_offset ?? 0) >= 0 ? "+" : ""}${Number(style.timing_offset ?? 0).toFixed(1)}`,
              })}
            >
              <input
                type="range"
                min={-2}
                max={2}
                step={0.1}
                value={Number(style.timing_offset ?? 0)}
                onChange={(e) =>
                  set({ timing_offset: Number(e.target.value) })
                }
                className="w-full accent-accent"
              />
              <p className="text-[11px] text-white/45 mt-2">
                {t("style.captions.timingHint")}
              </p>
            </Section>

            <Section
              label={t("style.captions.minDisplay", {
                v: Number(style.min_display_time ?? 0.7).toFixed(1),
              })}
            >
              <input
                type="range"
                min={0.3}
                max={2}
                step={0.1}
                value={Number(style.min_display_time ?? 0.7)}
                onChange={(e) =>
                  set({ min_display_time: Number(e.target.value) })
                }
                className="w-full accent-accent"
              />
              <p className="text-[11px] text-white/45 mt-2">
                {t("style.captions.minDisplayHint")}
              </p>
            </Section>

            {style.caption_mode !== "sliding" && (
              <>
                <Section
                  label={t("style.captions.maxWords", {
                    n: style.max_words_per_line ?? 6,
                  })}
                >
                  <input
                    type="range"
                    min={3}
                    max={10}
                    step={1}
                    value={style.max_words_per_line ?? 6}
                    onChange={(e) =>
                      set({ max_words_per_line: Number(e.target.value) })
                    }
                    className="w-full accent-accent"
                  />
                </Section>
                <Section
                  label={t("style.captions.maxDuration", {
                    v: Number(style.max_segment_duration ?? 3).toFixed(1),
                  })}
                >
                  <input
                    type="range"
                    min={1.5}
                    max={5}
                    step={0.5}
                    value={style.max_segment_duration ?? 3}
                    onChange={(e) =>
                      set({ max_segment_duration: Number(e.target.value) })
                    }
                    className="w-full accent-accent"
                  />
                </Section>
              </>
            )}

            {style.caption_mode === "sliding" && (
              <Section
                label={t("style.captions.wordsPerChunk", {
                  n: style.sliding_window ?? 3,
                })}
              >
                <input
                  type="range"
                  min={1}
                  max={7}
                  step={1}
                  value={style.sliding_window ?? 3}
                  onChange={(e) =>
                    set({ sliding_window: Number(e.target.value) })
                  }
                  className="w-full accent-accent"
                />
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
