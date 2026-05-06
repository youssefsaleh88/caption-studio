import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"
import { v4 as uuidv4 } from "uuid"

import VideoPreview from "../components/VideoPreview"
import CaptionEditor from "../components/CaptionEditor"
import StylePanel from "../components/StylePanel"
import ExportBar from "../components/ExportBar"
import BrandHeader from "../components/BrandHeader"
import BrandFooter from "../components/BrandFooter"

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

  useEffect(() => {
    if (!state?.videoUrl || !Array.isArray(state?.words)) {
      navigate("/", { replace: true })
    }
  }, [state, navigate])

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

  const previewBlock = (
    <div
      className={[
        "min-h-0 rounded-2xl overflow-hidden border border-white/8 bg-black shadow-xl",
        videoLayout.isVertical
          ? "max-w-[360px] mx-auto lg:mx-0 w-full"
          : "w-full h-full",
      ].join(" ")}
    >
      <VideoPreview
        ref={previewRef}
        videoUrl={state.videoUrl}
        words={words}
        style={{ ...style, timing_offset: 0 }}
        onTimeUpdate={setCurrentTime}
        onVideoDimensions={handleVideoDimensions}
      />
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

      {/* Desktop: ثابت مسارًا بصريًا — معاينة | محرّر | نمط (لا عكس RTL) */}
      <div
        dir="ltr"
        className="hidden lg:flex flex-1 min-h-0 min-w-0"
      >
        <section
          className={[
            "shrink-0 flex flex-col p-4 gap-3 border-e border-white/8 bg-dark-elevated/30",
            videoLayout.isVertical ? "w-[min(380px,32vw)]" : "flex-[1.05] min-w-0 max-w-[min(520px,40vw)]",
          ].join(" ")}
        >
          <div
            className={[
              "flex-1 min-h-[240px] flex items-center justify-center",
              videoLayout.isVertical ? "" : "max-h-[min(72vh,720px)]",
            ].join(" ")}
          >
            {previewBlock}
          </div>
        </section>

        <section className="flex-[1.65] min-w-0 flex flex-col p-4 min-h-0">
          <div className="flex-1 min-h-0 rounded-2xl border border-white/10 bg-dark-surface/60 p-5 shadow-xl shadow-black/20">
            {editorBlock}
          </div>
        </section>

        <aside className="w-[min(340px,26vw)] shrink-0 border-s border-white/8 bg-dark-elevated/25 p-4 flex flex-col min-h-0">
          {styleExportBlock}
        </aside>
      </div>

      {/* Tablet / mobile */}
      <div className="lg:hidden flex flex-col flex-1 min-h-0 min-w-0">
        <div className="shrink-0 z-10 bg-gradient-to-b from-dark to-dark/95 border-b border-white/10 px-3 pt-2 pb-2">
          <div className="max-h-[min(34vh,280px)] min-h-[160px] mx-auto">
            {previewBlock}
          </div>
        </div>

        <div
          dir="ltr"
          className="grid grid-cols-3 gap-2 px-3 py-2 shrink-0 border-b border-white/10 bg-dark/98 backdrop-blur-md sticky top-0 z-20"
        >
          {[
            { id: "edit", label: t("editor.tabEdit") },
            { id: "style", label: t("editor.tabStyle") },
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

        <div className="flex-1 min-h-0 overflow-hidden p-3 bg-dark">
          {mobileTab === "edit" && (
            <div className="h-full min-h-0 rounded-2xl border border-white/8 bg-dark-surface/50 p-3 overflow-hidden">
              {editorBlock}
            </div>
          )}
          {mobileTab === "style" && (
            <div className="h-full min-h-0 overflow-y-auto">
              <StylePanel style={style} onChange={setStyle} />
            </div>
          )}
          {mobileTab === "export" && (
            <div className="h-full min-h-0 flex flex-col gap-4">
              <ExportBar words={words} videoUrl={state.videoUrl} style={style} />
            </div>
          )}
        </div>
      </div>

      <BrandFooter className="shrink-0 py-2.5 text-[11px]" />
    </div>
  )
}
