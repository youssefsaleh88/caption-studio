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
const TAP_THRESHOLD_ROOMY_PX = 14

const MOB_RULER_H = 24
const MOB_TOOLBAR_H = 40
const MOB_VIDEO_STRIP_H = 28
const MOB_WORDS_TRACK_H = 68
const MOB_ZOOM_MIN = 48
const MIN_WORD_PIXEL_FOR_FLOOR = 18

function formatTime(sec) {
  const s = Math.max(0, Number(sec) || 0)
  const m = Math.floor(s / 60)
  const r = s - m * 60
  return `${m}:${r.toFixed(2).padStart(5, "0")}`
}

function formatMMSS(sec) {
  const s = Math.floor(Math.max(0, Number(sec) || 0))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
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
  mediaControlRef = null,
}) {
  const { t } = useTranslation()
  const scrollRef = useRef(null)
  const trackRef = useRef(null)
  const roomy = variant === "roomy"
  const [pps, setPps] = useState(() => (roomy ? 110 : 72))
  const [editOnlyMode, setEditOnlyMode] = useState(false)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [mediaPaused, setMediaPaused] = useState(true)
  const dragRef = useRef(null)
  const pendingRef = useRef(null)

  const dur =
    Number.isFinite(Number(duration)) && Number(duration) > 0
      ? Number(duration)
      : 0

  const sorted = useMemo(() => sortWordsByStart(words), [words])

  const autoFloorPps = useMemo(() => {
    if (!roomy || !sorted.length) return 0
    let maxNeed = 0
    for (const w of sorted) {
      const dt = Math.max(0.02, Number(w.end) - Number(w.start))
      maxNeed = Math.max(maxNeed, MIN_WORD_PIXEL_FOR_FLOOR / dt)
    }
    return Math.min(160, maxNeed)
  }, [roomy, sorted])

  const effectivePps = useMemo(() => {
    if (!roomy) return pps
    return Math.min(160, Math.max(pps, autoFloorPps))
  }, [roomy, pps, autoFloorPps])

  const innerW = Math.max(280, (dur || 8) * effectivePps + 48)

  useEffect(() => {
    if (!roomy) return
    if (pps < MOB_ZOOM_MIN) setPps(MOB_ZOOM_MIN)
  }, [roomy, pps])

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

  useEffect(() => {
    if (!roomy || !mediaControlRef) return
    let dead = false
    let pendingRaf = 0
    let videoEl = null

    const sync = () => {
      if (!dead && videoEl) setMediaPaused(Boolean(videoEl.paused))
    }

    function tryAttach() {
      if (dead) return
      const v = mediaControlRef.current?.element ?? null
      if (!v) {
        cancelAnimationFrame(pendingRaf)
        pendingRaf = requestAnimationFrame(tryAttach)
        return
      }
      videoEl = v
      v.addEventListener("play", sync)
      v.addEventListener("pause", sync)
      setMediaPaused(Boolean(v.paused))
    }

    tryAttach()
    return () => {
      dead = true
      cancelAnimationFrame(pendingRaf)
      if (videoEl) {
        videoEl.removeEventListener("play", sync)
        videoEl.removeEventListener("pause", sync)
      }
    }
  }, [roomy, mediaControlRef])

  const scrubFromClientX = useCallback(
    (clientX) => {
      const sc = scrollRef.current
      if (!sc || !dur) return
      const pr = sc.getBoundingClientRect()
      const x = sc.scrollLeft + (clientX - pr.left)
      const t = Math.max(0, Math.min(dur, x / effectivePps))
      onSeek?.(t)
    },
    [dur, effectivePps, onSeek],
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

      const ppsLocal = effectivePps
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
    [applyWords, dur, effectivePps, onSelectWord, words],
  )

  function onBlockPointerDown(w, e) {
    if (e.button !== 0) return
    if (e.target.closest("[data-handle]")) return
    e.stopPropagation()
    onSelectWord?.(w.id)

    if (editOnlyMode) {
      onRequestEditWord?.(w.id)
      return
    }

    const tapPx = roomy ? TAP_THRESHOLD_ROOMY_PX : TAP_THRESHOLD_PX

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
      if (dx * dx + dy * dy >= tapPx * tapPx) {
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

  function handleTogglePlay() {
    mediaControlRef?.current?.togglePlay?.()
    requestAnimationFrame(() => {
      setMediaPaused(Boolean(mediaControlRef?.current?.isPaused?.()))
    })
  }

  function handleSeekStart() {
    onSeek?.(0)
    mediaControlRef?.current?.pause?.()
  }

  const canSplit = findWordIndexForSplit(sorted, currentTime) >= 0
  const currentWordId = useMemo(() => {
    const found = sorted.find(
      (w) => currentTime >= Number(w.start) && currentTime <= Number(w.end),
    )
    return found ? String(found.id) : null
  }, [sorted, currentTime])

  const playLeft = Math.min(
    innerW - 2,
    Math.max(0, currentTime * effectivePps),
  )

  const scrollClass = roomy
    ? "flex-1 min-h-[150px] max-h-[min(240px,42vh)] overflow-x-auto overflow-y-hidden touch-pan-x"
    : "flex-1 min-h-[88px] max-h-[120px] overflow-x-auto overflow-y-hidden"

  const trackH = roomy ? "h-[76px]" : "h-[76px]"

  const rulerTicks = useMemo(() => {
    if (!dur) return [0]
    const step = 5
    const out = []
    for (let s = 0; s < dur; s += step) {
      out.push(s)
    }
    const last = out[out.length - 1]
    if (last === undefined || last < dur) out.push(dur)
    return out
  }, [dur])

  const stackH =
    MOB_RULER_H +
    MOB_TOOLBAR_H +
    (zoomOpen ? 36 : 0) +
    MOB_VIDEO_STRIP_H +
    MOB_WORDS_TRACK_H +
    8

  if (roomy) {
    return (
      <div
        className="flex flex-col border-t border-[var(--border-subtle)] bg-[var(--editor-rail)] text-[var(--text-primary)] shrink-0"
        dir="ltr"
      >
        <div ref={scrollRef} className={scrollClass}>
          <div
            className="relative mx-1 my-1 rounded-[var(--radius-sm)] border border-[var(--border-subtle)]/60 bg-[var(--bg-base)]/50 overflow-hidden"
            style={{ width: innerW, minHeight: stackH }}
          >
            {dur > 0 ? (
              <div
                className="absolute top-0 bottom-0 z-[35] w-[2px] bg-white pointer-events-none shadow-[0_0_10px_rgba(255,255,255,0.55)]"
                style={{ left: playLeft }}
                aria-hidden
              />
            ) : null}

            <div
              className="relative border-b border-white/10 bg-black/35"
              style={{ height: MOB_RULER_H }}
              onPointerDown={(e) => {
                if (e.button !== 0) return
                scrubFromClientX(e.clientX)
              }}
            >
              {dur > 0
                ? rulerTicks.map((sec) => (
                    <div
                      key={`r-${sec}`}
                      className="absolute top-0 bottom-0 w-px bg-white/20 pointer-events-none"
                      style={{ left: sec * effectivePps }}
                    >
                      <span className="absolute left-0.5 top-0.5 text-[9px] font-mono tabular-nums text-[var(--text-muted)] whitespace-nowrap">
                        {formatMMSS(sec)}
                      </span>
                    </div>
                  ))
                : null}
            </div>

            <div
              className="flex items-center gap-1 px-1 border-b border-[var(--border-subtle)]/50 bg-[var(--editor-rail)]"
              style={{ height: MOB_TOOLBAR_H }}
            >
              <button
                type="button"
                onClick={() => setEditOnlyMode((v) => !v)}
                className={[
                  "cap-focus-visible shrink-0 rounded-[var(--radius-sm)] border px-1.5 py-1 text-[9px] font-bold leading-tight max-w-[4.5rem]",
                  editOnlyMode
                    ? "border-[var(--accent-bright)] bg-[var(--accent)]/25 text-[var(--accent-bright)]"
                    : "border-white/15 bg-[var(--bg-surface)] text-[var(--text-secondary)]",
                ].join(" ")}
                aria-pressed={editOnlyMode}
                title={t("studio.timeline.editOnlyHint")}
              >
                {t("studio.timeline.editOnly")}
              </button>
              <button
                type="button"
                onClick={handleTogglePlay}
                disabled={!mediaControlRef}
                className="cap-focus-visible shrink-0 flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-white/15 bg-[var(--bg-surface)] text-[var(--text-primary)] disabled:opacity-40"
                aria-label={
                  mediaPaused
                    ? t("studio.timeline.play")
                    : t("studio.timeline.pause")
                }
              >
                {mediaPaused ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={handleSeekStart}
                className="cap-focus-visible shrink-0 flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-white/15 bg-[var(--bg-surface)] text-[var(--text-primary)]"
                aria-label={t("studio.timeline.seekStart")}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  aria-hidden
                >
                  <polygon points="5 4 15 12 5 20 5 4" />
                  <line x1="19" y1="5" x2="19" y2="19" strokeLinecap="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleSplit}
                disabled={!canSplit}
                className="cap-focus-visible shrink-0 flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-white/15 bg-[var(--bg-surface)] text-[var(--accent-bright)] disabled:opacity-40"
                aria-label={t("studio.timeline.split")}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setZoomOpen((z) => !z)}
                className={[
                  "cap-focus-visible ms-auto shrink-0 flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border",
                  zoomOpen
                    ? "border-[var(--accent-bright)] bg-[var(--accent)]/20 text-[var(--accent-bright)]"
                    : "border-white/15 bg-[var(--bg-surface)] text-[var(--text-secondary)]",
                ].join(" ")}
                aria-expanded={zoomOpen}
                aria-label={t("studio.timeline.zoomPanel")}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2" />
                </svg>
              </button>
              <span className="shrink-0 text-[10px] font-mono tabular-nums text-[var(--text-secondary)] pe-1">
                {formatTime(currentTime)}
                {dur > 0 ? ` / ${formatTime(dur)}` : ""}
              </span>
            </div>

            {zoomOpen ? (
              <div className="flex items-center gap-2 px-2 py-1 border-b border-[var(--border-subtle)]/40 bg-black/25">
                <span className="text-[9px] text-[var(--text-muted)] whitespace-nowrap">
                  {t("studio.timeline.zoom")}
                </span>
                <input
                  type="range"
                  min={MOB_ZOOM_MIN}
                  max={160}
                  value={pps}
                  onChange={(e) => setPps(Number(e.target.value))}
                  className="flex-1 min-w-0 touch-range"
                  aria-label={t("studio.timeline.zoom")}
                />
              </div>
            ) : null}

            <div
              className="mx-1 mt-1 flex items-center rounded-md border border-white/10 bg-gradient-to-r from-zinc-800/90 via-zinc-700/80 to-zinc-900/90 px-2 text-[10px] font-semibold text-white/70"
              style={{ height: MOB_VIDEO_STRIP_H }}
            >
              <span className="me-1.5 inline-flex h-4 w-4 items-center justify-center rounded bg-white/10 text-[8px]">
                ▶
              </span>
              {t("studio.timeline.videoStrip")}
            </div>

            <div
              ref={trackRef}
              data-timeline-track
              className="relative mx-1 mt-1 mb-2 rounded-md bg-[var(--editor-timeline-track)] cursor-crosshair touch-pan-x"
              style={{ height: MOB_WORDS_TRACK_H }}
              onPointerDown={(e) => {
                if (e.button !== 0) return
                if (e.target.closest("[data-word-block]")) return
                scrubFromClientX(e.clientX)
              }}
            >
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute start-0 end-0 top-1/2 h-px -translate-y-1/2 bg-white/25" />
                {sorted.map((w, idx) => {
                  const ws = Number(w.start)
                  const we = Number(w.end)
                  const mid = (ws + we) * 0.5
                  const left = clamp(mid * effectivePps, 0, innerW - 12)
                  const selected = String(w.id) === String(selectedWordId)
                  const playing = String(w.id) === currentWordId
                  return (
                    <button
                      key={`m-dot-${w.id}`}
                      type="button"
                      className={[
                        "pointer-events-auto absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all",
                        selected
                          ? "border-[var(--accent-bright)] bg-[var(--accent)] shadow-[0_0_10px_var(--accent-glow)]"
                          : playing
                            ? "border-[var(--accent)]/70 bg-[var(--accent)]/50"
                            : "border-white/55 bg-[var(--bg-card)]",
                      ].join(" ")}
                      style={{ left }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectWord?.(w.id)
                        onSeek?.(mid)
                        onRequestEditWord?.(w.id)
                      }}
                      aria-label={`${w.word || "word"} ${idx + 1}`}
                    />
                  )
                })}
              </div>

              <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none overflow-hidden rounded-md">
                {dur > 0
                  ? rulerTicks.map((sec) => (
                      <div
                        key={`g-${sec}`}
                        className="absolute top-0 bottom-0 w-px bg-white/[0.08]"
                        style={{ left: sec * effectivePps }}
                      />
                    ))
                  : null}
              </div>

              <div className="absolute inset-0 px-0.5 py-0.5">
                {sorted.map((w) => {
                  const ws = Number(w.start)
                  const we = Number(w.end)
                  const left = ws * effectivePps
                  const width = Math.max(8, (we - ws) * effectivePps)
                  const active = String(w.id) === String(selectedWordId)
                  return (
                    <div
                      key={w.id}
                      data-word-block
                      className={[
                        "absolute top-[58%] bottom-0.5 rounded-md border-2 flex items-stretch overflow-hidden select-none pointer-events-auto touch-none",
                        active
                          ? "border-[var(--accent-bright)] bg-[var(--accent)]/30 z-10 ring-2 ring-amber-400/40 shadow-[0_0_12px_var(--accent-glow)]"
                          : "border-white/20 bg-[var(--bg-card)]/95 z-[5]",
                      ].join(" ")}
                      style={{ left, width }}
                      onPointerDown={(e) => onBlockPointerDown(w, e)}
                    >
                      <button
                        type="button"
                        data-handle="L"
                        className="min-w-[12px] shrink-0 cursor-ew-resize bg-black/50 hover:bg-[var(--accent)]/45 border-0 p-0"
                        aria-label={t("studio.timeline.resizeStart")}
                        onPointerDown={(e) => {
                          e.stopPropagation()
                          startDrag("resizeL", w, e)
                        }}
                      />
                      <div className="flex-1 min-w-0 px-1 flex items-center gap-0.5">
                        <span
                          className="shrink-0 text-[9px] font-bold text-[var(--accent-bright)]"
                          aria-hidden
                        >
                          T
                        </span>
                        <span className="truncate text-[11px] font-medium text-[var(--text-primary)]">
                          {w.word || "·"}
                        </span>
                      </div>
                      <button
                        type="button"
                        data-handle="R"
                        className="min-w-[12px] shrink-0 cursor-ew-resize bg-black/50 hover:bg-[var(--accent)]/45 border-0 p-0"
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
      </div>
    )
  }

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
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute start-0 end-0 top-[38%] h-px bg-white/20" />
            {sorted.map((w, idx) => {
              const ws = Number(w.start)
              const we = Number(w.end)
              const mid = (ws + we) * 0.5
              const left = clamp(mid * effectivePps, 0, innerW - 14)
              const selected = String(w.id) === String(selectedWordId)
              const playing = String(w.id) === currentWordId
              const odd = idx % 2 === 1
              return (
                <div key={`d-dot-${w.id}`} className="absolute top-[38%]" style={{ left }}>
                  <button
                    type="button"
                    className={[
                      "pointer-events-auto absolute start-0 top-0 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all",
                      selected
                        ? "border-[var(--accent-bright)] bg-[var(--accent)] shadow-[0_0_10px_var(--accent-glow)]"
                        : playing
                          ? "border-[var(--accent)]/70 bg-[var(--accent)]/50"
                          : "border-white/60 bg-[var(--bg-card)]",
                    ].join(" ")}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectWord?.(w.id)
                      onSeek?.(mid)
                      onRequestEditWord?.(w.id)
                    }}
                    aria-label={`${w.word || "word"} ${idx + 1}`}
                  />
                  <div
                    className={[
                      "absolute start-0 w-px bg-white/25",
                      odd ? "top-0 h-3" : "-top-3 h-3",
                    ].join(" ")}
                  />
                  <div
                    className={[
                      "absolute start-0 max-w-[84px] -translate-x-1/2 text-center whitespace-nowrap",
                      odd ? "top-4" : "-top-6",
                    ].join(" ")}
                  >
                    <span className="text-[9px] font-medium text-[var(--text-secondary)]">
                      {w.word || "·"}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {dur > 0
            ? Array.from({ length: Math.ceil(dur) + 1 }, (_, i) => (
                <div
                  key={`tick-${i}`}
                  className="absolute top-0 bottom-0 w-px bg-white/10 pointer-events-none"
                  style={{ left: i * effectivePps }}
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
                left: playLeft,
              }}
            />
          ) : null}

          <div className="absolute left-0 right-0 top-[52%] bottom-1 pointer-events-none">
            {sorted.map((w) => {
              const ws = Number(w.start)
              const we = Number(w.end)
              const left = ws * effectivePps
              const width = Math.max(6, (we - ws) * effectivePps)
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
