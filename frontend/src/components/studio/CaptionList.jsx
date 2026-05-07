import { useEffect, useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"
import CaptionItem from "./CaptionItem"

export default function CaptionList({
  words,
  currentTime,
  expandedId,
  onExpandedChange,
  onPatchWord,
  onDelete,
  onSeek,
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

  /* تجنِّب حلقة إعادة رسم لا نهاية (React #185): لا ترتبِط بتقدُّم الفيديو — فقط بتغيّر الكلمة النشطة */
  useEffect(() => {
    if (!activeId) return
    const el = itemRefs.current.get(activeId)
    el?.scrollIntoView?.({ block: "nearest", behavior: "smooth" })
  }, [activeId])

  useEffect(() => {
    if (!expandedId) return
    const id = window.setTimeout(() => {
      const el = itemRefs.current.get(expandedId)
      el?.scrollIntoView?.({ behavior: "smooth", block: "center" })
    }, 350)
    return () => window.clearTimeout(id)
  }, [expandedId])

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
          <span className="text-[var(--text-muted)]">──</span>
          {t("studio.sectionWords")}
          <span className="text-[var(--text-muted)]">──</span>
        </h2>
        <span className="text-xs font-mono tabular-nums text-[var(--text-secondary)]">
          {sorted.length} {t("studio.wordsCount")}
        </span>
      </div>

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
    </section>
  )
}
