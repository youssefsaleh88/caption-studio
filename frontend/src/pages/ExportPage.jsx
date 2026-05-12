import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import ScreenHeader from "../components/ScreenHeader"
import ExportOption from "../components/ExportOption"
import StylePresetCard from "../components/StylePresetCard"
import StyleOptionsPanel from "../components/StyleOptionsPanel"
import ErrorBanner from "../components/ErrorBanner"
import { useExport } from "../hooks/useExport"
import { session } from "../utils/session"
import { STYLE_PRESETS, getPresetById } from "../utils/stylePresets"

const PRESET_STORAGE_KEY = "lastPreset"
const CUSTOM_STYLE_KEY = "lastCustomStyle"

export default function ExportPage() {
  const navigate = useNavigate()
  const { exportSRT, exportMP4, busy, error, setError, progress } = useExport()
  const [format, setFormat] = useState("mp4")
  const [presetId, setPresetId] = useState(
    () => session.get(PRESET_STORAGE_KEY) || "classic",
  )
  const [openPanelId, setOpenPanelId] = useState(null) // which preset's options panel is open
  const [customStyle, setCustomStyle] = useState(
    () => session.get(CUSTOM_STYLE_KEY) || {},
  )
  const [done, setDone] = useState(false)

  const captions = session.get("captions") || []
  const videoUrl = session.get("videoUrl")

  useEffect(() => {
    if (!videoUrl || !captions.length) {
      navigate("/", { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handlePresetChange(id) {
    setPresetId(id)
    session.set(PRESET_STORAGE_KEY, id)

    // Reset custom style when switching presets — start fresh from preset defaults
    const preset = getPresetById(id)
    const defaults = {
      color: preset.style.color || "#FFFFFF",
      bg_enabled: preset.style.bg_enabled ?? true,
      bg_color: preset.style.bg_color || "#000000",
      font_size_pct: preset.style.font_size_pct || 5.5,
      position: preset.style.position || "bottom-center",
    }
    setCustomStyle(defaults)
    session.set(CUSTOM_STYLE_KEY, defaults)

    // Toggle: if the same preset is clicked again → close panel; otherwise open
    setOpenPanelId((prev) => (prev === id ? null : id))
  }

  function handleStyleOptions(patch) {
    const next = { ...customStyle, ...patch }
    setCustomStyle(next)
    session.set(CUSTOM_STYLE_KEY, next)
  }

  async function handleExport() {
    setDone(false)
    setError(null)
    const ok =
      format === "srt"
        ? await exportSRT(captions)
        : await exportMP4(videoUrl, captions, presetId, customStyle)
    if (ok) setDone(true)
  }

  function startNew() {
    session.clear()
    navigate("/", { replace: true })
  }

  // Derive current preset defaults for the panel's initial values
  const currentPreset = getPresetById(presetId)
  const panelInitial = {
    color: customStyle.color ?? currentPreset.style.color ?? "#FFFFFF",
    bg_enabled: customStyle.bg_enabled ?? currentPreset.style.bg_enabled ?? true,
    bg_color: customStyle.bg_color ?? currentPreset.style.bg_color ?? "#000000",
    font_size_pct: customStyle.font_size_pct ?? currentPreset.style.font_size_pct ?? 5.5,
    position: customStyle.position ?? currentPreset.style.position ?? "bottom-center",
  }

  return (
    <main className="cap-screen">
      <ScreenHeader
        title="جاهز للتصدير"
        subtitle={`${captions.length} جملة جاهزة`}
        onBack={() => navigate("/review")}
      />

      <section className="flex flex-col items-center text-center mb-6 cap-animate-fade-up">
        <div
          aria-hidden="true"
          className="w-16 h-16 rounded-full flex items-center justify-center text-[34px] mb-2"
          style={{ background: "var(--color-secondary-gradient)" }}
        >
          🎉
        </div>
        <h2 className="text-[20px] font-extrabold text-ink mb-1">خلصنا!</h2>
        <p className="text-[13px] font-semibold text-ink-soft max-w-[34ch]">
          اختار الستايل والصيغة، وضغطة واحدة هتنزّلك الفيديو.
        </p>
      </section>

      <section className="mb-6" aria-label="خيارات الصيغة">
        <h3 className="text-[11px] font-extrabold text-ink-muted uppercase tracking-[0.08em] mb-2 px-0.5">
          الصيغة
        </h3>
        <div className="space-y-2.5">
          <ExportOption
            title="فيديو MP4"
            hint="الكابشن محروق جوه الفيديو، جاهز للنشر مباشرة."
            badge="موصى به"
            selected={format === "mp4"}
            onSelect={() => setFormat("mp4")}
            icon={
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="9" y1="15" x2="15" y2="15" />
                <line x1="9" y1="18" x2="13" y2="18" />
              </svg>
            }
          />
        </div>
      </section>

      {/* Caption Style — each card toggles its own options panel */}
      {format === "mp4" && (
        <section className="mb-6 cap-animate-fade-up" aria-label="ستايل الكابشن">
          <div className="flex items-center justify-between mb-2 px-0.5">
            <h3 className="text-[11px] font-extrabold text-ink-muted uppercase tracking-[0.08em]">
              ستايل الكابشن
            </h3>
            <span className="text-[11px] font-bold text-ink-soft">
              اضغط للتخصيص ✏️
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {STYLE_PRESETS.map((preset) => (
              <div key={preset.id} className="flex flex-col">
                <StylePresetCard
                  preset={preset}
                  selected={presetId === preset.id}
                  onSelect={handlePresetChange}
                />
                {/* Options panel — expands under its own card */}
                {openPanelId === preset.id && presetId === preset.id && (
                  <StyleOptionsPanel
                    presetId={preset.id}
                    initial={panelInitial}
                    onChange={handleStyleOptions}
                  />
                )}
              </div>
            ))}
          </div>
          {/* Options panel spanning full width when open — alternative layout for mobile */}
        </section>
      )}

      {error && (
        <div className="mb-4">
          <ErrorBanner
            message={error}
            onRetry={handleExport}
            onDismiss={() => setError(null)}
          />
        </div>
      )}

      {done && !error && (
        <div
          className="mb-4 flex items-start gap-3 p-3.5 rounded-md bg-ok-bg border border-ok/30 cap-animate-fade-up"
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

      <section className="space-y-3 pb-2">
        {/* Export button with progress */}
        <button
          type="button"
          onClick={handleExport}
          disabled={busy}
          className="cap-btn-primary cap-focus-ring relative overflow-hidden"
          style={{ position: "relative" }}
        >
          {/* Progress fill behind text */}
          {busy && progress > 0 && (
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-[inherit] transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: "rgba(255,255,255,0.18)",
                pointerEvents: "none",
              }}
            />
          )}

          {busy ? (
            <>
              <span className="inline-block w-5 h-5 rounded-full border-[3px] border-white border-t-transparent animate-[spin-slow_0.8s_linear_infinite]" />
              <span>
                {progress > 0 ? `جاري التصدير… ${progress}%` : "جاري التجهيز…"}
              </span>
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

        {/* Progress bar below the button */}
        {busy && (
          <div className="w-full h-2 rounded-full bg-line overflow-hidden cap-animate-fade-up">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: "var(--color-primary-gradient)",
              }}
            />
          </div>
        )}

        {busy && (
          <p className="text-center text-[12px] font-bold text-ink-muted">
            {progress < 10
              ? "⏳ بنجهز الفيديو…"
              : progress < 50
                ? "🔄 بنحرق الكابشن…"
                : progress < 85
                  ? "🎬 بنعمل الفيلتر…"
                  : "✨ تقريباً خلصنا!"}
          </p>
        )}

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

      {format === "mp4" && !busy && (
        <p className="mt-4 mb-2 text-center text-[11.5px] font-bold text-ink-muted">
          ⏱️ التجهيز ممكن ياخد دقيقة أو اتنين حسب طول الفيديو
        </p>
      )}
    </main>
  )
}
