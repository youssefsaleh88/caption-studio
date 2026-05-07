import { useEffect, useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"
import CaptionItem from "./CaptionItem"
import { scrollElementIntoContainer } from "../../utils/scrollIntoContainer"

function pickScrollContainer(mainRef, colRef) {
  const col = colRef?.current
  if (col && col.scrollHeight > col.clientHeight + 2) return col
  return mainRef?.current ?? null
}

export default function CaptionList({
  words,
  currentTime,
  expandedId,
  onExpandedChange,
  onPatchWord,
  onDelete,
  onSeek,
  mainScrollRef,
  columnScrollRef,
  panelOpen,
  onTogglePanel,
  autoFollow,
  onAutoFollowChange,
}) {
  const { t } = useTranslation()
  const itemRefs = useRef(new Map())

  const sorted = useMemo(
    () => [...words].sort((a, b) => a.start - b.start),
    [words],
  )

  const activeId = useMemo(() => {
    for (const w of sorted) {
      if (currentTime >= w.start && currentTime <= w.end) return w.id
    }
    return null
  }, [sorted, currentTime])

  useEffect(() => {
    if (!autoFollow || !activeId) return
    const el = itemRefs.current.get(activeId)
    const container = pickScrollContainer(mainScrollRef, columnScrollRef)
    if (el && container) {
      scrollElementIntoContainer(el, container, {
        behavior: "smooth",
        margin: 10,
      })
    }
  }, [activeId, autoFollow, mainScrollRef, columnScrollRef])

  useEffect(() => {
    if (!expandedId) return
    const id = window.setTimeout(() => {
      const el = itemRefs.current.get(expandedId)
      const container = pickScrollContainer(mainScrollRef, columnScrollRef)
      if (el && container) {
        scrollElementIntoContainer(el, container, {
          behavior: "smooth",
          margin: 16,
        })
      }
    }, 350)
    return () => window.clearTimeout(id)
  }, [expandedId, mainScrollRef, columnScrollRef])

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-0.5">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onTogglePanel}
            className="cap-focus-visible flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--accent)]/40 min-h-[44px]"
            aria-expanded={panelOpen}
            aria-label={panelOpen ? t("studio.captions.toggleHide") : t("studio.captions.toggleShow")}
          >
            <span className="text-[var(--text-muted)]">──</span>
            {t("studio.sectionWords")}
            <span className="text-[var(--text-muted)]">──</span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={[
                "shrink-0 text-[var(--text-muted)] transition-transform",
                panelOpen ? "rotate-180" : "",
              ].join(" ")}
              aria-hidden
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <span className="text-xs font-mono tabular-nums text-[var(--text-secondary)]">
            {sorted.length} {t("studio.wordsCount")}
          </span>
        </div>

        {panelOpen ? (
          <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoFollow}
              onChange={(e) => onAutoFollowChange?.(e.target.checked)}
              className="w-4 h-4 accent-[var(--accent)] rounded-[4px]"
            />
            <span>{t("studio.captions.autoFollow")}</span>
          </label>
        ) : null}
      </div>

      {!panelOpen ? (
        <p className="text-[11px] text-[var(--text-muted)] px-0.5 leading-snug">
          {t("studio.captions.panelCollapsedHint")}
        </p>
      ) : (
        <div className="space-y-3 pb-2">
          {sorted.map((w, i) => (
            <CaptionItem
              key={w.id}
              ref={(el) => {
                if (el) itemRefs.current.set(w.id, el)
                else itemRefs.current.delete(w.id)
              }}
              word={w}
              expanded={expandedId === w.id}
              active={activeId === w.id}
              onHeaderClick={() =>
                onExpandedChange(expandedId === w.id ? null : w.id)
              }
              onPatch={(patch) => onPatchWord(w.id, patch)}
              onSaved={() => onExpandedChange(null)}
              onDelete={() => onDelete(w.id)}
              onSeek={onSeek}
              staggerIndex={i}
            />
          ))}
        </div>
      )}
    </section>
  )
}
