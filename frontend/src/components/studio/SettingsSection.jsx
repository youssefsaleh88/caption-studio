import { useState } from "react"
import { useTranslation } from "react-i18next"
import SettingCard from "./SettingCard"
import ColorPicker from "./ColorPicker"
import RangeSlider from "./RangeSlider"
import AnimationPicker from "./AnimationPicker"

const FONT_FAMILIES = [
  "Tajawal",
  "Noto Sans Arabic",
  "Poppins",
  "Bebas Neue",
  "Space Mono",
  "DM Sans",
]

const BG_COLORS = ["#000000", "#13131c", "#6c63ff", "#FF4444", "#FFFFFF"]

export default function SettingsSection({ style, onChange }) {
  const { t } = useTranslation()
  const [advancedOpen, setAdvancedOpen] = useState(false)

  function set(patch) {
    onChange({ ...style, ...patch })
  }

  const isKaraoke = (style.caption_animation || "none") === "karaoke"

  return (
    <section className="space-y-5">
      <h2 className="flex items-center gap-2 px-0.5 text-sm font-bold text-[var(--text-primary)]">
        <span className="text-[var(--text-muted)]">──</span>
        {t("studio.sectionSettings")}
        <span className="text-[var(--text-muted)]">──</span>
      </h2>

      <SettingCard title={t("studio.settings.typography")}>
        <label className="block space-y-1.5 mb-4">
          <span className="text-xs text-[var(--text-secondary)]">
            {t("style.fontFamily")}
          </span>
          <select
            value={style.fontFamily}
            onChange={(e) => set({ fontFamily: e.target.value })}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] min-h-[44px]"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-2 mb-4">
          <span className="text-xs text-[var(--text-secondary)]">
            {t("style.sizePct", {
              pct: Number(style.font_size_pct ?? 5.5).toFixed(1),
            })}
          </span>
          <RangeSlider
            min={2}
            max={12}
            step={0.5}
            value={Number(style.font_size_pct ?? 5.5)}
            onChange={(v) => set({ font_size_pct: v })}
            formatValue={(v) => `${v.toFixed(1)}%`}
          />
        </div>

        <div className="space-y-2">
          <span className="text-xs text-[var(--text-secondary)]">
            {t("style.textColor")}
          </span>
          <ColorPicker value={style.color} onChange={(c) => set({ color: c })} />
        </div>
      </SettingCard>

      <SettingCard title={t("style.bgSection")}>
        <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={style.bg_enabled !== false}
            onChange={(e) => set({ bg_enabled: e.target.checked })}
            className="w-4 h-4 accent-[var(--accent)]"
          />
          {t("style.showBg")}
        </label>

        <div className="space-y-2 mb-4">
          <span className="text-xs text-[var(--text-secondary)]">
            {t("style.bgColorLabel")}
          </span>
          <ColorPicker
            presets={BG_COLORS}
            value={style.bg_color}
            onChange={(c) => set({ bg_color: c })}
          />
        </div>

        <div className="space-y-2">
          <span className="text-xs text-[var(--text-secondary)]">
            {t("style.opacity", {
              pct: Math.round((style.bg_opacity ?? 0.6) * 100),
            })}
          </span>
          <RangeSlider
            min={0}
            max={1}
            step={0.05}
            value={style.bg_opacity ?? 0.6}
            onChange={(v) => set({ bg_opacity: v })}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
        </div>
      </SettingCard>

      <SettingCard title={t("style.tabs.effects")}>
        <div className="space-y-2 mb-4">
          <span className="text-xs text-[var(--text-secondary)]">
            {t("style.shadow", { n: style.shadow })}
          </span>
          <RangeSlider
            min={0}
            max={10}
            step={1}
            value={Number(style.shadow ?? 2)}
            onChange={(v) => set({ shadow: v })}
            formatValue={(v) => String(v)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={!!style.outline_enabled}
            onChange={(e) => set({ outline_enabled: e.target.checked })}
            className="w-4 h-4 accent-[var(--accent)]"
          />
          {t("style.outlineShow")}
        </label>

        <div className="space-y-2">
          <span className="text-xs text-[var(--text-secondary)]">
            {t("style.outlineColor")}
          </span>
          <ColorPicker
            value={style.outline_color || "#000000"}
            onChange={(c) => set({ outline_color: c })}
          />
        </div>
      </SettingCard>

      <SettingCard title={t("studio.settings.animations")}>
        <p className="text-[11px] text-[var(--text-muted)] mb-3 leading-snug">
          {t("studio.settings.animationsHint")}
        </p>
        <AnimationPicker
          value={style.caption_animation || "none"}
          onChange={(id) => set({ caption_animation: id })}
        />

        {isKaraoke ? (
          <div className="space-y-2 mt-4 pt-4 border-t border-[var(--border-subtle)]">
            <span className="text-xs text-[var(--text-secondary)]">
              {t("studio.settings.karaokeColor")}
            </span>
            <ColorPicker
              value={style.karaoke_color || "#8B80FF"}
              onChange={(c) => set({ karaoke_color: c })}
            />
          </div>
        ) : null}
      </SettingCard>

      <SettingCard title={t("style.captions.displayMode")}>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => set({ caption_mode: "sentences" })}
            className={[
              "cap-focus-visible flex-1 min-h-[44px] rounded-[var(--radius-sm)] text-xs font-semibold border transition",
              style.caption_mode !== "sliding"
                ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                : "bg-[var(--bg-base)] text-[var(--text-secondary)] border-[var(--border-subtle)]",
            ].join(" ")}
          >
            {t("style.captions.sentences")}
          </button>
          <button
            type="button"
            onClick={() => set({ caption_mode: "sliding" })}
            className={[
              "cap-focus-visible flex-1 min-h-[44px] rounded-[var(--radius-sm)] text-xs font-semibold border transition",
              style.caption_mode === "sliding"
                ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                : "bg-[var(--bg-base)] text-[var(--text-secondary)] border-[var(--border-subtle)]",
            ].join(" ")}
          >
            {t("style.captions.chunks")}
          </button>
        </div>
      </SettingCard>

      <section className="rounded-[var(--radius-card)] bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden">
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="cap-focus-visible w-full flex items-center justify-between gap-3 px-[var(--space-md)] py-3 text-start min-h-[48px]"
          aria-expanded={advancedOpen}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {t("studio.settings.advanced")}
          </span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={[
              "shrink-0 text-[var(--text-muted)] transition-transform",
              advancedOpen ? "rotate-180" : "",
            ].join(" ")}
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {advancedOpen ? (
          <div className="px-[var(--space-md)] pb-[var(--space-md)] pt-0 space-y-4 border-t border-[var(--border-subtle)]">
            <p className="text-[11px] text-[var(--text-muted)] pt-3">
              {t("studio.settings.advancedHint")}
            </p>

            <div className="space-y-2">
              <span className="text-xs text-[var(--text-secondary)]">
                {t("style.captions.minDisplay", {
                  v: Number(style.min_display_time ?? 0.7).toFixed(1),
                })}
              </span>
              <RangeSlider
                min={0.3}
                max={2}
                step={0.1}
                value={Number(style.min_display_time ?? 0.7)}
                onChange={(v) => set({ min_display_time: v })}
                formatValue={(v) => `${v.toFixed(1)}s`}
              />
              <p className="text-[11px] text-[var(--text-muted)]">
                {t("style.captions.minDisplayHint")}
              </p>
            </div>

            {style.caption_mode !== "sliding" ? (
              <>
                <div className="space-y-2">
                  <span className="text-xs text-[var(--text-secondary)]">
                    {t("style.captions.maxWords", {
                      n: style.max_words_per_line ?? 6,
                    })}
                  </span>
                  <RangeSlider
                    min={3}
                    max={10}
                    step={1}
                    value={style.max_words_per_line ?? 6}
                    onChange={(v) => set({ max_words_per_line: v })}
                    formatValue={(v) => String(v)}
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-xs text-[var(--text-secondary)]">
                    {t("style.captions.maxDuration", {
                      v: Number(style.max_segment_duration ?? 3).toFixed(1),
                    })}
                  </span>
                  <RangeSlider
                    min={1.5}
                    max={5}
                    step={0.5}
                    value={style.max_segment_duration ?? 3}
                    onChange={(v) => set({ max_segment_duration: v })}
                    formatValue={(v) => `${v.toFixed(1)}s`}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <span className="text-xs text-[var(--text-secondary)]">
                  {t("style.captions.wordsPerChunk", {
                    n: style.sliding_window ?? 3,
                  })}
                </span>
                <RangeSlider
                  min={1}
                  max={7}
                  step={1}
                  value={style.sliding_window ?? 3}
                  onChange={(v) => set({ sliding_window: v })}
                  formatValue={(v) => String(v)}
                />
              </div>
            )}
          </div>
        ) : null}
      </section>
    </section>
  )
}
