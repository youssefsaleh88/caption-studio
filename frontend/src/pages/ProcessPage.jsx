import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import ProcessingSteps from "../components/ProcessingSteps"
import ErrorBanner from "../components/ErrorBanner"
import { useTranscribe } from "../hooks/useTranscribe"
import { session, groupWordsToSentences } from "../utils/session"

// Synthetic progress (the backend doesn't stream progress)
// so we move the bar smoothly while waiting for the response.
function useFakeProgress(active) {
  const [pct, setPct] = useState(0)
  const ref = useRef(0)

  useEffect(() => {
    if (!active) return undefined
    ref.current = 30
    setPct(30)
    const id = setInterval(() => {
      ref.current = Math.min(92, ref.current + Math.random() * 6)
      setPct(Math.round(ref.current))
    }, 850)
    return () => clearInterval(id)
  }, [active])

  function complete() {
    setPct(100)
  }

  return { pct, complete }
}

export default function ProcessPage() {
  const navigate = useNavigate()
  const { transcribe, error, setError } = useTranscribe()
  const [stage, setStage] = useState("uploaded") // uploaded → audio → ai → done
  const { pct, complete } = useFakeProgress(stage === "audio" || stage === "ai")
  const startedRef = useRef(false)

  useEffect(() => {
    const videoUrl = session.get("videoUrl")
    if (!videoUrl) {
      navigate("/", { replace: true })
      return
    }
    if (startedRef.current) return
    startedRef.current = true

    let cancelled = false

    async function run() {
      setStage("audio")
      // Brief tick so the user sees the audio extraction step before the long AI step.
      await new Promise((r) => setTimeout(r, 700))
      if (cancelled) return

      setStage("ai")
      const words = await transcribe(videoUrl)
      if (cancelled) return

      if (!words) return // error is set by the hook
      const sentences = groupWordsToSentences(words)
      session.setMany({ words, captions: sentences })

      complete()
      setStage("done")
      setTimeout(() => navigate("/review", { replace: true }), 350)
    }

    run()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function retry() {
    setError(null)
    startedRef.current = false
    setStage("uploaded")
    // re-trigger run on next tick
    setTimeout(() => {
      startedRef.current = true
      ;(async () => {
        const videoUrl = session.get("videoUrl")
        setStage("ai")
        const words = await transcribe(videoUrl)
        if (!words) return
        const sentences = groupWordsToSentences(words)
        session.setMany({ words, captions: sentences })
        complete()
        setStage("done")
        setTimeout(() => navigate("/review", { replace: true }), 350)
      })()
    }, 0)
  }

  function cancelAndGoHome() {
    session.clear()
    navigate("/", { replace: true })
  }

  const steps = [
    {
      key: "upload",
      label: "رُفع الفيديو بنجاح",
      state: "done",
    },
    {
      key: "audio",
      label: "استخراج الصوت",
      state: stage === "uploaded" ? "pending" : stage === "audio" ? "active" : "done",
    },
    {
      key: "ai",
      label: "تفريغ الكلام بـ AI",
      state:
        stage === "uploaded" || stage === "audio"
          ? "pending"
          : stage === "ai"
          ? "active"
          : "done",
    },
    {
      key: "captions",
      label: "تجهيز الكابشن",
      state: stage === "done" ? "done" : "pending",
    },
  ]

  return (
    <main className="cap-screen">
      <section className="flex-1 flex flex-col items-center justify-center text-center cap-animate-fade-up">
        <div
          aria-hidden="true"
          className="relative flex items-center justify-center mb-6"
        >
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-[44px]"
            style={{ background: "var(--color-primary-gradient)" }}
          >
            <span className="cap-animate-float">🪄</span>
          </div>
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full"
            style={{
              background: "var(--color-primary-gradient)",
              opacity: 0.35,
              animation: "pulse-ring 1.9s ease-out infinite",
            }}
          />
        </div>

        <h1 className="text-[24px] font-extrabold text-ink mb-2">
          بنعمل السحر ✦
        </h1>
        <p className="text-[14px] font-semibold text-ink-soft max-w-[34ch]">
          ممكن ياخد دقيقة أو اتنين حسب طول الفيديو، استنى لحظة.
        </p>

        {!error && (
          <div className="w-full mt-7">
            <div className="flex items-center justify-between mb-2 text-[12px] font-bold">
              <span className="text-ink-soft">جاري المعالجة</span>
              <span className="text-info tabular-nums">{pct}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-line overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{
                  width: `${pct}%`,
                  background: "var(--color-secondary-gradient)",
                }}
              />
            </div>
          </div>
        )}
      </section>

      <section className="cap-card p-5 mt-3">
        <ProcessingSteps steps={steps} />
      </section>

      {error && (
        <section className="mt-4">
          <ErrorBanner
            message={error}
            onRetry={retry}
            onDismiss={cancelAndGoHome}
          />
        </section>
      )}

      <footer className="mt-6">
        <button
          type="button"
          onClick={cancelAndGoHome}
          className="cap-btn-ghost cap-focus-ring mx-auto"
        >
          إلغاء والعودة
        </button>
      </footer>
    </main>
  )
}
