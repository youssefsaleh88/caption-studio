import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  findWordIndexForSplit,
  moveWordByDelta,
  normalizeWordSequence,
  resizeWordEnd,
  resizeWordStart,
  sortWordsByStart,
  splitWordAtTime,
} from "../../utils/timelineUtils"

const TAP_THRESHOLD_PX = 8

function formatTime(sec) {
  const s = Math.max(0, Number(sec) || 0)
  const m = Math.floor(s / 60)
  const r = s - m * 60
  return `${m}:${r.toFixed(2).padStart(5, "0")}`
}

export default function CaptionTimeline({
  words,
  duration,
  currentTime,
  onSeek,
  onWordsChange,
  newId,
  selectedWordId = null,
  onSelectWord,
  onRequestEditWord,
  variant = "default",
}) {
  const { t } = useTranslation()
  const scrollRef = useRef(null)
  const trackRef = useRef(null)
  const [pps, setPps] = useState(72)
  const dragRef = useRef(null)
  const pendingRef = useRef(null)

  const roomy = variant === "roomy"

  const dur =
    Number.isFinite(Number(duration)) && Number(duration) > 0
      ? Number(duration)
      : 0
  const innerW = Math.max(280, (dur || 8) * pps + 48)

  const sorted = useMemo(() => sortWordsByStart(words), [words])

  const applyWords = useCallback(
    (next) => {
      onWordsChange(normalizeWordSequence(next, dur || null))
    },
    [onWordsChange, dur],
  )

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !dur) return
    const target = (currentTime / dur) * innerW - el.clientWidth * 0.35
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth)
    const next = Math.max(0, Math.min(maxScroll, target))
    if (Math.abs(el.scrollLeft - next) > el.clientWidth * 0.25) {
      el.scrollLeft = next
    }
  }, [currentTime, dur, innerW])

  const scrubFromClientX = useCallback(
    (clientX) => {
      const sc = scrollRef.current
      if (!sc || !dur) return
      const pr = sc.getBoundingClientRect()
      const x = sc.scrollLeft + (clientX - pr.left)
      const t = Math.max(0, Math.min(dur, x / pps))
      onSeek?.(t)
    },
    [dur, pps, onSeek],
  )

  const startDrag = useCallback(
    function startDrag(mode, word, e) {
      e.stopPropagation()
      e.preventDefault()
      onSelectWord?.(word.id)
      const snapshot = sortWordsByStart(words).map((w) => ({ ...w }))
      const originX = e.clientX
      const dragState = {
        mode,
        id: word.id,
        originX,
        originStart: Number(word.start),
        originEnd: Number(word.end),
        wordsSnapshot: snapshot,
      }
      dragRef.current = dragState

      const ppsLocal = pps
      const durLocal = dur || 1e12

      function onMove(ev) {
        const drag = dragRef.current
        if (!drag) return
        const dt = (ev.clientX - drag.originX) / ppsLocal
        const snap = drag.wordsSnapshot
        if (drag.mode === "move") {
          applyWords(moveWordByDelta(snap, drag.id, dt, durLocal))
        } else if (drag.mode === "resizeL") {
          applyWords(
            resizeWordStart(snap, drag.id, drag.originStart + dt, durLocal),
          )
        } else if (drag.mode === "resizeR") {
          applyWords(
            resizeWordEnd(snap, drag.id, drag.originEnd + dt, durLocal),
          )
        }
      }

      function onUp() {
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
        window.removeEventListener("pointercancel", onUp)
        dragRef.current = null
      }

      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
      window.addEventListener("pointercancel", onUp)
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    },
    [applyWords, dur, onSelectWord, pps, words],
  )

  function onBlockPointerDown(w, e) {
    if (e.button !== 0) return
    if (e.target.closest("[data-handle]")) return
    e.stopPropagation()
    onSelectWord?.(w.id)

    const ox = e.clientX
    const oy = e.clientY
    const pid = e.pointerId
    const target = e.currentTarget
    const state = { w, ox, oy, pid, target, dragStarted: false }
    pendingRef.current = state

    function cleanup() {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }

    function onMove(ev) {
      const p = pendingRef.current
      if (!p || p.dragStarted) return
      const dx = ev.clientX - p.ox
      const dy = ev.clientY - p.oy
      if (dx * dx + dy * dy >= TAP_THRESHOLD_PX * TAP_THRESHOLD_PX) {
        p.dragStarted = true
        pendingRef.current = null
        cleanup()
        const fakeE = {
          clientX: p.ox,
          pointerId: p.pid,
          currentTarget: p.target,
          stopPropagation: () => {},
          preventDefault: () => {},
        }
        startDrag("move", p.w, fakeE)
      }
    }

    function onUp() {
      const p = pendingRef.current
      cleanup()
      pendingRef.current = null
      if (p && !p.dragStarted) {
        onRequestEditWord?.(p.w.id)
      }
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  function handleSplit() {
    const next = splitWordAtTime(words, currentTime, newId, dur || null)
    if (next) applyWords(next)
  }

  const canSplit = findWordIndexForSplit(sorted, currentTime) >= 0

  const scrollClass = roomy
    ? "flex-1 min-h-[120px] max-h-[200px] overflow-x-auto overflow-y-hidden"
    : "flex-1 min-h-[88px] max-h-[120px] overflow-x-auto overflow-y-hidden"

  const trackH = roomy ? "h-[96px]" : "h-[76px]"

  return (
    <div
      className="flex flex-col border-t border-[var(--border-subtle)] bg-[var(--editor-rail)] text-[var(--text-primary)] shrink-0"
      dir="ltr"
    >
      <div className="flex flex-wrap items-center gap-2 px-2 py-1.5 border-b border-[var(--border-subtle)]/80">
        <button
          type="button"
          onClick={handleSplit}
          disabled={!canSplit}
          className="cap-focus-visible rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-primary)] hover:border-[var(--accent)]/40 disabled:opacity-40 disabled:pointer-events-none"
        >
          {t("studio.timeline.split")}
        </button>
        <label className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] ms-auto">
          <span className="whitespace-nowrap">{t("studio.timeline.zoom")}</span>
          <input
            type="range"
            min={28}
            max={160}
            value={pps}
            onChange={(e) => setPps(Number(e.target.value))}
            className="w-24 touch-range"
            aria-label={t("studio.timeline.zoom")}
          />
        </label>
        <span className="text-[10px] font-mono text-[var(--text-secondary)] tabular-nums">
          {formatTime(currentTime)}
          {dur > 0 ? ` / ${formatTime(dur)}` : ""}
        </span>
      </div>

      <div ref={scrollRef} className={scrollClass}>
        <div
          ref={trackRef}
          data-timeline-track
          className={[
            "relative mt-1 mb-2 mx-1 rounded-[var(--radius-sm)] bg-[var(--editor-timeline-track)] cursor-crosshair touch-pan-x",
            trackH,
          ].join(" ")}
          style={{ width: innerW }}
          onPointerDown={(e) => {
            if (e.button !== 0) return
            if (e.target.closest("[data-word-block]")) return
            scrubFromClientX(e.clientX)
          }}
        >
          {dur > 0
            ? Array.from({ length: Math.ceil(dur) + 1 }, (_, i) => (
                <div
                  key={`tick-${i}`}
                  className="absolute top-0 bottom-0 w-px bg-white/10 pointer-events-none"
                  style={{ left: i * pps }}
                >
                  <span className="absolute -top-0.5 left-0.5 text-[9px] text-[var(--text-muted)] font-mono">
                    {i}s
                  </span>
                </div>
              ))
            : null}

          {dur > 0 ? (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[var(--accent-bright)] z-20 pointer-events-none shadow-[0_0_8px_var(--accent)]"
              style={{
                left: Math.min(innerW - 2, Math.max(0, currentTime * pps)),
              }}
            />
          ) : null}

          <div className="absolute left-0 right-0 top-5 bottom-1 pointer-events-none">
            {sorted.map((w) => {
              const ws = Number(w.start)
              const we = Number(w.end)
              const left = ws * pps
              const width = Math.max(6, (we - ws) * pps)
              const active = String(w.id) === String(selectedWordId)
              return (
                <div
                  key={w.id}
                  data-word-block
                  className={[
                    "absolute top-0 bottom-0 rounded-md border flex items-stretch overflow-hidden select-none pointer-events-auto touch-none",
                    active
                      ? "border-[var(--accent-bright)] bg-[var(--accent)]/25 z-10 ring-1 ring-[var(--accent)]/35"
                      : "border-white/15 bg-[var(--bg-card)]/95 z-[5]",
                  ].join(" ")}
                  style={{ left, width }}
                  onPointerDown={(e) => onBlockPointerDown(w, e)}
                >
                  <button
                    type="button"
                    data-handle="L"
                    className="min-w-[10px] w-3 sm:w-2 shrink-0 cursor-ew-resize bg-black/40 hover:bg-[var(--accent)]/40 border-0 p-0"
                    aria-label={t("studio.timeline.resizeStart")}
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      startDrag("resizeL", w, e)
                    }}
                  />
                  <div className="flex-1 min-w-0 px-1 py-0.5 flex items-center gap-0.5">
                    <span
                      className="shrink-0 text-[9px] font-bold text-[var(--accent-bright)] opacity-90"
                      aria-hidden
                    >
                      T
                    </span>
                    <span className="truncate text-[10px] font-medium text-[var(--text-primary)]">
                      {w.word || "·"}
                    </span>
                  </div>
                  <button
                    type="button"
                    data-handle="R"
                    className="min-w-[10px] w-3 sm:w-2 shrink-0 cursor-ew-resize bg-black/40 hover:bg-[var(--accent)]/40 border-0 p-0"
                    aria-label={t("studio.timeline.resizeEnd")}
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      startDrag("resizeR", w, e)
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
