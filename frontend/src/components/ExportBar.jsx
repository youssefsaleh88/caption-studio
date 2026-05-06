import { useEffect, useState } from "react"
import { downloadSRT } from "../utils/srtExport"

const BACKEND = import.meta.env.VITE_BACKEND_URL

export default function ExportBar({ words, videoUrl, style }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!error) return
    const id = setTimeout(() => setError(null), 4000)
    return () => clearTimeout(id)
  }, [error])

  function handleSrt() {
    try {
      downloadSRT(words)
    } catch (e) {
      setError(e.message || "Could not generate SRT.")
    }
  }

  async function handleExport() {
    setError(null)
    if (!videoUrl) {
      setError("No video to export.")
      return
    }
    if (!Array.isArray(words) || words.length === 0) {
      setError("No captions to burn.")
      return
    }
    if (!BACKEND) {
      setError("Backend URL is not configured.")
      return
    }

    setBusy(true)
    try {
      const res = await fetch(`${BACKEND}/api/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_url: videoUrl,
          captions: words.map((w) => ({
            id: String(w.id),
            word: w.word,
            start: Number(w.start),
            end: Number(w.end),
          })),
          style: {
            fontsize: Number(style.fontsize) || 28,
            color: style.color || "white",
            bg_color: style.bg_color || "black",
            bg_opacity: Number(style.bg_opacity ?? 0.6),
            shadow: Number(style.shadow) || 2,
            position: style.position || "bottom-center",
            font: style.fontFamily || null,
          },
        }),
      })

      if (!res.ok) {
        let detail = "Export failed."
        try {
          const data = await res.json()
          detail = data.detail || detail
        } catch (_) {
          /* ignore */
        }
        throw new Error(detail)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "captioned_video.mp4"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e.message || "Export failed.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border-t border-white/5 pt-4 mt-4 space-y-3 relative">
      {error && (
        <div className="absolute -top-12 left-0 right-0 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleSrt}
        disabled={busy}
        className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-dark text-white/85 text-sm font-medium hover:border-white/30 hover:text-white transition disabled:opacity-50"
      >
        Download SRT
      </button>

      <button
        type="button"
        onClick={handleExport}
        disabled={busy}
        className={[
          "w-full px-4 py-3 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2",
          busy
            ? "bg-accent-muted text-white/80 cursor-not-allowed"
            : "bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/30",
        ].join(" ")}
      >
        {busy ? (
          <>
            <span className="inline-block w-4 h-4 rounded-full border-2 border-white/80 border-t-transparent animate-spin" />
            Processing video…
          </>
        ) : (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Video
          </>
        )}
      </button>
    </div>
  )
}
