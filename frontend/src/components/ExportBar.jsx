import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { downloadSRT } from "../utils/srtExport"

const BACKEND = import.meta.env.VITE_BACKEND_URL

export default function ExportBar({ words, videoUrl, style }) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [retryKind, setRetryKind] = useState(null)

  async function handleExport() {
    setError(null)
    setRetryKind(null)
    if (!videoUrl) {
      setError(t("export.noVideo"))
      return
    }
    if (!Array.isArray(words) || words.length === 0) {
      setError(t("export.noCaptions"))
      return
    }
    if (!BACKEND) {
      setError(t("export.noBackend"))
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
            font_size_pct: Number(style.font_size_pct ?? 5.5),
            fontsize: style.fontsize != null ? Number(style.fontsize) : null,
            color: style.color || "white",
            bg_enabled: style.bg_enabled !== false,
            bg_color: style.bg_color || "black",
            bg_opacity: Number(style.bg_opacity ?? 0.6),
            shadow: Number(style.shadow) || 2,
            position: style.position || "bottom-center",
            fontFamily: style.fontFamily || null,
            font: style.fontFamily || null,
            outline_enabled: Boolean(style.outline_enabled),
            outline_color: style.outline_color || "#000000",
            caption_mode: style.caption_mode || "sentences",
            timing_offset: Number(style.timing_offset ?? 0),
            max_words_per_line: Number(style.max_words_per_line ?? 6),
            max_segment_duration: Number(style.max_segment_duration ?? 3),
            sliding_window: Number(style.sliding_window ?? 3),
            min_display_time: Number(style.min_display_time ?? 0.7),
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
        throw new Error(detail || t("export.failed"))
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
      setRetryKind("export")
      setError(e.message || t("export.failed"))
    } finally {
      setBusy(false)
    }
  }

  function handleSrt() {
    setError(null)
    setRetryKind(null)
    try {
      downloadSRT(words)
    } catch (e) {
      setRetryKind("srt")
      setError(e.message || t("export.failed"))
    }
  }

  function handleRetry() {
    const kind = retryKind
    setError(null)
    setRetryKind(null)
    if (kind === "export") void handleExport()
    else if (kind === "srt") handleSrt()
  }

  const showRetry =
    !!error &&
    !busy &&
    (retryKind === "export" || retryKind === "srt")

  /* إخفاء شريط التنبيه تلقائيًا للأخطاء التحقق من الشروط فقط (بدون إعادة محاولة ذات معنى) */
  useEffect(() => {
    if (!error || showRetry) return
    const id = setTimeout(() => setError(null), 5000)
    return () => clearTimeout(id)
  }, [error, showRetry])

  return (
    <div className="border-t border-white/5 pt-4 mt-4 space-y-3 relative">
      {error && (
        <div
          dir="auto"
          className="absolute -top-[5.75rem] sm:-top-12 left-0 right-0 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200 space-y-2"
        >
          <p className="leading-snug">{error}</p>
          {showRetry ? (
            <button
              type="button"
              onClick={handleRetry}
              className="cap-focus-visible min-h-11 px-3 py-2 rounded-lg bg-red-400/25 border border-red-400/50 text-white text-xs font-semibold hover:bg-red-400/35 w-full"
            >
              {t("export.retry")}
            </button>
          ) : null}
        </div>
      )}

      <button
        type="button"
        onClick={handleSrt}
        disabled={busy}
        className="cap-focus-visible min-h-11 w-full px-4 py-2.5 rounded-lg border border-white/10 bg-dark text-white/85 text-sm font-medium hover:border-white/30 hover:text-white transition disabled:opacity-50"
      >
        {t("export.downloadSrt")}
      </button>

      <button
        type="button"
        onClick={() => void handleExport()}
        disabled={busy}
        aria-busy={busy}
        className={[
          "cap-focus-visible min-h-11 w-full px-4 py-3 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 [&:dir(rtl)_svg]:order-[-1]",
          busy
            ? "bg-accent-muted text-white/80 cursor-not-allowed"
            : "bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/30",
        ].join(" ")}
      >
        {busy ? (
          <>
            <span className="inline-block w-4 h-4 rounded-full border-2 border-white/80 border-t-transparent animate-spin shrink-0" />
            <span aria-live="polite">{t("export.processing")}</span>
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
              className="shrink-0"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t("export.exportVideo")}
          </>
        )}
      </button>
    </div>
  )
}
