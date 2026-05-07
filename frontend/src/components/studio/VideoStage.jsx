import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import { useTranslation } from "react-i18next"
import {
  applyTimingOffsetToWords,
  groupIntoSegments,
  chunkByWindow,
  applyMinDisplayTime,
} from "../../utils/captions"
import { getAnimationCssClass } from "../../utils/captionAnimations"
import VideoControls from "./VideoControls"

function clampPct(v, lo = 4, hi = 96) {
  const n = Number(v)
  if (!Number.isFinite(n)) return (lo + hi) / 2
  return Math.min(hi, Math.max(lo, n))
}

function hexWithAlpha(hex, alpha) {
  if (!hex) return `rgba(0,0,0,${alpha})`
  const value = hex.startsWith("#") ? hex.slice(1) : hex
  if (value.length !== 3 && value.length !== 6) {
    return `rgba(0,0,0,${alpha})`
  }
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function resolveFontSizePct(style) {
  if (style?.font_size_pct != null && style.font_size_pct !== "") {
    return Number(style.font_size_pct)
  }
  if (style?.fontsize != null) {
    return Math.min(12, Math.max(2, (Number(style.fontsize) / 720) * 100))
  }
  return 5.5
}

const VideoStage = forwardRef(function VideoStage(
  {
    videoUrl,
    words,
    style,
    onTimeUpdate,
    onVideoDimensions,
    onStyleChange,
    onDurationChange,
    stageClassName,
  },
  ref,
) {
  const { t } = useTranslation()
  const containerRef = useRef(null)
  const videoRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [layoutH, setLayoutH] = useState(400)
  const [videoRenderH, setVideoRenderH] = useState(400)
  const [fsActive, setFsActive] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [showDragHint, setShowDragHint] = useState(true)
  const lastRoundedHeightRef = useRef(-1)

  const measure = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const h = el.getBoundingClientRect().height
    if (h <= 40) return
    const rounded = Math.round(h)
    const prev = lastRoundedHeightRef.current
    if (prev !== -1 && Math.abs(rounded - prev) <= 1) {
      return
    }
    lastRoundedHeightRef.current = rounded
    setLayoutH(rounded)

    const v = videoRef.current
    if (v) {
      const vh = Math.round(v.getBoundingClientRect().height)
      if (vh > 40) setVideoRenderH(vh)
    }
  }, [])

  useEffect(() => {
    measure()
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => measure())
        : null
    if (containerRef.current && ro) ro.observe(containerRef.current)
    window.addEventListener("resize", measure)
    return () => {
      ro?.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [measure])

  useEffect(() => {
    function onFs() {
      const active = Boolean(document.fullscreenElement)
      setFsActive(active)
      requestAnimationFrame(measure)
    }
    document.addEventListener("fullscreenchange", onFs)
    return () => document.removeEventListener("fullscreenchange", onFs)
  }, [measure])

  useEffect(() => {
    const id = window.setTimeout(() => setShowDragHint(false), 4000)
    return () => window.clearTimeout(id)
  }, [])

  useImperativeHandle(ref, () => ({
    pause: () => videoRef.current?.pause(),
    play: () => void videoRef.current?.play(),
    togglePlay: () => {
      const v = videoRef.current
      if (!v) return
      if (v.paused) void v.play()
      else v.pause()
    },
    isPaused: () => Boolean(videoRef.current?.paused),
    seek: (time) => {
      if (videoRef.current) videoRef.current.currentTime = time
    },
    getDuration: () => {
      const d = videoRef.current?.duration
      return Number.isFinite(d) ? d : 0
    },
    get element() {
      return videoRef.current
    },
  }))

  const offsetWords = useMemo(
    () => applyTimingOffsetToWords(words || [], style?.timing_offset ?? 0),
    [words, style?.timing_offset],
  )

  const minHold = style?.min_display_time ?? 0.7

  const segments = useMemo(() => {
    const raw = groupIntoSegments(offsetWords, {
      maxWords: style?.max_words_per_line ?? 6,
      maxDuration: style?.max_segment_duration ?? 3,
    })
    return applyMinDisplayTime(raw, minHold)
  }, [
    offsetWords,
    style?.max_words_per_line,
    style?.max_segment_duration,
    minHold,
  ])

  const chunkSegments = useMemo(() => {
    const raw = chunkByWindow(offsetWords, style?.sliding_window ?? 3)
    return applyMinDisplayTime(raw, minHold)
  }, [offsetWords, style?.sliding_window, minHold])

  const wordMap = useMemo(() => {
    const m = new Map()
    for (const w of offsetWords || []) m.set(String(w.id), w)
    return m
  }, [offsetWords])

  const activeList =
    style?.caption_mode === "sliding" ? chunkSegments : segments

  const activeSeg = useMemo(() => {
    const t0 = currentTime
    if (!activeList.length) return null
    return activeList.find((s) => t0 >= s.start && t0 <= s.end) ?? null
  }, [activeList, currentTime])

  const animMode = style?.caption_animation || "none"

  const enterAnimClass = useMemo(() => {
    if (
      !animMode ||
      animMode === "none" ||
      animMode === "karaoke" ||
      animMode === "word" ||
      animMode === "typewriter"
    ) {
      return ""
    }
    const c = getAnimationCssClass(animMode)
    return c ? `${c} motion-reduce:!animate-none` : ""
  }, [animMode])

  const overlayReactKey = activeSeg
    ? `${activeSeg.id}-${animMode}`
    : "no-seg"

  const pct = resolveFontSizePct(style)
  const sizeBaseH = videoRenderH > 40 ? videoRenderH : layoutH
  const displayFontPx = Math.max(10, Math.round((pct / 100) * sizeBaseH))
  const outlinePx = Math.max(
    1,
    Math.round((pct / 100) * sizeBaseH * 0.06),
  )
  const padPx = Math.max(4, Math.round((pct / 100) * sizeBaseH * 0.035))
  const userShadow = Math.max(0, Math.min(8, Number(style?.shadow) || 0))

  const posX = clampPct(style?.position_x_pct ?? 50)
  const posY = clampPct(style?.position_y_pct ?? 88)

  const showBg = style?.bg_enabled !== false

  function overlayBaseStyle() {
    return {
      position: "absolute",
      left: `${posX}%`,
      top: `${posY}%`,
      transform: "translate(-50%, -50%)",
      fontFamily: style?.fontFamily || "Tajawal, sans-serif",
      fontSize: `${displayFontPx}px`,
      color: style?.color || "#FFFFFF",
      fontWeight: 600,
      padding: showBg ? `${padPx}px ${padPx * 2}px` : "0",
      borderRadius: 8,
      backgroundColor: showBg
        ? hexWithAlpha(style?.bg_color || "#000000", style?.bg_opacity ?? 0.6)
        : "transparent",
      textShadow: [
        `0 0 ${outlinePx + userShadow}px rgba(0,0,0,0.92)`,
        `${outlinePx}px ${outlinePx}px 0 rgba(0,0,0,0.82)`,
        userShadow > 0
          ? `0 ${Math.min(6, userShadow)}px ${userShadow * 2}px rgba(0,0,0,0.55)`
          : "",
      ]
        .filter(Boolean)
        .join(", "),
      WebkitTextStroke: style?.outline_enabled
        ? `${Math.max(1, outlinePx / 4)}px ${style?.outline_color || "#000000"}`
        : "0",
      pointerEvents: "auto",
      maxWidth: "85%",
      textAlign: "center",
      whiteSpace: "pre-wrap",
      lineHeight: 1.35,
      zIndex: 15,
      cursor: dragging ? "grabbing" : "grab",
      touchAction: "none",
    }
  }

  const updatePositionFromClient = useCallback(
    (clientX, clientY) => {
      const el = containerRef.current
      if (!el || !onStyleChange) return
      const r = el.getBoundingClientRect()
      const xPct = ((clientX - r.left) / r.width) * 100
      const yPct = ((clientY - r.top) / r.height) * 100
      onStyleChange({
        position_x_pct: clampPct(xPct),
        position_y_pct: clampPct(yPct),
      })
    },
    [onStyleChange],
  )

  function onOverlayPointerDown(e) {
    if (e.button !== 0 && e.pointerType !== "touch") return
    setShowDragHint(false)
    setDragging(true)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    updatePositionFromClient(e.clientX, e.clientY)
  }

  function onOverlayPointerMove(e) {
    if (!dragging) return
    updatePositionFromClient(e.clientX, e.clientY)
  }

  function onOverlayPointerUp(e) {
    setDragging(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  function renderCaptionContent() {
    if (!activeSeg) return null
    const ids = activeSeg.wordIds || []
    const isKaraoke = animMode === "karaoke"
    const karaokeCol = style?.karaoke_color || "#8B80FF"

    if (!ids.length) {
      return activeSeg.text || ""
    }

    if (animMode === "word") {
      return ids.map((wid) => {
        const w = wordMap.get(String(wid))
        if (!w) return null
        const visible = currentTime >= Number(w.start) - 0.05
        return (
          <span
            key={wid}
            style={{
              opacity: visible ? 1 : 0,
              transition: "opacity 0.14s linear",
            }}
          >
            {w.word}{" "}
          </span>
        )
      })
    }

    if (animMode === "typewriter") {
      return ids.map((wid) => {
        const w = wordMap.get(String(wid))
        if (!w) return null
        const raw = String(w.word ?? "")
        const st = Number(w.start)
        const en = Number(w.end)
        const dur = Math.max(0.06, en - st)
        const spread = dur * 0.7
        const prog = Math.min(
          1,
          Math.max(0, (currentTime - st) / Math.max(0.001, spread)),
        )
        const nVisible = Math.floor(prog * raw.length + 0.001)
        const shown = raw.slice(0, nVisible)
        const rest = raw.slice(nVisible)
        return (
          <span key={wid} className="inline">
            {shown}
            {rest ? (
              <span className="opacity-0 select-none pointer-events-none" aria-hidden>
                {rest}
              </span>
            ) : null}{" "}
          </span>
        )
      })
    }

    return ids.map((wid) => {
      const w = wordMap.get(String(wid))
      if (!w) return null
      const isActive =
        currentTime >= Number(w.start) && currentTime <= Number(w.end)
      return (
        <span
          key={wid}
          aria-current={isActive ? "true" : undefined}
          style={
            isActive && isKaraoke ? { color: karaokeCol } : undefined
          }
          className={
            isActive
              ? isKaraoke
                ? "font-semibold drop-shadow-[0_0_12px_rgb(0_0_0_/_.85)]"
                : "text-[var(--accent-bright)] capt-word-active motion-reduce:!animate-none"
              : ""
          }
        >
          {w.word}{" "}
        </span>
      )
    })
  }

  function handleTimeUpdate(e) {
    const ti = e.target.currentTime
    setCurrentTime(ti)
    onTimeUpdate?.(ti)
  }

  function toggleFullscreen() {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {})
    } else {
      document.exitFullscreen?.()
    }
  }

  function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      void v.play()
      setPlaying(true)
    } else {
      v.pause()
      setPlaying(false)
    }
  }

  function seekToTime(t) {
    if (videoRef.current) videoRef.current.currentTime = Math.max(0, t)
  }

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    function onPlay() {
      setPlaying(true)
    }
    function onPause() {
      setPlaying(false)
    }
    v.addEventListener("play", onPlay)
    v.addEventListener("pause", onPause)
    return () => {
      v.removeEventListener("play", onPlay)
      v.removeEventListener("pause", onPause)
    }
  }, [videoUrl])

  return (
    <div
      ref={containerRef}
      className={[
        "relative w-full mx-auto bg-black rounded-[var(--radius-card)] overflow-hidden flex flex-col items-center justify-center max-h-[min(340px,55vh)] aspect-[9/16]",
        fsActive ? "rounded-none max-h-none aspect-auto h-full" : "",
        stageClassName || "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        playsInline
        className="w-full h-full object-contain bg-black"
        onLoadedData={() => {
          requestAnimationFrame(() => measure())
        }}
        onLoadedMetadata={(e) => {
          measure()
          requestAnimationFrame(() => measure())
          const v = e.target
          const d = Number.isFinite(v.duration) ? v.duration : 0
          setDuration(d)
          onDurationChange?.(d)
          const vw = v.videoWidth
          const vh = v.videoHeight
          if (vw > 0 && vh > 0 && onVideoDimensions) {
            onVideoDimensions({
              width: vw,
              height: vh,
              isVertical: vw / vh < 1,
            })
          }
        }}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {showDragHint ? (
        <p
          className="absolute top-2 left-1/2 -translate-x-1/2 z-20 max-w-[90%] rounded-[var(--radius-sm)] border border-white/15 bg-black/70 px-2.5 py-1.5 text-[10px] text-white/90 text-center pointer-events-none backdrop-blur-sm"
          role="status"
        >
          {t("studio.captions.dragHint")}
        </p>
      ) : null}

      {activeSeg ? (
        <div
          key={overlayReactKey}
          style={overlayBaseStyle()}
          dir="auto"
          className={[
            enterAnimClass,
            dragging
              ? "outline outline-2 outline-dashed outline-[var(--accent)]/80 outline-offset-2 rounded-[10px]"
              : "",
          ].join(" ")}
          onPointerDown={onOverlayPointerDown}
          onPointerMove={onOverlayPointerMove}
          onPointerUp={onOverlayPointerUp}
          onPointerCancel={onOverlayPointerUp}
        >
          {renderCaptionContent()}
        </div>
      ) : null}

      <button
        type="button"
        onClick={toggleFullscreen}
        className="absolute top-3 end-3 z-30 rounded-[var(--radius-sm)] border border-white/15 bg-black/65 px-2.5 py-1.5 text-[11px] font-medium text-white/95 backdrop-blur-md hover:bg-black/80 pointer-events-auto"
        aria-label={fsActive ? t("video.exitFullscreen") : t("video.fullscreen")}
      >
        {fsActive ? t("video.exitFullscreen") : t("video.fullscreen")}
      </button>

      <VideoControls
        duration={duration}
        currentTime={currentTime}
        playing={playing}
        onTogglePlay={togglePlay}
        onSeekToTime={seekToTime}
      />
    </div>
  )
})

export default VideoStage
