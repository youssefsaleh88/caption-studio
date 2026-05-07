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
import VideoControls from "./VideoControls"

const POSITION_STYLES = {
  "top-left": { top: 16, left: 16, transform: "none" },
  "top-center": { top: 16, left: "50%", transform: "translateX(-50%)" },
  "top-right": { top: 16, right: 16, transform: "none" },
  "middle-left": { top: "50%", left: 16, transform: "translateY(-50%)" },
  center: { top: "50%", left: "50%", transform: "translate(-50%,-50%)" },
  "middle-right": { top: "50%", right: 16, transform: "translateY(-50%)" },
  "bottom-left": { bottom: 104, left: 16, transform: "none" },
  "bottom-center": {
    bottom: 104,
    left: "50%",
    transform: "translateX(-50%)",
  },
  "bottom-right": { bottom: 104, right: 16, transform: "none" },
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
  { videoUrl, words, style, onTimeUpdate, onVideoDimensions },
  ref,
) {
  const { t } = useTranslation()
  const containerRef = useRef(null)
  const videoRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [layoutH, setLayoutH] = useState(400)
  const [fsActive, setFsActive] = useState(false)
  const lastRoundedHeightRef = useRef(-1)

  const measure = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const h = el.getBoundingClientRect().height
    if (h <= 40) return
    const rounded = Math.round(h)
    const prev = lastRoundedHeightRef.current
    if (
      prev !== -1 &&
      Math.abs(rounded - prev) <= 1
    ) {
      return
    }
    lastRoundedHeightRef.current = rounded
    setLayoutH(rounded)
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

  useImperativeHandle(ref, () => ({
    pause: () => videoRef.current?.pause(),
    play: () => videoRef.current?.play(),
    seek: (time) => {
      if (videoRef.current) videoRef.current.currentTime = time
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

  const pct = resolveFontSizePct(style)
  const displayFontPx = Math.max(10, Math.round((pct / 100) * layoutH))
  const outlinePx = Math.max(
    1,
    Math.round((pct / 100) * layoutH * 0.06),
  )
  const padPx = Math.max(4, Math.round((pct / 100) * layoutH * 0.035))

  const positionStyle =
    POSITION_STYLES[style?.position] || POSITION_STYLES["bottom-center"]

  const showBg = style?.bg_enabled !== false

  function overlayBaseStyle() {
    return {
      position: "absolute",
      ...positionStyle,
      fontFamily: style?.fontFamily || "Tajawal, sans-serif",
      fontSize: `${displayFontPx}px`,
      color: style?.color || "#FFFFFF",
      fontWeight: 600,
      padding: showBg ? `${padPx}px ${padPx * 2}px` : "0",
      borderRadius: 8,
      backgroundColor: showBg
        ? hexWithAlpha(style?.bg_color || "#000000", style?.bg_opacity ?? 0.6)
        : "transparent",
      textShadow: `0 0 ${outlinePx}px rgba(0,0,0,0.95), ${outlinePx}px ${outlinePx}px 0 rgba(0,0,0,0.85)`,
      WebkitTextStroke: style?.outline_enabled
        ? `${Math.max(1, outlinePx / 4)}px ${style?.outline_color || "#000000"}`
        : "0",
      pointerEvents: "none",
      maxWidth: "85%",
      textAlign: "center",
      whiteSpace: "pre-wrap",
      lineHeight: 1.35,
      zIndex: 15,
    }
  }

  function renderCaptionContent() {
    if (!activeSeg) return null
    const ids = activeSeg.wordIds || []
    if (!ids.length) {
      return activeSeg.text || ""
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
          className={
            isActive
              ? "text-[var(--accent-bright)] capt-word-active motion-reduce:!animate-none"
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
      ].join(" ")}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        playsInline
        className="w-full h-full object-contain bg-black"
        onLoadedMetadata={(e) => {
          measure()
          const v = e.target
          setDuration(Number.isFinite(v.duration) ? v.duration : 0)
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

      {activeSeg ? (
        <div style={overlayBaseStyle()} dir="auto">
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
