import { useState } from "react"
import SettingsSection from "../studio/SettingsSection"
import HelpHint from "./HelpHint"
import { STYLE_PRESETS } from "./StylePresets"

export default function StepStyle({ style, onChange }) {
  const [advancedOpen, setAdvancedOpen] = useState(false)

  return (
    <div className="space-y-3">
      <HelpHint text="اختار شكل جاهز سريع. ولو حابب تفاصيل أكثر افتح التخصيص المتقدم." />

      <div className="grid gap-2">
        {STYLE_PRESETS.map((preset) => {
          const active =
            style.fontFamily === preset.patch.fontFamily &&
            style.color === preset.patch.color &&
            style.caption_animation === preset.patch.caption_animation
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange({ ...style, ...preset.patch })}
              className={[
                "cap-focus-visible rounded-[var(--radius-card)] border px-3 py-3 text-start",
                active
                  ? "border-[var(--accent)] bg-[var(--accent)]/12"
                  : "border-[var(--border-subtle)] bg-[var(--bg-card)]",
              ].join(" ")}
            >
              <p className="text-sm font-bold text-[var(--text-primary)]">{preset.name}</p>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{preset.description}</p>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => setAdvancedOpen(true)}
        className="cap-focus-visible min-h-[46px] w-full rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 text-sm font-semibold text-[var(--text-primary)]"
      >
        تخصيص متقدم
      </button>

      {advancedOpen ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            onClick={() => setAdvancedOpen(false)}
            aria-label="close advanced settings"
          />
          <div className="relative max-h-[82dvh] w-full overflow-y-auto rounded-t-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-base)] p-3 pb-[max(10px,env(safe-area-inset-bottom))]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">تخصيص متقدم</h3>
              <button
                type="button"
                onClick={() => setAdvancedOpen(false)}
                className="cap-focus-visible rounded-[var(--radius-sm)] border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-[var(--text-secondary)]"
              >
                إغلاق
              </button>
            </div>
            <SettingsSection style={style} onChange={onChange} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

