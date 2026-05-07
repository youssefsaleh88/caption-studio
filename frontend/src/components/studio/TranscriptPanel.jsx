import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { scrollElementIntoContainer } from "../../utils/scrollIntoContainer"

function formatT(sec) {
  const s = Math.max(0, Number(sec) || 0)
  const m = Math.floor(s / 60)
  const r = s - m * 60
  return `${m}:${r.toFixed(2).padStart(5, "0")}`
}

export default function TranscriptPanel({
  words,
  currentTime,
  selectedWordId,
  onSelectWord,
  onEditWord,
  autoFollow = true,
  onAutoFollowChange,
}) {
  const { t } = useTranslation()
  const [q, setQ] = useState("")
  const listRef = useRef(null)
  const rowRefs = useRef(new Map())

  const sorted = useMemo(
    () => [...words].sort((a, b) => a.start - b.start),
    [words],
  )

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    if (!qq) return sorted
    return sorted.filter((w) =>
      String(w.word ?? "")
        .toLowerCase()
        .includes(qq),
    )
  }, [sorted, q])

  const activeId = useMemo(() => {
    for (const w of sorted) {
      if (currentTime >= w.start && currentTime <= w.end) return w.id
    }
    return null
  }, [sorted, currentTime])

  useEffect(() => {
    if (!autoFollow || !activeId) return
    const el = rowRefs.current.get(activeId)
    const container = listRef.current
    if (el && container) {
      scrollElementIntoContainer(el, container, {
        behavior: "smooth",
        margin: 10,
      })
    }
  }, [activeId, autoFollow])

  return (
    <section className="flex flex-col h-full min-h-0 gap-2 px-2 py-2">
      <div className="shrink-0 space-y-2">
        <h2 className="text-xs font-bold text-[var(--text-primary)] px-0.5">
          {t("studio.transcript.title")}
        </h2>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("studio.transcript.searchPlaceholder")}
          className="w-full rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/50"
        />
        {onAutoFollowChange ? (
          <label className="flex items-center gap-2 px-0.5 text-[11px] text-[var(--text-secondary)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoFollow}
              onChange={(e) => onAutoFollowChange(e.target.checked)}
              className="w-3.5 h-3.5 accent-[var(--accent)] rounded-[4px]"
            />
            <span>{t("studio.captions.autoFollow")}</span>
          </label>
        ) : null}
      </div>

      <ul
        ref={listRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-1.5 pb-2"
      >
        {filtered.map((w) => {
          const isSel = String(w.id) === String(selectedWordId)
          const isPlay = String(w.id) === String(activeId)
          return (
            <li
              key={w.id}
              ref={(el) => {
                if (el) rowRefs.current.set(w.id, el)
                else rowRefs.current.delete(w.id)
              }}
            >
              <div
                className={[
                  "rounded-[var(--radius-sm)] border px-2 py-2 flex gap-2 items-start transition-colors",
                  isSel
                    ? "border-[var(--accent-bright)] bg-[var(--accent)]/15 ring-1 ring-[var(--accent)]/30"
                    : isPlay
                      ? "border-[var(--accent)]/50 bg-[var(--bg-card)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-card)]/80 hover:border-[var(--accent)]/35",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={() => onSelectWord?.(w.id)}
                  className="flex-1 min-w-0 text-start"
                >
                  <span className="block text-[10px] font-mono tabular-nums text-[var(--accent-bright)]">
                    {formatT(w.start)} → {formatT(w.end)}
                  </span>
                  <span className="block text-[13px] font-medium text-[var(--text-primary)] leading-snug mt-0.5">
                    {w.word || "…"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditWord?.(w.id)
                  }}
                  className="cap-focus-visible shrink-0 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] px-2 py-1 text-[10px] font-semibold text-[var(--accent-bright)] hover:bg-[var(--accent-dim)]"
                >
                  {t("studio.transcript.edit")}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
