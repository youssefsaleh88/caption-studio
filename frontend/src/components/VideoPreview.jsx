import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react"

const POSITION_STYLES = {
  "top-left":      { top: 24, left: 24, transform: "none" },
  "top-center":    { top: 24, left: "50%", transform: "translateX(-50%)" },
  "top-right":     { top: 24, right: 24, transform: "none" },
  "middle-left":   { top: "50%", left: 24, transform: "translateY(-50%)" },
  "center":        { top: "50%", left: "50%", transform: "translate(-50%,-50%)" },
  "middle-right":  { top: "50%", right: 24, transform: "translateY(-50%)" },
  "bottom-left":   { bottom: 32, left: 24, transform: "none" },
  "bottom-center": { bottom: 32, left: "50%", transform: "translateX(-50%)" },
  "bottom-right":  { bottom: 32, right: 24, transform: "none" },
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

const VideoPreview = forwardRef(function VideoPreview(
  { videoUrl, words, style, onTimeUpdate },
  ref,
) {
  const videoRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)

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

  const activeWords = useMemo(() => {
    if (!Array.isArray(words)) return []
    return words.filter(
      (w) => currentTime >= w.start && currentTime <= w.end,
    )
  }, [words, currentTime])

  const positionStyle =
    POSITION_STYLES[style?.position] || POSITION_STYLES["bottom-center"]

  const showBg = style?.bg_enabled !== false
  const overlayStyle = {
    position: "absolute",
    ...positionStyle,
    fontFamily: style?.fontFamily || "DM Sans, sans-serif",
    fontSize: `${style?.fontsize ?? 28}px`,
    color: style?.color || "#FFFFFF",
    fontWeight: 600,
    padding: showBg ? "8px 16px" : "0",
    borderRadius: 8,
    backgroundColor: showBg
      ? hexWithAlpha(style?.bg_color || "#000000", style?.bg_opacity ?? 0.6)
      : "transparent",
    textShadow: `0 0 ${(style?.shadow ?? 2) * 2}px rgba(0,0,0,0.9), ${
      style?.shadow ?? 2
    }px ${style?.shadow ?? 2}px 0 rgba(0,0,0,0.9)`,
    WebkitTextStroke: style?.outline_enabled
      ? `1px ${style?.outline_color || "#000000"}`
      : "0",
    pointerEvents: "none",
    maxWidth: "85%",
    textAlign: "center",
    whiteSpace: "pre-wrap",
    lineHeight: 1.25,
  }

  function handleTimeUpdate(e) {
    const t = e.target.currentTime
    setCurrentTime(t)
    if (onTimeUpdate) onTimeUpdate(t)
  }

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden flex items-center justify-center">
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        className="w-full h-full max-h-full object-contain bg-black"
        onTimeUpdate={handleTimeUpdate}
      />
      {activeWords.length > 0 && (
        <div style={overlayStyle}>
          {activeWords.map((w) => w.word).join(" ")}
        </div>
      )}
    </div>
  )
})

export default VideoPreview
