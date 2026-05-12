import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import ScreenHeader from "../components/ScreenHeader"
import ExportOption from "../components/ExportOption"
import ErrorBanner from "../components/ErrorBanner"
import { useExport } from "../hooks/useExport"
import { session } from "../utils/session"

export default function ExportPage() {
  const navigate = useNavigate()
  const { exportSRT, exportMP4, busy, error, setError } = useExport()
  const [format, setFormat] = useState("mp4")
  const [done, setDone] = useState(false)

  const captions = session.get("captions") || []
  const videoUrl = session.get("videoUrl")

  useEffect(() => {
    if (!videoUrl || !captions.length) {
      navigate("/", { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleExport() {
    setDone(false)
    setError(null)
    const ok =
      format === "srt"
        ? await exportSRT(captions)
        : await exportMP4(videoUrl, captions)
    if (ok) setDone(true)
  }

  function startNew() {
    session.clear()
    navigate("/", { replace: true })
  }

  return (
    <main className="cap-screen">
      <ScreenHeader
        title="جاهز للتصدير"
        subtitle={`${captions.length} جملة جاهزة`}
        onBack={() => navigate("/review")}
      />

      <section className="flex flex-col items-center text-center my-6 cap-animate-fade-up">
        <div
          aria-hidden="true"
          className="w-20 h-20 rounded-full flex items-center justify-center text-[40px] mb-3"
          style={{ background: "var(--color-secondary-gradient)" }}
        >
          🎉
        </div>
        <h2 className="text-[22px] font-extrabold text-ink mb-1">خلصنا!</h2>
        <p className="text-[14px] font-semibold text-ink-soft max-w-[32ch]">
          اختار الصيغة اللي تناسبك واضغط تصدير.
        </p>
      </section>

      <section className="space-y-3" aria-label="خيارات التصدير">
        <ExportOption
          title="فيديو MP4"
          hint="الكابشن محروق جوه الفيديو، جاهز للنشر مباشرة."
          badge="موصى به"
          selected={format === "mp4"}
          onSelect={() => setFormat("mp4")}
          icon={
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 8-6 4 6 4V8Z" />
              <rect x="2" y="6" width="14" height="12" rx="2" ry="2" />
            </svg>
          }
        />
        <ExportOption
          title="ملف SRT"
          hint="ملف ترجمة مستقل للاستخدام في برامج المونتاج."
          selected={format === "srt"}
          onSelect={() => setFormat("srt")}
          icon={
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="15" x2="15" y2="15" />
              <line x1="9" y1="18" x2="13" y2="18" />
            </svg>
          }
        />
      </section>

      {error && (
        <div className="mt-4">
          <ErrorBanner
            message={error}
            onRetry={handleExport}
            onDismiss={() => setError(null)}
          />
        </div>
      )}

      {done && !error && (
        <div
          className="mt-4 flex items-start gap-3 p-3.5 rounded-md bg-ok-bg border border-ok/30 cap-animate-fade-up"
          role="status"
        >
          <span aria-hidden="true" className="text-[20px]">✅</span>
          <div className="flex-1">
            <p className="text-[14px] font-extrabold text-ink mb-0.5">
              التصدير تم بنجاح
            </p>
            <p className="text-[13px] font-semibold text-ink-soft">
              لو الملف ما نزلش، اضغط زر التصدير تاني.
            </p>
          </div>
        </div>
      )}

      <section className="mt-7 space-y-3">
        <button
          type="button"
          onClick={handleExport}
          disabled={busy}
          className="cap-btn-primary cap-focus-ring"
        >
          {busy ? (
            <>
              <span className="inline-block w-5 h-5 rounded-full border-[3px] border-white border-t-transparent animate-[spin-slow_0.8s_linear_infinite]" />
              <span>جاري التجهيز…</span>
            </>
          ) : (
            <>
              <span>تصدير {format === "mp4" ? "MP4" : "SRT"}</span>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </>
          )}
        </button>

        {done && (
          <button
            type="button"
            onClick={startNew}
            className="cap-btn-secondary cap-focus-ring w-full"
          >
            ابدأ فيديو جديد
          </button>
        )}
      </section>

      {format === "mp4" && (
        <p className="mt-5 text-center text-[12px] font-bold text-ink-muted">
          ⏱️ التجهيز ممكن ياخد دقيقة أو اتنين حسب طول الفيديو
        </p>
      )}
    </main>
  )
}
