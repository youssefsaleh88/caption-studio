import { useEffect, useRef, useState } from "react"
import { formatTime } from "../utils/time"
import TimeStepper from "./TimeStepper"

export default function CaptionCard({
  caption,
  timeBounds,
  isActive,
  autoScroll = true,
  scrollRoot = null,
  onEdit,
  onTimeChange,
  onDelete,
  onSeek,
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(caption.text)
  const textareaRef = useRef(null)
  const cardRef = useRef(null)

  useEffect(() => {
    setText(caption.text)
  }, [caption.text])

  useEffect(() => {
    if (editing && textareaRef.current) {
      const el = textareaRef.current
      el.focus()
      el.selectionStart = el.selectionEnd = el.value.length
      autoSize(el)
    }
  }, [editing])

  useEffect(() => {
    if (!isActive || !autoScroll || editing) return
    const card = cardRef.current
    const root = scrollRoot
    if (!card || !root) return

    const rootRect = root.getBoundingClientRect()
    const cardRect = card.getBoundingClientRect()

    const pad = 32
    if (
      cardRect.top >= rootRect.top + pad &&
      cardRect.bottom <= rootRect.bottom - pad
    ) {
      return
    }

    const offsetFromRootTop = cardRect.top - rootRect.top + root.scrollTop
    const target =
      offsetFromRootTop - root.clientHeight / 2 + card.clientHeight / 2

    root.scrollTo({
      top: Math.max(0, target),
      behavior: "smooth",
    })
  }, [isActive, autoScroll, editing, scrollRoot])

  function commit() {
    const next = text.trim()
    if (next && next !== caption.text) {
      onEdit?.(caption.id, next)
    } else {
      setText(caption.text)
    }
    setEditing(false)
  }

  function cancel() {
    setText(caption.text)
    setEditing(false)
  }

  const startMin = timeBounds?.startMin ?? 0
  const startMax = timeBounds?.startMax ?? Number(caption.end) - 0.2
  const endMin = timeBounds?.endMin ?? Number(caption.start) + 0.2
  const endMax = timeBounds?.endMax ?? Number.POSITIVE_INFINITY

  const duration = Math.max(0, Number(caption.end) - Number(caption.start))

  return (
    <article
      ref={cardRef}
      className={[
        "cap-card transition-all duration-200",
        "px-3.5 py-3",
        isActive
          ? "ring-2 ring-primary/60 shadow-cardHover bg-surface-warm"
          : "hover:shadow-cardHover",
      ].join(" ")}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        <button
          type="button"
          onClick={() => onSeek?.(caption.start)}
          className="cap-pill bg-info-bg text-info font-bold cap-focus-ring tabular-nums shrink-0"
          aria-label={`اقفز للوقت ${formatTime(caption.start)}`}
        >
          {formatTime(caption.start)}
        </button>

        <span className="text-[11px] font-bold text-ink-muted tabular-nums">
          {duration.toFixed(1)} ث
        </span>

        <div className="flex items-center gap-0.5 ms-auto">
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="تعديل"
              className="cap-btn-ghost cap-focus-ring !min-h-[34px] !w-9 !p-0"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </button>
          )}
          {editing && (
            <button
              type="button"
              onClick={cancel}
              aria-label="إلغاء"
              className="cap-btn-ghost cap-focus-ring !min-h-[34px] !w-9 !p-0"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete?.(caption.id)}
            aria-label="حذف"
            className="cap-btn-ghost cap-focus-ring !min-h-[34px] !w-9 !p-0 hover:!text-warn"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
          </button>
        </div>
      </div>

      {editing ? (
        <div className="space-y-2.5">
          <textarea
            ref={textareaRef}
            value={text}
            dir="auto"
            rows={1}
            onChange={(e) => {
              setText(e.target.value)
              autoSize(e.target)
            }}
            onBlur={(e) => {
              // Stay in edit mode if focus moved to another control inside
              // the same card (steppers, delete, cancel, time-pill).
              const next = e.relatedTarget
              if (next && cardRef.current?.contains(next)) return
              commit()
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                commit()
              } else if (e.key === "Escape") {
                e.preventDefault()
                cancel()
              }
            }}
            className="cap-focus-ring w-full resize-none bg-surface border border-line rounded-md text-ink text-[15.5px] font-semibold leading-snug outline-none py-2 px-2.5 focus:border-primary"
          />

          <div className="space-y-2.5 pt-1 border-t border-line/60">
            <TimeStepper
              label="بداية"
              value={Number(caption.start)}
              onChange={(v) => onTimeChange?.(caption.id, { start: v })}
              min={startMin}
              max={startMax}
            />
            <TimeStepper
              label="نهاية"
              value={Number(caption.end)}
              onChange={(v) => onTimeChange?.(caption.id, { end: v })}
              min={endMin}
              max={endMax}
            />
            <p className="text-[10.5px] font-bold text-ink-muted leading-snug">
              اكتب الوقت بالثواني، أو استخدم{" "}
              <span className="font-mono text-ink-soft">±0.1</span> للضبط الدقيق و
              <span className="font-mono text-ink-soft"> ±1</span> للقفز السريع. ممكن كمان{" "}
              <span className="font-mono text-ink-soft">+0.25</span> أو{" "}
              <span className="font-mono text-ink-soft">-0.05</span> في الخانة نفسها.
            </p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="block w-full text-start text-ink text-[15.5px] font-semibold leading-snug cap-focus-ring rounded-md"
          dir="auto"
        >
          {caption.text || (
            <span className="text-ink-muted">فاضي — اضغط للكتابة</span>
          )}
        </button>
      )}
    </article>
  )
}

function autoSize(el) {
  el.style.height = "auto"
  el.style.height = `${el.scrollHeight}px`
}
