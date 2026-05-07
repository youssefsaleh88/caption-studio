import { useTranslation } from "react-i18next"

/**
 * Shared word text + timing controls.
 * @param {{ text: string, start: number, end: number }} draft
 * @param {(fn: (d: any) => any) => void} setDraft
 */
export default function WordEditorForm({
  draft,
  setDraft,
  timeStep = 0.05,
  onSave,
  onDelete,
  onPlayFromHere,
  className = "",
}) {
  const { t } = useTranslation()

  function bump(field, delta) {
    setDraft((d) => {
      const base = Number(d[field]) || 0
      const next = { ...d, [field]: base + delta }
      next.start = Math.max(0, Number(next.start))
      next.end = Math.max(next.start + 0.02, Number(next.end))
      return next
    })
  }

  return (
    <div className={["space-y-4", className].filter(Boolean).join(" ")}>
      <label className="block space-y-1.5">
        <span className="text-[11px] text-[var(--text-muted)]">
          {t("studio.captionItem.editText")}
        </span>
        <input
          type="text"
          value={draft.text}
          onChange={(e) =>
            setDraft((d) => ({ ...d, text: e.target.value }))
          }
          className="w-full rounded-[var(--radius-sm)] border border-[var(--accent)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:shadow-[0_0_12px_var(--accent-glow)] min-h-[48px]"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <span className="text-[11px] text-[var(--text-muted)]">
            {t("studio.captionItem.start")}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              className="cap-focus-visible w-10 h-11 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
              onClick={() => bump("start", -timeStep)}
            >
              −
            </button>
            <input
              type="number"
              step={timeStep}
              min={0}
              value={
                Number.isFinite(Number(draft.start))
                  ? Number(draft.start).toFixed(2)
                  : ""
              }
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  start: Number(e.target.value) || 0,
                }))
              }
              className="flex-1 min-w-0 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-2 text-sm font-mono text-center"
            />
            <button
              type="button"
              className="cap-focus-visible w-10 h-11 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
              onClick={() => bump("start", timeStep)}
            >
              +
            </button>
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-[var(--text-muted)]">
            {t("studio.captionItem.end")}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              className="cap-focus-visible w-10 h-11 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
              onClick={() => bump("end", -timeStep)}
            >
              −
            </button>
            <input
              type="number"
              step={timeStep}
              min={0}
              value={
                Number.isFinite(Number(draft.end))
                  ? Number(draft.end).toFixed(2)
                  : ""
              }
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  end: Number(e.target.value) || d.start + 0.02,
                }))
              }
              className="flex-1 min-w-0 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-2 text-sm font-mono text-center"
            />
            <button
              type="button"
              className="cap-focus-visible w-10 h-11 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
              onClick={() => bump("end", timeStep)}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onPlayFromHere}
          className="cap-focus-visible flex-1 min-h-[44px] rounded-[var(--radius-sm)] bg-[var(--accent)]/90 hover:bg-[var(--accent)] text-white text-sm font-semibold px-3"
        >
          {t("caption.playFromHere")}
        </button>
        <button
          type="button"
          onClick={onSave}
          className="cap-focus-visible flex-1 min-h-[44px] rounded-[var(--radius-sm)] bg-gradient-to-r from-[var(--accent)] to-[var(--blue)] text-white text-sm font-semibold shadow-lg shadow-[var(--accent)]/30"
        >
          {t("studio.captionItem.save")}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="cap-focus-visible flex-1 min-h-[44px] rounded-[var(--radius-sm)] border border-[var(--danger)]/50 text-[var(--danger)] text-sm font-semibold bg-transparent hover:bg-[var(--danger)]/10"
        >
          {t("studio.captionItem.delete")}
        </button>
      </div>
    </div>
  )
}
