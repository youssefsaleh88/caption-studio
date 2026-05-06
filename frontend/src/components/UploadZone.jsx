import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useVideoUpload } from "../hooks/useVideoUpload"
import { useTranscription } from "../hooks/useTranscription"

export default function UploadZone() {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const { upload, progress, uploading, error: uploadError } = useVideoUpload()
  const {
    transcribe,
    loading: transcribing,
    error: transcribeError,
  } = useTranscription()

  const error = uploadError || transcribeError

  async function handleFile(file) {
    if (!file) return
    const videoUrl = await upload(file)
    if (!videoUrl) return
    const words = await transcribe(videoUrl)
    if (!words) return
    navigate("/editor", { state: { videoUrl, words } })
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
    <div className="w-full max-w-2xl mx-auto px-6">
      <div
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          if (!busy) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={[
          "relative cursor-pointer rounded-2xl border-2 border-dashed transition-all",
          "flex flex-col items-center justify-center text-center px-8 py-20",
          "bg-dark-surface/60 backdrop-blur-sm",
          dragOver
            ? "border-accent bg-accent-muted/20 scale-[1.01]"
            : "border-white/10 hover:border-accent/60 hover:bg-dark-surface",
          busy ? "pointer-events-none opacity-90" : "",
        ].join(" ")}
      >
        <div className="w-16 h-16 rounded-full bg-accent-muted/30 flex items-center justify-center mb-6">
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
            className="text-accent"
          >
            <path d="M12 3v12" />
            <path d="m6 9 6-6 6 6" />
            <path d="M5 21h14" />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-white">
          Drop your video here
        </h2>
        <p className="mt-2 text-sm text-white/60">
          or click to browse — MP4, MOV, WEBM, AVI · up to 200MB
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,.avi"
          className="hidden"
          onChange={onPick}
        />

        {uploading && (
          <div className="w-full max-w-md mt-8">
            <div className="flex justify-between text-xs text-white/70 mb-2 font-mono">
              <span>Uploading…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {transcribing && (
          <div className="mt-8 flex items-center gap-3 text-white/80">
            <span className="inline-block w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <span className="text-sm">Analyzing audio with Gemini AI…</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  )
}
