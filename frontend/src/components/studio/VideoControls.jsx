import { useCallback, useRef } from "react"

function formatClock(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00"
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

export default function VideoControls({
  duration,
  currentTime,
  playing,
  onTogglePlay,
  onSeekToTime,
}) {
  const barRef = useRef(null)

  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  const onBarPointer = useCallback(
    (clientX) => {
      const el = barRef.current
      if (!el || duration <= 0) return
      const rect = el.getBoundingClientRect()
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width)
      onSeekToTime?.((x / rect.width) * duration)
    },
    [duration, onSeekToTime],
  )

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 px-3 pb-3 pt-10 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-auto">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onTogglePlay}
          className="cap-focus-visible shrink-0 w-11 h-11 rounded-full bg-white/12 border border-white/20 flex items-center justify-center text-white hover:bg-white/18 transition"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div
          ref={barRef}
          role="slider"
          tabIndex={0}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration * 1000)}
          aria-valuenow={Math.round(currentTime * 1000)}
          className="flex-1 h-3 rounded-full bg-white/12 cursor-pointer relative touch-none group"
          onClick={(e) => onBarPointer(e.clientX)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight")
              onSeekToTime?.(Math.min(duration, currentTime + 2))
            if (e.key === "ArrowLeft")
              onSeekToTime?.(Math.max(0, currentTime - 2))
          }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--blue)] shadow-[0_0_12px_rgb(108_99_255_/_0.45)]"
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-md border border-white/40 transition-transform group-active:scale-[1.2] motion-reduce:group-active:scale-100"
            style={{ left: `calc(${pct}% - 8px)` }}
          />
        </div>

        <span className="shrink-0 text-[11px] font-mono tabular-nums text-white/85 min-w-[5.5rem] text-end">
          {formatClock(currentTime)} / {formatClock(duration)}
        </span>
      </div>
    </div>
  )
}
