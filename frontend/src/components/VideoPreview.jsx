import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

const VideoPreview = forwardRef(function VideoPreview(
  { src, captions = [], onTimeUpdate, onLoadedMeta, onPlayingChange, onAspectRatio },
  ref,
) {
  const videoRef = useRef(null)
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    onPlayingChange?.(playing)
  }, [playing, onPlayingChange])

  useImperativeHandle(ref, () => ({
    seek(seconds) {
      const v = videoRef.current
      if (!v) return
      v.currentTime = Math.max(0, Number(seconds) || 0)
      const playPromise = v.play?.()
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          /* autoplay can be blocked — ignore */
        })
      }
    },
    pause() {
      videoRef.current?.pause?.()
    },
    play() {
      videoRef.current?.play?.()
    },
    get currentTime() {
      return videoRef.current?.currentTime || 0
    },
  }))

  useEffect(() => {
    const v = videoRef.current
    if (!v) return undefined

    const handlePlay = () => setPlaying(true)
    const handlePause = () => setPlaying(false)
    const handleTime = () => {
      const t = v.currentTime || 0
      setTime(t)
      onTimeUpdate?.(t)
    }
    const handleMeta = () => {
      const dur = v.duration || 0
      onLoadedMeta?.(dur)
      // Detect true aspect ratio from the video source
      if (v.videoWidth && v.videoHeight) {
        onAspectRatio?.(v.videoWidth / v.videoHeight)
      }
    }

    v.addEventListener("play", handlePlay)
    v.addEventListener("pause", handlePause)
    v.addEventListener("timeupdate", handleTime)
    v.addEventListener("loadedmetadata", handleMeta)

    // In case metadata already loaded (cached src)
    if (v.readyState >= 1 && v.videoWidth) {
      onAspectRatio?.(v.videoWidth / v.videoHeight)
    }

    return () => {
      v.removeEventListener("play", handlePlay)
      v.removeEventListener("pause", handlePause)
      v.removeEventListener("timeupdate", handleTime)
      v.removeEventListener("loadedmetadata", handleMeta)
    }
  }, [onTimeUpdate, onLoadedMeta, onAspectRatio])

  const activeCaption = captions.find(
    (c) => time >= Number(c.start) && time <= Number(c.end),
  )

  function toggle() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play()
    else v.pause()
  }

  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-black shadow-card">
      <video
        ref={videoRef}
        src={src}
        playsInline
        preload="metadata"
        className="w-full h-full object-contain bg-black"
        style={{ display: "block" }}
        onClick={toggle}
      />

      {activeCaption && (
        <div className="pointer-events-none absolute inset-x-2 bottom-3 flex justify-center">
          <span
            dir="auto"
            className="inline-block max-w-[90%] text-center text-white font-extrabold text-[15px] sm:text-[17px] leading-snug px-3 py-1.5 rounded-md"
            style={{
              background: "rgba(0,0,0,0.55)",
              textShadow: "0 1px 2px rgba(0,0,0,0.6)",
            }}
          >
            {activeCaption.text}
          </span>
        </div>
      )}

      {!playing && (
        <button
          type="button"
          aria-label="تشغيل"
          onClick={toggle}
          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
        >
          <span
            aria-hidden="true"
            className="flex items-center justify-center w-14 h-14 rounded-full shadow-button"
            style={{ background: "var(--color-primary-gradient)" }}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  )
})

export default VideoPreview
