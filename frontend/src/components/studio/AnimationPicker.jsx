import { useTranslation } from "react-i18next"
import {
  CAPTION_ANIMATION_IDS,
  CAPTION_ANIMATIONS,
} from "../../utils/captionAnimations"

export default function AnimationPicker({ value, onChange }) {
  const { t } = useTranslation()
  const current = value && CAPTION_ANIMATIONS[value] ? value : "none"

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {CAPTION_ANIMATION_IDS.map((id) => {
        const cfg = CAPTION_ANIMATIONS[id]
        const selected = current === id
        const previewCls = cfg.previewClass || ""

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange?.(id)}
            className={[
              "cap-focus-visible rounded-[var(--radius-sm)] border p-3 text-start transition-all min-h-[88px] flex flex-col gap-2",
              selected
                ? "border-[var(--accent)] bg-[var(--accent-dim)] ring-2 ring-[var(--accent)]/40 shadow-[0_0_20px_var(--accent-glow)]"
                : "border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--accent)]/35",
            ].join(" ")}
          >
            <div
              className={[
                "relative h-10 rounded-md bg-black/35 flex items-center justify-center overflow-hidden border border-white/10",
                previewCls,
              ].join(" ")}
            >
              <span className="text-[13px] font-semibold text-white/95 px-2 truncate">
                Caption
              </span>
            </div>
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
              {t(`studio.animations.${id}`)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
