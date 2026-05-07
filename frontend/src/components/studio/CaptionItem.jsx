import {
  forwardRef,
  useEffect,
  useState,
} from "react"
import WordEditorForm from "./WordEditorForm"

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
          <WordEditorForm
            draft={draft}
            setDraft={setDraft}
            timeStep={timeStep}
            onSave={commitSave}
            onDelete={() => onDelete?.()}
            onPlayFromHere={() => onSeek?.(Math.max(0, Number(word.start)))}
          />
        </div>
      ) : null}
    </article>
  )
})

export default CaptionItem
