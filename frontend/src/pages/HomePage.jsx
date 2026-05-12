import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Logo from "../components/Logo"
import UploadZone from "../components/UploadZone"
import UploadProgress from "../components/UploadProgress"
import ErrorBanner from "../components/ErrorBanner"
import { useUpload } from "../hooks/useUpload"
import { session } from "../utils/session"

export default function HomePage() {
  const navigate = useNavigate()
  const { upload, progress, uploading, error, setError } = useUpload()
  const [lastFile, setLastFile] = useState(null)

  async function handlePick(file) {
    setLastFile(file)
    const videoUrl = await upload(file)
    if (!videoUrl) return

    // Persist for later screens; local preview URL is recreated when needed.
    const previewUrl = URL.createObjectURL(file)
    session.setMany({
      videoUrl,
      localPreviewUrl: previewUrl,
      filename: file.name,
      uploadedAt: Date.now(),
    })
    navigate("/process")
  }

  function retry() {
    if (lastFile) handlePick(lastFile)
  }

  return (
    <main className="cap-screen">
      <Logo size="md" />

      <section className="flex-1 flex flex-col items-center justify-center text-center cap-animate-fade-up pt-8 pb-6">
        <div
          aria-hidden="true"
          className="text-[58px] mb-3 cap-animate-float"
          style={{ filter: "drop-shadow(0 8px 16px rgba(99,153,34,0.35))" }}
        >
          ✨
        </div>

        <h1 className="text-[26px] sm:text-[30px] font-extrabold text-ink leading-tight mb-2 max-w-[20ch]">
          حوّل أي فيديو لكابشن في دقايق
        </h1>
        <p className="text-[15px] font-semibold text-ink-soft leading-relaxed max-w-[34ch]">
          ارفع الفيديو والـ AI يفرّغ الكلام بدقة، انت تراجع وتصدّر. كله من هنا 👇
        </p>
      </section>

      <section className="w-full space-y-3.5">
        <UploadZone onPick={handlePick} disabled={uploading} />

        {uploading && (
          <div className="cap-card p-4 cap-animate-fade-up">
            <UploadProgress percent={progress} />
          </div>
        )}

        {error && (
          <ErrorBanner
            message={error}
            onRetry={lastFile ? retry : null}
            onDismiss={() => setError(null)}
          />
        )}
      </section>

      <footer className="mt-6 pb-1 text-center">
        <p className="text-[11px] font-bold text-ink-muted">
          مدعوم بـ Gemini 2.5 Pro • فيديوهاتك خاصة بيك
        </p>
      </footer>
    </main>
  )
}
