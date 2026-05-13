import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import ScreenHeader from "../components/ScreenHeader"
import VideoPreview from "../components/VideoPreview"
import CaptionCard from "../components/CaptionCard"
import { session, rescaleSegmentWords } from "../utils/session"

export default function ReviewPage() {
  const navigate = useNavigate()
  const [captions, setCaptions] = useState(() => session.get("captions") || [])
  const [previewSrc, setPreviewSrc] = useState(() => session.get("localPreviewUrl") || null)
  const [time, setTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [aspectRatio, setAspectRatio] = useState(16 / 9) // default, updated from video
  const videoRef = useRef(null)
  const scrollBoxRef = useRef(null)

  useEffect(() => {
    if (!session.get("videoUrl") || !session.get("captions")) {
      navigate("/", { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    if (!previewSrc) {
      // Fallback to the remote R2 URL if the blob URL is gone (refresh).
      const remote = session.get("videoUrl")
      if (remote) setPreviewSrc(remote)
    }
  }, [previewSrc])

  function persist(next) {
    setCaptions(next)
    session.set("captions", next)
  }

  function handleEdit(id, newText) {
    persist(captions.map((c) => (c.id === id ? { ...c, text: newText } : c)))
  }

  const timeBoundsById = useMemo(() => {
    const GAP = 0.02
    const MIN_DUR = 0.2
    const sorted = [...captions].sort((a, b) => Number(a.start) - Number(b.start))
    const m = new Map()
    sorted.forEach((c, i) => {
      const prev = sorted[i - 1]
      const next = sorted[i + 1]
      m.set(c.id, {
        startMin: prev ? Number(prev.end) + GAP : 0,
        startMax: Math.max(Number(c.start), Number(c.end) - MIN_DUR),
        endMin: Math.min(Number(c.end), Number(c.start) + MIN_DUR),
        endMax: next ? Number(next.start) - GAP : Number.POSITIVE_INFINITY,
      })
    })
    return m
  }, [captions])

  function handleTimeChange(id, patch) {
    const sorted = [...captions].sort((a, b) => Number(a.start) - Number(b.start))
    const idx = sorted.findIndex((c) => c.id === id)
    const prev = sorted[idx - 1]
    const next = sorted[idx + 1]
    const GAP = 0.02
    const MIN_DUR = 0.2

    persist(
      captions.map((c) => {
        if (c.id !== id) return c

        const oldStart = Number(c.start)
        const oldEnd = Number(c.end)
        let newStart = patch.start != null ? Number(patch.start) : oldStart
        let newEnd = patch.end != null ? Number(patch.end) : oldEnd

        for (let pass = 0; pass < 3; pass += 1) {
          if (prev) newStart = Math.max(newStart, Number(prev.end) + GAP)
          if (next) newEnd = Math.min(newEnd, Number(next.start) - GAP)
          newStart = Math.max(0, newStart)
          newEnd = Math.max(newEnd, newStart + MIN_DUR)
          newStart = Math.min(newStart, newEnd - MIN_DUR)
        }

        if (newEnd <= newStart) return c

        const newWords = Array.isArray(c.words)
          ? rescaleSegmentWords({ ...c, start: oldStart, end: oldEnd, words: c.words }, newStart, newEnd)
          : c.words

        return { ...c, start: newStart, end: newEnd, words: newWords }
      }),
    )
  }

  function handleDelete(id) {
    persist(captions.filter((c) => c.id !== id))
  }

  function handleSeek(seconds) {
    videoRef.current?.seek?.(seconds)
  }

  const activeId = useMemo(() => {
    const found = captions.find(
      (c) => time >= Number(c.start) && time <= Number(c.end),
    )
    return found?.id
  }, [captions, time])

  function startOver() {
    if (confirm("هتبدأ من الأول وهتفقد التعديلات. تأكيد؟")) {
      session.clear()
      navigate("/", { replace: true })
    }
  }

  return (
    <main
      className="cap-screen"
      style={{
        height: "100dvh",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)",
      }}
    >
      <ScreenHeader
        title="راجع الكابشن"
        subtitle={
          captions.length
            ? `${captions.length} جملة • اضغط الجملة عشان تعدّل النص والتوقيت`
            : "لا توجد جمل بعد"
        }
        onBack={startOver}
        right={
          <button
            type="button"
            onClick={() => navigate("/export")}
            className="cap-btn-secondary cap-focus-ring !min-h-[36px] !text-[13px] !px-3"
            disabled={captions.length === 0}
          >
            التالي
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        }
      />

      {/* Video — perfectly contained in a max-height box */}
      {previewSrc && (
        <section
          className="shrink-0 mb-3 cap-animate-fade-up flex justify-center"
          aria-label="معاينة الفيديو"
        >
          <div
            className="w-full relative"
            style={{
              height: "42vh",
              maxHeight: "380px",
            }}
          >
            <VideoPreview
              ref={videoRef}
              src={previewSrc}
              captions={captions}
              onTimeUpdate={setTime}
              onPlayingChange={setIsPlaying}
              onAspectRatio={setAspectRatio}
            />
          </div>
        </section>
      )}

      <div className="shrink-0 flex items-center justify-between mb-2 px-0.5">
        <span className="text-[11px] font-extrabold text-ink-muted uppercase tracking-[0.08em]">
          الكابشن
        </span>
        {captions.length > 0 && (
          <span className="cap-pill bg-info-bg text-info">
            {captions.length} جملة
          </span>
        )}
      </div>

      <section
        ref={scrollBoxRef}
        className="flex-1 min-h-0 overflow-y-auto rounded-lg space-y-3 py-1 pb-3 px-0.5"
        aria-label="قائمة الكابشن"
        style={{
          WebkitOverflowScrolling: "touch",
          maskImage:
            "linear-gradient(to bottom, transparent 0, black 8px, black calc(100% - 12px), transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0, black 8px, black calc(100% - 12px), transparent 100%)",
        }}
      >
        {captions.length === 0 ? (
          <div className="cap-card p-6 text-center">
            <p className="text-[15px] font-bold text-ink mb-1">مفيش كابشن لسه</p>
            <p className="text-[13px] font-semibold text-ink-soft">
              ارجع وارفع فيديو فيه صوت واضح.
            </p>
          </div>
        ) : (
          captions.map((c) => (
            <CaptionCard
              key={c.id}
              caption={c}
              timeBounds={timeBoundsById.get(c.id)}
              isActive={c.id === activeId}
              autoScroll={isPlaying}
              scrollRoot={scrollBoxRef.current}
              onEdit={handleEdit}
              onTimeChange={handleTimeChange}
              onDelete={handleDelete}
              onSeek={handleSeek}
            />
          ))
        )}
      </section>

      <footer className="shrink-0 pt-3">
        <button
          type="button"
          onClick={() => navigate("/export")}
          disabled={captions.length === 0}
          className="cap-btn-primary cap-focus-ring"
        >
          <span>تصدير</span>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </footer>
    </main>
  )
}
