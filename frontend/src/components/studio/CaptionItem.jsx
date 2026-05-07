import {
  forwardRef,
  useEffect,
  useState,
} from "react"
import { useTranslation } from "react-i18next"

function formatRange(start, end) {
  const f = (x) => `${Math.floor(x / 60)}:${(x % 60).toFixed(2).padStart(5, "0")}`
  return `${f(start)} → ${f(end)}`
}

const CaptionItem = forwardRef(function CaptionItem(
  {
    word,
    expanded,
    active,
    onHeaderClick,
    onPatch,
    onSaved,
    onDelete,
    onSeek,
    staggerIndex = 0,
    timeStep = 0.05,
  },
  ref,
) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState({
    text: word.word,
    start: word.start,
    end: word.end,
  })

  useEffect(() => {
    if (!expanded) {
      setDraft({ text: word.word, start: word.start, end: word.end })
    }
  }, [word.word, word.start, word.end, expanded])

  function commitSave() {
    onPatch?.({
      word: draft.text,
      start: Number(draft.start),
      end: Math.max(Number(draft.start) + 0.02, Number(draft.end)),
    })
    onSaved?.()
  }

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
    <article
      ref={ref}
      className={[
        "rounded-[var(--radius-sm)] border transition-all duration-[var(--capt-expand-duration)] overflow-hidden animate-cap-slide-up opacity-0",
        expanded
          ? "border-[var(--accent)] shadow-[0_0_0_3px_var(--accent-glow)] bg-[var(--bg-surface)]"
          : active
            ? "border-[var(--accent)]/70 bg-[var(--bg-card)] ring-1 ring-[var(--accent)]/25"
            : "border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--accent)]/35",
      ].join(" ")}
      style={{
        animationDelay: `${staggerIndex * 60}ms`,
        animationFillMode: "forwards",
      }}
    >
      <button
        type="button"
        onClick={onHeaderClick}
        className="w-full text-start px-3.5 py-3 flex items-start gap-3"
      >
        <span className="shrink-0 rounded-[var(--radius-sm)] bg-[var(--accent-dim)] px-2 py-1 text-[11px] font-mono tabular-nums text-[var(--accent-bright)] border border-[var(--accent)]/20">
          {formatRange(word.start, word.end)}
        </span>
        <span className="flex-1 text-[15px] font-medium text-[var(--text-primary)] leading-snug">
          {word.word || "…"}
        </span>
        <span
          className="shrink-0 text-[var(--text-muted)] text-lg leading-none pt-0.5"
          aria-hidden
        >
          ✏
        </span>
      </button>

      {expanded ? (
        <div className="px-3.5 pb-4 space-y-4 border-t border-[var(--border-subtle)] bg-black/20">
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
                  value={Number(draft.start).toFixed(2)}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      start: Number(e.target.value),
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
                  value={Number(draft.end).toFixed(2)}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, end: Number(e.target.value) }))
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
              onClick={() => onSeek?.(Math.max(0, word.start))}
              className="cap-focus-visible flex-1 min-h-[44px] rounded-[var(--radius-sm)] bg-[var(--accent)]/90 hover:bg-[var(--accent)] text-white text-sm font-semibold px-3"
            >
              {t("caption.playFromHere")}
            </button>
            <button
              type="button"
              onClick={commitSave}
              className="cap-focus-visible flex-1 min-h-[44px] rounded-[var(--radius-sm)] bg-gradient-to-r from-[var(--accent)] to-[var(--blue)] text-white text-sm font-semibold shadow-lg shadow-[var(--accent)]/30"
            >
              {t("studio.captionItem.save")}
            </button>
            <button
              type="button"
              onClick={() => onDelete?.()}
              className="cap-focus-visible flex-1 min-h-[44px] rounded-[var(--radius-sm)] border border-[var(--danger)]/50 text-[var(--danger)] text-sm font-semibold bg-transparent hover:bg-[var(--danger)]/10"
            >
              {t("studio.captionItem.delete")}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  )
})

export default CaptionItem
