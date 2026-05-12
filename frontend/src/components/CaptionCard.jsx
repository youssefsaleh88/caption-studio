import { useEffect, useRef, useState } from "react"
import { formatTime } from "../utils/time"

export default function CaptionCard({
  caption,
  isActive,
  onEdit,
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
    if (isActive && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [isActive])

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

  return (
    <article
      ref={cardRef}
      className={[
        "cap-card transition-all duration-200",
        "px-4 py-3.5",
        isActive
          ? "ring-2 ring-primary/60 shadow-cardHover bg-surface-warm"
          : "hover:shadow-cardHover",
      ].join(" ")}
    >
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => onSeek?.(caption.start)}
          className="cap-pill bg-info-bg text-info font-bold cap-focus-ring tabular-nums"
          aria-label={`اقفز للوقت ${formatTime(caption.start)}`}
        >
          {formatTime(caption.start)}
        </button>
        <div className="flex items-center gap-1">
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
        <textarea
          ref={textareaRef}
          value={text}
          dir="auto"
          rows={1}
          onChange={(e) => {
            setText(e.target.value)
            autoSize(e.target)
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              commit()
            } else if (e.key === "Escape") {
              e.preventDefault()
              cancel()
            }
          }}
          className="cap-focus-ring w-full resize-none bg-transparent text-ink text-[15.5px] font-semibold leading-snug outline-none rounded-md py-1 px-1"
        />
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
