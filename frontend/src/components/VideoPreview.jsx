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
} from "../utils/captions"

const POSITION_STYLES = {
  "top-left":      { top: 24, left: 24, transform: "none" },
  "top-center":    { top: 24, left: "50%", transform: "translateX(-50%)" },
  "top-right":     { top: 24, right: 24, transform: "none" },
  "middle-left":   { top: "50%", left: 24, transform: "translateY(-50%)" },
  "center":        { top: "50%", left: "50%", transform: "translate(-50%,-50%)" },
  "middle-right":  { top: "50%", right: 24, transform: "translateY(-50%)" },
  "bottom-left":   { bottom: 72, left: 24, transform: "none" },
  "bottom-center": { bottom: 72, left: "50%", transform: "translateX(-50%)" },
  "bottom-right":  { bottom: 72, right: 24, transform: "none" },
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

const VideoPreview = forwardRef(function VideoPreview(
  { videoUrl, words, style, onTimeUpdate, onVideoDimensions },
  ref,
) {
  const { t } = useTranslation()
  const containerRef = useRef(null)
  const videoRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [layoutH, setLayoutH] = useState(400)
  const [fsActive, setFsActive] = useState(false)

  const measure = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const h = el.getBoundingClientRect().height
    if (h > 40) setLayoutH(h)
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
    seek: (t) => {
      if (videoRef.current) videoRef.current.currentTime = t
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

  const overlayLabel = useMemo(() => {
    const t = currentTime
    const list =
      style?.caption_mode === "sliding" ? chunkSegments : segments
    if (!list.length) return ""
    const seg = list.find((s) => t >= s.start && t <= s.end)
    return seg?.text ?? ""
  }, [style?.caption_mode, chunkSegments, segments, currentTime])

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
  const overlayStyle = {
    position: "absolute",
    ...positionStyle,
    fontFamily: style?.fontFamily || "Noto Sans Arabic, sans-serif",
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
    zIndex: 10,
  }

  function handleTimeUpdate(e) {
    const t = e.target.currentTime
    setCurrentTime(t)
    if (onTimeUpdate) onTimeUpdate(t)
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

  return (
    <div
      ref={containerRef}
      className={[
        "relative w-full h-full min-h-0 min-w-0 bg-black rounded-xl overflow-hidden flex items-center justify-center",
        fsActive ? "rounded-none" : "",
      ].join(" ")}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        controlsList="nofullscreen"
        disablePictureInPicture
        className="w-full h-full max-h-full object-contain bg-black"
        onLoadedMetadata={(e) => {
          measure()
          const v = e.target
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
      />
      {overlayLabel ? (
        <div style={overlayStyle} dir="auto">
          {overlayLabel}
        </div>
      ) : null}

      <button
        type="button"
        onClick={toggleFullscreen}
        className="absolute top-3 end-4 z-30 rounded-xl border border-white/15 bg-black/65 px-3 py-2 text-[11px] font-medium text-white/95 backdrop-blur-md hover:bg-black/80 hover:border-white/25 shadow-lg pointer-events-auto sm:top-4 sm:end-5"
        aria-label={
          fsActive ? t("video.exitFullscreen") : t("video.fullscreen")
        }
      >
        {fsActive ? (
          t("video.exitFullscreen")
        ) : (
          <span className="inline-flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            {t("video.fullscreen")}
          </span>
        )}
      </button>
    </div>
  )
})

export default VideoPreview
