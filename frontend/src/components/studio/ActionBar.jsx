import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

const BACKEND = import.meta.env.VITE_BACKEND_URL

export default function ActionBar({
  words,
  videoUrl,
  style,
  onDownloadSrt,
  embedded = false,
  exportAnchorId,
  onExportSuccess,
}) {
  const { t } = useTranslation()
  const [phase, setPhase] = useState("idle") // idle | loading | success | error
  const [error, setError] = useState(null)
  const [shimmer, setShimmer] = useState(false)

  useEffect(() => {
    if (phase !== "success") return
    const id = setTimeout(() => setPhase("idle"), 1600)
    return () => clearTimeout(id)
  }, [phase])

  useEffect(() => {
    if (!error || phase === "loading") return
    const id = setTimeout(() => setError(null), 5000)
    return () => clearTimeout(id)
  }, [error, phase])

  async function handleExport() {
    setError(null)

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

    setPhase("loading")
    setShimmer(true)
    window.setTimeout(() => setShimmer(false), 550)

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
            caption_animation: style.caption_animation || "none",
            karaoke_color: style.karaoke_color || "#8B80FF",
            position_x_pct:
              style.position_x_pct != null
                ? Number(style.position_x_pct)
                : null,
            position_y_pct:
              style.position_y_pct != null
                ? Number(style.position_y_pct)
                : null,
          },
        }),
      })

      if (!res.ok) {
        let detail = "Export failed."
        try {
          const data = await res.json()
          detail = data.detail || detail
        } catch {
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
      setPhase("success")
      onExportSuccess?.()
    } catch (e) {
      setPhase("error")
      setError(e.message || t("export.failed"))
    }
  }

  const busy = phase === "loading"

  const btnSurface =
    phase === "success"
      ? "bg-[var(--success)]/30 ring-2 ring-[var(--success)] text-[var(--success)]"
      : phase === "error"
        ? "bg-[var(--danger)]/15 ring-2 ring-[var(--danger)]/50 text-[var(--text-primary)]"
        : "bg-gradient-to-r from-[var(--accent)] via-[var(--blue)] to-[var(--accent-bright)] text-white shadow-lg shadow-[var(--accent)]/35"

  const wrapClass = embedded
    ? "relative z-10 px-0 pt-4 pb-1 space-y-2 border-t border-[var(--border-subtle)] mt-4"
    : "fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 bg-[var(--bg-base)]/92 backdrop-blur-lg border-t border-[var(--border-subtle)] space-y-2"

  return (
    <div id={exportAnchorId || undefined} className={wrapClass}>
      {error ? (
        <p
          className="mb-1 text-center text-xs text-[var(--danger)]"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => onDownloadSrt?.()}
        disabled={busy}
        className="cap-focus-visible w-full min-h-[48px] rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-sm font-semibold text-[var(--accent-bright)] hover:bg-[var(--bg-surface)] hover:border-[var(--accent)]/35 transition-colors"
      >
        {t("studio.action.downloadSrt")}
      </button>

      <button
        type="button"
        onClick={() => void handleExport()}
        disabled={busy}
        aria-busy={busy}
        className={[
          "cap-focus-visible relative w-full min-h-[48px] rounded-[var(--radius-card)] overflow-hidden font-semibold transition-all",
          btnSurface,
          busy ? "opacity-95 cursor-wait" : "hover:brightness-110 active:scale-[0.99]",
        ].join(" ")}
      >
        {shimmer && phase === "loading" ? (
          <span
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-cap-shimmer opacity-50 motion-reduce:animate-none"
            aria-hidden
          />
        ) : null}
        <span className="relative z-10 flex items-center justify-center gap-2 px-4 py-3">
          {phase === "loading" ? (
            <>
              <span className="inline-block w-5 h-5 rounded-full border-2 border-white/90 border-t-transparent animate-spin" />
              <span>{t("studio.action.exporting")}</span>
            </>
          ) : phase === "success" ? (
            <>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>{t("studio.action.exported")}</span>
            </>
          ) : (
            <>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>{t("studio.action.export")}</span>
            </>
          )}
        </span>
      </button>

      {phase === "error" && error ? (
        <button
          type="button"
          onClick={() => {
            setPhase("idle")
            void handleExport()
          }}
          className="cap-focus-visible w-full py-2 text-xs font-semibold text-[var(--accent-bright)]"
        >
          {t("studio.action.retry")}
        </button>
      ) : null}
    </div>
  )
}
