import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useVideoUpload } from "../hooks/useVideoUpload"
import { useTranscription } from "../hooks/useTranscription"

export default function UploadZone() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [languageHint, setLanguageHint] = useState("auto")
  const [localError, setLocalError] = useState("")
  const [lastFile, setLastFile] = useState(null)

  const { upload, progress, uploading, error: uploadError } = useVideoUpload()
  const {
    transcribe,
    loading: transcribing,
    error: transcribeError,
  } = useTranscription()

  const error = uploadError || transcribeError || localError

  async function handleFile(file) {
    if (!file) return
    setLastFile(file)
    setLocalError("")
    if (file.size > 200 * 1024 * 1024) {
      setLocalError("حجم الفيديو أكبر من المسموح (200 ميجابايت).")
      return
    }
    const videoUrl = await upload(file)
    if (!videoUrl) return
    const words = await transcribe(videoUrl, languageHint)
    if (!words) return
    navigate("/review", { state: { videoUrl, words } })
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function onPick(e) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const busy = uploading || transcribing

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 space-y-4">
      {/* Language hint hidden by default for core flow */}
      {/* 
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
          {t("upload.langLabel")}
        </label>
        <select
          value={languageHint}
          disabled={busy}
          onChange={(e) => setLanguageHint(e.target.value)}
          className="w-full bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] min-h-[44px]"
        >
          <option value="auto">{t("upload.langAuto")}</option>
          <option value="ar">{t("upload.langAr")}</option>
          <option value="en">{t("upload.langEn")}</option>
        </select>
      </div>
      */}

      <div
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          if (!busy) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={[
          "relative cursor-pointer rounded-[var(--radius-card)] border-2 border-dashed transition-all",
          "flex flex-col items-center justify-center text-center px-8 py-20",
          "bg-[var(--bg-card)]/90 backdrop-blur-sm",
          dragOver
            ? "border-[var(--accent)] bg-[var(--accent-dim)] scale-[1.01]"
            : "border-[var(--border-subtle)] hover:border-[var(--accent)]/60 hover:bg-[var(--bg-surface)]",
          busy ? "pointer-events-none opacity-90" : "",
        ].join(" ")}
      >
        <div className="w-16 h-16 rounded-full bg-[var(--accent-dim)] flex items-center justify-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--accent)]"
          >
            <path d="M12 3v12" />
            <path d="m6 9 6-6 6 6" />
            <path d="M5 21h14" />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          {t("upload.dropTitle")}
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{t("upload.dropHint")}</p>

        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,.avi"
          className="hidden"
          onChange={onPick}
        />

        {uploading && (
          <div className="w-full max-w-md mt-8">
            <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2 font-mono">
              <span>{t("upload.uploading")}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {transcribing && (
          <div className="mt-8 flex items-center gap-3 text-[var(--text-secondary)]">
            <span className="inline-block w-4 h-4 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
            <span className="text-sm">{t("upload.analyzing")}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex justify-between items-center">
          <span>{error}</span>
          {lastFile && (
            <button
              onClick={() => handleFile(lastFile)}
              className="px-3 py-1 bg-red-500/20 rounded hover:bg-red-500/30 text-xs font-semibold cap-focus-visible"
            >
              {t("studio.action.retry")}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
