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
  const videoRef = useRef(null)

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
    <main className="cap-screen pb-28">
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
        <section className="mb-5 cap-animate-fade-up">
          <VideoPreview
            ref={videoRef}
            src={previewSrc}
            captions={captions}
            onTimeUpdate={setTime}
          />
        </section>
      )}

      <section className="space-y-3" aria-label="قائمة الكابشن">
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
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSeek={handleSeek}
            />
          ))
        )}
      </section>

      <footer
        className="fixed inset-x-0 bottom-0 z-30 px-5 py-3.5 bg-bg/95 backdrop-blur border-t border-line"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)" }}
      >
        <div className="max-w-[560px] mx-auto">
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
        </div>
      </footer>
    </main>
  )
}
