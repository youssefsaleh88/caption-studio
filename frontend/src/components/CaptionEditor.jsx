import { useEffect, useRef, useState } from "react"

export default function CaptionEditor({
  words,
  currentTime,
  selectedWordId,
  onWordClick,
  onEdit,
  onDelete,
  onAddAfter,
}) {
  const [draftValue, setDraftValue] = useState("")
  const inputRef = useRef(null)

  const selectedWord = words.find((w) => w.id === selectedWordId)

  useEffect(() => {
    setDraftValue(selectedWord?.word ?? "")
  }, [selectedWordId, selectedWord?.word])

  useEffect(() => {
    if (selectedWord && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [selectedWordId])

  function isActive(w) {
    return currentTime >= w.start && currentTime <= w.end
  }

  function commitEdit() {
    if (!selectedWord) return
    const trimmed = draftValue.trim()
    if (trimmed && trimmed !== selectedWord.word) {
      onEdit(selectedWord.id, trimmed)
    }
  }

  function handleKey(e) {
    if (e.key === "Enter") {
      e.preventDefault()
      commitEdit()
    } else if (e.key === "Escape") {
      e.preventDefault()
      setDraftValue(selectedWord?.word ?? "")
      onWordClick(null)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-1 mb-3">
        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
          Captions
        </h3>
        <span className="text-xs text-white/40 font-mono">
          {words.length} words
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        <div className="flex flex-wrap gap-2 content-start">
          {words.map((w) => {
            const active = isActive(w)
            const selected = w.id === selectedWordId
            return (
              <button
                key={w.id}
                onClick={() => onWordClick(w.id)}
                className={[
                  "group flex flex-col items-center px-3 py-2 rounded-lg transition-all",
                  "border text-left",
                  active
                    ? "bg-accent text-white border-accent shadow-lg shadow-accent/30"
                    : "bg-dark-surface text-white/85 border-white/5 hover:border-white/20",
                  selected
                    ? "ring-2 ring-white scale-[1.04] border-white"
                    : "",
                ].join(" ")}
              >
                <span className="text-[15px] font-medium leading-none">
                  {w.word}
                </span>
                <span
                  className={[
                    "text-[10px] mt-1 font-mono leading-none",
                    active ? "text-white/85" : "text-white/40",
                  ].join(" ")}
                >
                  {w.start.toFixed(1)}s
                </span>
              </button>
            )
          })}
          {words.length === 0 && (
            <div className="text-sm text-white/40 px-2 py-4">
              No captions yet.
            </div>
          )}
        </div>
      </div>

      {selectedWord && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-dark-surface px-3 py-2">
          <span className="text-[11px] font-mono text-white/40 px-1">
            {selectedWord.start.toFixed(2)}s → {selectedWord.end.toFixed(2)}s
          </span>
          <input
            ref={inputRef}
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            onKeyDown={handleKey}
            className="flex-1 bg-dark px-3 py-2 rounded-lg outline-none text-white border border-transparent focus:border-accent text-sm"
            placeholder="Edit word…"
          />
          <button
            type="button"
            onClick={commitEdit}
            title="Confirm (Enter)"
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-accent hover:bg-accent-hover text-white"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onAddAfter(selectedWord.id)}
            title="Add word after"
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/85 border border-white/10"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onDelete(selectedWord.id)}
            title="Delete"
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
