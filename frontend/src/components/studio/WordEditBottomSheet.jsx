import { useCallback, useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import WordEditorForm from "./WordEditorForm"

function formatRange(start, end) {
  const f = (x) => `${Math.floor(x / 60)}:${(x % 60).toFixed(2).padStart(5, "0")}`
  return `${f(start)} → ${f(end)}`
}

export default function WordEditBottomSheet({
  open,
  word,
  sortedWords = [],
  onClose,
  onPatch,
  onPatchKeepOpen,
  onDelete,
  onSeek,
  onNavigateToWordId,
  timeStep = 0.05,
  largeTouch = false,
  hideTimingControls = false,
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState({
    text: "",
    start: 0,
    end: 0,
  })

  useEffect(() => {
    if (!open || !word) return
    setDraft({
      text: word.word,
      start: word.start,
      end: word.end,
    })
  }, [open, word?.id, word?.word, word?.start, word?.end])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === "Escape") onClose?.()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const wordIndex = useMemo(
    () => sortedWords.findIndex((w) => String(w.id) === String(word?.id)),
    [sortedWords, word?.id],
  )
  const hasPrev = wordIndex > 0
  const hasNext =
    wordIndex >= 0 && wordIndex < sortedWords.length - 1

  const flushDraftToCurrentWord = useCallback(() => {
    if (!word) return
    const patch = {
      word: draft.text,
      start: Number(draft.start),
      end: Math.max(Number(draft.start) + 0.02, Number(draft.end)),
    }
    const same =
      String(word.word) === String(patch.word) &&
      Number(word.start) === patch.start &&
      Number(word.end) === patch.end
    if (!same) onPatchKeepOpen?.(patch)
  }, [draft, word, onPatchKeepOpen])

  const goAdjacent = useCallback(
    (dir) => {
      if (!word || !onNavigateToWordId) return
      const nextIdx = wordIndex + dir
      if (nextIdx < 0 || nextIdx >= sortedWords.length) return
      flushDraftToCurrentWord()
      const next = sortedWords[nextIdx]
      onNavigateToWordId(next.id)
      onSeek?.(Math.max(0, Number(next.start) || 0))
    },
    [
      word,
      wordIndex,
      sortedWords,
      onNavigateToWordId,
      onSeek,
      flushDraftToCurrentWord,
    ],
  )

  if (typeof document === "undefined" || !open || !word) return null

  function commitSave() {
    onPatch?.({
      word: draft.text,
      start: Number(draft.start),
      end: Math.max(Number(draft.start) + 0.02, Number(draft.end)),
    })
    onClose?.()
  }

  function handleDelete() {
    onDelete?.()
    onClose?.()
  }

  const node = (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center lg:items-center lg:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="word-edit-sheet-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label={t("studio.sheet.close")}
        onClick={() => onClose?.()}
      />
      <div
        className="relative w-full max-w-lg lg:max-w-md rounded-t-[var(--radius-card)] lg:rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-2xl max-h-[min(88dvh,640px)] overflow-y-auto overscroll-contain pb-[max(12px,env(safe-area-inset-bottom))] pt-3 px-4"
        dir="auto"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h2
              id="word-edit-sheet-title"
              className="text-sm font-bold text-[var(--text-primary)]"
            >
              {t("studio.sheet.title")}
            </h2>
            <p className="mt-0.5 text-[11px] font-mono tabular-nums text-[var(--accent-bright)]">
              {formatRange(word.start, word.end)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="cap-focus-visible shrink-0 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {t("studio.sheet.close")}
          </button>
        </div>

        {sortedWords.length > 1 && onNavigateToWordId ? (
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={() => goAdjacent(-1)}
              className="cap-focus-visible flex-1 min-h-[44px] rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 text-sm font-semibold text-[var(--text-primary)] disabled:opacity-35 disabled:pointer-events-none hover:border-[var(--accent)]/40"
            >
              {t("studio.sheet.prevWord")}
            </button>
            <button
              type="button"
              disabled={!hasNext}
              onClick={() => goAdjacent(1)}
              className="cap-focus-visible flex-1 min-h-[44px] rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 text-sm font-semibold text-[var(--text-primary)] disabled:opacity-35 disabled:pointer-events-none hover:border-[var(--accent)]/40"
            >
              {t("studio.sheet.nextWord")}
            </button>
          </div>
        ) : null}

        <WordEditorForm
          draft={draft}
          setDraft={setDraft}
          timeStep={timeStep}
          largeTouch={largeTouch}
          hideTiming={hideTimingControls}
          onSave={commitSave}
          onDelete={handleDelete}
          onPlayFromHere={() =>
            onSeek?.(Math.max(0, Number(draft.start) || 0))
          }
          className="border-t border-[var(--border-subtle)] pt-4"
        />
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
