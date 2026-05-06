import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { v4 as uuidv4 } from "uuid"

import VideoPreview from "../components/VideoPreview"
import CaptionEditor from "../components/CaptionEditor"
import StylePanel from "../components/StylePanel"
import ExportBar from "../components/ExportBar"

const DEFAULT_STYLE = {
  fontFamily: "DM Sans",
  fontsize: 28,
  color: "#FFFFFF",
  bg_enabled: true,
  bg_color: "#000000",
  bg_opacity: 0.6,
  shadow: 2,
  outline_enabled: false,
  outline_color: "#000000",
  position: "bottom-center",
}

export default function Editor() {
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
  const [selectedWordId, setSelectedWordId] = useState(null)

  function onWordClick(id) {
    setSelectedWordId(id)
    if (id !== null && previewRef.current?.pause) {
      previewRef.current.pause()
      const w = words.find((x) => x.id === id)
      if (w && previewRef.current.seek) previewRef.current.seek(w.start)
    }
  }

  function onEdit(id, newWord) {
    setWords((prev) =>
      prev.map((w) => (w.id === id ? { ...w, word: newWord } : w)),
    )
  }

  function onDelete(id) {
    setWords((prev) => prev.filter((w) => w.id !== id))
    setSelectedWordId(null)
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

  if (!state?.videoUrl || !Array.isArray(state?.words)) return null

  return (
    <div className="h-screen w-screen flex flex-col bg-dark text-white">
      <header className="flex items-center justify-between px-6 h-14 border-b border-white/5 bg-dark-surface/40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="text-white/60 hover:text-white text-sm flex items-center gap-2"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
          <span className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m22 8-6 4 6 4V8Z" />
                <rect x="2" y="6" width="14" height="12" rx="2" ry="2" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Caption Studio
            </span>
          </div>
        </div>
        <span className="text-xs text-white/40 font-mono">
          {currentTime.toFixed(2)}s
        </span>
      </header>

      <div className="flex-1 flex min-h-0">
        <section className="flex-[2] min-w-0 flex flex-col p-4 gap-4">
          <div className="h-[55%] min-h-0 rounded-xl overflow-hidden border border-white/5 bg-black">
            <VideoPreview
              ref={previewRef}
              videoUrl={state.videoUrl}
              words={words}
              style={style}
              onTimeUpdate={setCurrentTime}
            />
          </div>
          <div className="flex-1 min-h-0 rounded-xl border border-white/5 bg-dark-surface/60 p-4">
            <CaptionEditor
              words={words}
              currentTime={currentTime}
              selectedWordId={selectedWordId}
              onWordClick={onWordClick}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddAfter={onAddAfter}
            />
          </div>
        </section>

        <aside className="w-[340px] shrink-0 border-l border-white/5 bg-dark-surface/40 p-4 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <StylePanel style={style} onChange={setStyle} />
          </div>
          <ExportBar
            words={words}
            videoUrl={state.videoUrl}
            style={style}
          />
        </aside>
      </div>
    </div>
  )
}
