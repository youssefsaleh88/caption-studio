import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"
import { v4 as uuidv4 } from "uuid"

import VideoPreview from "../components/VideoPreview"
import CaptionEditor from "../components/CaptionEditor"
import StylePanel from "../components/StylePanel"
import ExportBar from "../components/ExportBar"
import BrandHeader from "../components/BrandHeader"
import BrandFooter from "../components/BrandFooter"

const LG_MQ = "(min-width: 1024px)"

function subscribeLg(cb) {
  const mq = window.matchMedia(LG_MQ)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

function snapshotLg() {
  return window.matchMedia(LG_MQ).matches
}

function useLgLayout() {
  return useSyncExternalStore(subscribeLg, snapshotLg, () => false)
}

const DEFAULT_STYLE = {
  fontFamily: "Noto Sans Arabic",
  font_size_pct: 5.5,
  color: "#FFFFFF",
  bg_enabled: true,
  bg_color: "#000000",
  bg_opacity: 0.6,
  shadow: 2,
  outline_enabled: false,
  outline_color: "#000000",
  position: "bottom-center",
  caption_mode: "sentences",
  timing_offset: 0,
  max_words_per_line: 6,
  max_segment_duration: 3,
  sliding_window: 3,
  min_display_time: 0.7,
}

export default function Editor() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state } = useLocation()
  const previewRef = useRef(null)
  const isLg = useLgLayout()

  useEffect(() => {
    if (!state?.videoUrl || !Array.isArray(state?.words)) {
      navigate("/", { replace: true })
    }
  }, [state, navigate])

  useEffect(() => {
    if (!styleSheetOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onKey(e) {
      if (e.key === "Escape") setStyleSheetOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [styleSheetOpen])

  const initialWords = useMemo(() => {
    if (!Array.isArray(state?.words)) return []
    return state.words.map((w) => ({
      id: String(w.id ?? uuidv4()),
      word: String(w.word ?? ""),
      start: Number(w.start ?? 0),
      end: Number(w.end ?? 0),
    }))
  }, [state?.words])

  const [words, setWords] = useState(initialWords)
  const [style, setStyle] = useState(DEFAULT_STYLE)
  const [currentTime, setCurrentTime] = useState(0)
  const [mobileTab, setMobileTab] = useState("edit")
  const [styleSheetOpen, setStyleSheetOpen] = useState(false)
  const [videoLayout, setVideoLayout] = useState({
    isVertical: false,
    aspect: 16 / 9,
  })

  const onPatchWord = useCallback((id, patch) => {
    setWords((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    )
  }, [])

  const onPatchSegment = useCallback((wordIds, { start: segStart, end: segEnd }) => {
    if (!wordIds?.length) return
    setWords((prev) => {
      const map = new Map(prev.map((w) => [String(w.id), { ...w }]))
      const ids = wordIds.map(String)
      const firstId = ids[0]
      const lastId = ids[ids.length - 1]

      if (segStart != null && map.has(firstId)) {
        const w = map.get(firstId)
        w.start = Math.max(0, Number(segStart))
        if (firstId === lastId && segEnd != null) {
          w.end = Math.max(w.start + 0.02, Number(segEnd))
        }
      }
      if (segEnd != null && map.has(lastId)) {
        const w = map.get(lastId)
        const minStart = map.has(firstId) ? map.get(firstId).start : w.start
        w.end = Math.max(minStart + 0.02, Number(segEnd))
      }
      return prev.map((w) => map.get(String(w.id)) ?? w)
    })
  }, [])

  function onDelete(id) {
    setWords((prev) => prev.filter((w) => w.id !== id))
  }

  function onAddAfter(id) {
    setWords((prev) => {
      const idx = prev.findIndex((w) => w.id === id)
      if (idx === -1) return prev
      const ref = prev[idx]
      const newWord = {
        id: uuidv4(),
        word: "...",
        start: Number(ref.end),
        end: Number(ref.end) + 0.5,
      }
      const next = [...prev]
      next.splice(idx + 1, 0, newWord)
      return next
    })
  }

  const seekTo = useCallback((t) => {
    previewRef.current?.pause?.()
    previewRef.current?.seek?.(t)
  }, [])

  const handleVideoDimensions = useCallback((meta) => {
    const { width, height, isVertical } = meta
    const aspect =
      width > 0 && height > 0 ? width / height : 16 / 9
    setVideoLayout({ isVertical: Boolean(isVertical), aspect })
  }, [])

  if (!state?.videoUrl || !Array.isArray(state?.words)) return null

  const videoPreviewInner = (
    <VideoPreview
      ref={previewRef}
      videoUrl={state.videoUrl}
      words={words}
      style={{ ...style, timing_offset: 0 }}
      onTimeUpdate={setCurrentTime}
      onVideoDimensions={handleVideoDimensions}
    />
  )

  /* موبايل: ارتفاع محدد + قصّ صريح حتى ما يطلع الفيديو فوق التابات */
  const previewBlockMobile = (
    <div className="h-full w-full min-h-0 min-w-0 rounded-2xl overflow-hidden border border-white/8 bg-black shadow-lg flex items-center justify-center">
      {videoPreviewInner}
    </div>
  )

  /* ديسكتوب: الفيديو يملأ أوسع عمود؛ طولي يكبر مع العمود بدون سقف 360px */
  const previewBlockDesktop = (
    <div
      className={[
        "min-h-0 min-w-0 rounded-2xl overflow-hidden border border-white/8 bg-black shadow-xl flex items-center justify-center",
        videoLayout.isVertical
          ? "h-full w-full max-w-[min(520px,100%)]"
          : "h-full w-full",
      ].join(" ")}
    >
      {videoPreviewInner}
    </div>
  )

  const editorBlock = (
    <CaptionEditor
      words={words}
      style={style}
      currentTime={currentTime}
      timingOffset={0}
      onSeek={seekTo}
      onPatchWord={onPatchWord}
      onPatchSegment={onPatchSegment}
      onDelete={onDelete}
      onAddAfter={onAddAfter}
    />
  )

  const styleExportBlock = (
    <div className="flex flex-col h-full min-h-0 gap-4">
      <div className="flex-1 min-h-0 overflow-hidden">
        <StylePanel style={style} onChange={setStyle} />
      </div>
      <ExportBar words={words} videoUrl={state.videoUrl} style={style} />
    </div>
  )

  return (
    <div className="h-screen w-screen flex flex-col bg-dark text-white overflow-hidden">
      <BrandHeader
        compact
        showBack
        onBack={() => navigate("/")}
        rightSlot={
          <span className="text-xs text-white/40 font-mono tabular-nums">
            {currentTime.toFixed(2)}
            {t("editor.timeSuffix")}
          </span>
        }
      />

      {isLg ? (
        <div dir="ltr" className="flex flex-1 min-h-0 min-w-0">
          <section className="flex-[3] min-w-0 flex flex-col p-3 sm:p-4 gap-2 border-e border-white/8 bg-dark-elevated/30 min-h-0">
            <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center py-1">
              {previewBlockDesktop}
            </div>
          </section>

          <aside className="flex-[1.05] min-w-[260px] max-w-[min(380px,28vw)] shrink-0 border-e border-white/8 bg-dark-elevated/25 p-3 sm:p-4 flex flex-col min-h-0">
            {styleExportBlock}
          </aside>

          <section className="flex-[0.72] min-w-[220px] max-w-[min(400px,26vw)] shrink-0 flex flex-col p-3 sm:p-4 min-h-0">
            <div className="flex-1 min-h-0 rounded-2xl border border-white/10 bg-dark-surface/60 p-4 shadow-lg shadow-black/15 overflow-hidden">
              {editorBlock}
            </div>
          </section>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
          <div className="shrink-0 bg-dark border-b border-white/10 px-3 pt-2 pb-3 overflow-hidden">
            <div className="mx-auto w-full max-w-md min-h-[200px] max-h-[min(42vh,380px)] h-[min(42vh,380px)] overflow-hidden rounded-2xl bg-black flex flex-col min-w-0">
              {previewBlockMobile}
            </div>
          </div>

          <div className="shrink-0 px-3 py-2 border-b border-white/10 bg-dark">
            <button
              type="button"
              onClick={() => setStyleSheetOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl min-h-[52px] text-sm font-semibold bg-dark-elevated border border-white/15 text-white/90 hover:bg-dark-surface hover:border-accent/40 transition-all duration-200 active:scale-[0.99]"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-accent shrink-0"
                aria-hidden
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              {t("editor.styleSheetButton")}
            </button>
          </div>

          <div
            dir="ltr"
            className="grid grid-cols-2 gap-2 px-3 py-2.5 shrink-0 border-b border-white/10 bg-dark"
          >
            {[
              { id: "edit", label: t("editor.tabEdit") },
              { id: "export", label: t("editor.tabExport") },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMobileTab(tab.id)}
                className={[
                  "w-full px-2 py-3 rounded-xl text-sm font-semibold min-h-[48px] transition-all duration-200 flex items-center justify-center text-center leading-tight",
                  mobileTab === tab.id
                    ? "bg-accent text-white shadow-lg shadow-accent/30 scale-[1.02]"
                    : "bg-dark-surface text-white/75 border border-white/10 hover:border-white/25",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 flex flex-col overflow-hidden p-3 bg-dark">
            {mobileTab === "edit" && (
              <div className="flex-1 min-h-0 rounded-2xl border border-white/8 bg-dark-surface/50 p-3 flex flex-col overflow-hidden">
                {editorBlock}
              </div>
            )}
            {mobileTab === "export" && (
              <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto pb-4">
                <ExportBar words={words} videoUrl={state.videoUrl} style={style} />
              </div>
            )}
          </div>

          {styleSheetOpen
            ? createPortal(
                <div
                  className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center sm:p-6 pointer-events-auto"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="style-sheet-title"
                >
                  <button
                    type="button"
                    className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
                    aria-label={t("editor.styleSheetClose")}
                    onClick={() => setStyleSheetOpen(false)}
                  />
                  <div
                    dir="ltr"
                    className="relative z-10 w-full max-h-[min(88vh,900px)] sm:max-w-lg sm:mx-auto rounded-t-3xl sm:rounded-3xl bg-dark-elevated border border-white/15 shadow-2xl shadow-black/50 flex flex-col min-h-0 overflow-hidden"
                  >
                    <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-dark-surface/80">
                      <h2
                        id="style-sheet-title"
                        className="text-base font-semibold text-white"
                      >
                        {t("editor.styleSheetTitle")}
                      </h2>
                      <button
                        type="button"
                        onClick={() => setStyleSheetOpen(false)}
                        className="shrink-0 w-11 h-11 rounded-xl border border-white/15 bg-white/5 text-white/90 hover:bg-white/10 flex items-center justify-center text-lg leading-none"
                        aria-label={t("editor.styleSheetClose")}
                      >
                        ×
                      </button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 pb-8 touch-pan-y">
                      <StylePanel style={style} onChange={setStyle} />
                    </div>
                  </div>
                </div>,
                document.body,
              )
            : null}
        </div>
      )}

      <BrandFooter className="shrink-0 py-2.5 text-[11px]" />
    </div>
  )
}
