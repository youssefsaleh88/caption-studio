import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import ScreenHeader from "../components/ScreenHeader"
import VideoPreview from "../components/VideoPreview"
import CaptionCard from "../components/CaptionCard"
import { session } from "../utils/session"

export default function ReviewPage() {
  const navigate = useNavigate()
  const [captions, setCaptions] = useState(() => session.get("captions") || [])
  const [previewSrc, setPreviewSrc] = useState(() => session.get("localPreviewUrl") || null)
  const [time, setTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
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

  function handleTimeChange(id, patch) {
    persist(
      captions.map((c) => {
        if (c.id !== id) return c

        const oldStart = Number(c.start)
        const oldEnd = Number(c.end)
        const newStart = patch.start != null ? Number(patch.start) : oldStart
        const newEnd = patch.end != null ? Number(patch.end) : oldEnd

        if (newEnd <= newStart) return c

        const oldDur = oldEnd - oldStart
        const newDur = newEnd - newStart

        // Re-scale per-word timings so karaoke / word animations stay aligned.
        const newWords = Array.isArray(c.words)
          ? c.words.map((w) => {
              if (oldDur <= 0.001) {
                return { ...w, start: newStart, end: newEnd }
              }
              const startRatio = (Number(w.start) - oldStart) / oldDur
              const endRatio = (Number(w.end) - oldStart) / oldDur
              return {
                ...w,
                start: newStart + startRatio * newDur,
                end: newStart + endRatio * newDur,
              }
            })
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
            ? `${captions.length} جملة • اضغط لأي جملة لتعديلها`
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

      {previewSrc && (
        <section
          className="shrink-0 mb-3 cap-animate-fade-up"
          aria-label="معاينة الفيديو"
        >
          <VideoPreview
            ref={videoRef}
            src={previewSrc}
            captions={captions}
            onTimeUpdate={setTime}
            onPlayingChange={setIsPlaying}
          />
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
