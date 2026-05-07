import { useState } from "react"
import { useTranslation } from "react-i18next"

const POSITIONS_FULL = [
  { id: "top-left", label: "↖" },
  { id: "top-center", label: "↑" },
  { id: "top-right", label: "↗" },
  { id: "middle-left", label: "←" },
  { id: "center", label: "·" },
  { id: "middle-right", label: "→" },
  { id: "bottom-left", label: "↙" },
  { id: "bottom-center", label: "↓" },
  { id: "bottom-right", label: "↘" },
]

const SIMPLE = [
  { id: "top-center", key: "top" },
  { id: "center", key: "middle" },
  { id: "bottom-center", key: "bottom" },
]

export default function PositionControl({ value, onChange }) {
  const { t } = useTranslation()
  const [advanced, setAdvanced] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex gap-2 rounded-[var(--radius-sm)] bg-[var(--bg-surface)] p-1">
        {SIMPLE.map((s) => {
          const active = value === s.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(s.id)}
              className={[
                "cap-focus-visible flex-1 min-h-[44px] rounded-[var(--radius-sm)] text-sm font-semibold transition",
                active
                  ? "bg-[var(--accent)] text-white shadow-md"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              ].join(" ")}
            >
              {t(`studio.settings.positionSimple.${s.key}`)}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => setAdvanced((v) => !v)}
        className="text-xs font-semibold text-[var(--accent-bright)] hover:underline"
      >
        {advanced
          ? t("studio.settings.positionHideAdvanced")
          : t("studio.settings.positionAdvanced")}
      </button>

      {advanced ? (
        <div className="grid grid-cols-3 gap-2">
          {POSITIONS_FULL.map((p) => {
            const active = value === p.id
            return (
              <button
                key={p.id}
                type="button"
                title={p.id}
                onClick={() => onChange(p.id)}
                className={[
                  "cap-focus-visible h-12 rounded-[var(--radius-sm)] text-xl flex items-center justify-center border transition",
                  active
                    ? "bg-[var(--accent)] border-[var(--accent)] text-white shadow-[0_0_0_3px_var(--accent-glow)]"
                    : "bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent)]/40",
                ].join(" ")}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
