import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"
import { v4 as uuidv4 } from "uuid"

import ActionBar from "../components/studio/ActionBar"
import CaptionList from "../components/studio/CaptionList"
import SettingsSection from "../components/studio/SettingsSection"
import StudioNavBar from "../components/studio/StudioNavBar"
import VideoStage from "../components/studio/VideoStage"
import { BRAND } from "../utils/brand"
import { downloadSRT } from "../utils/srtExport"

const LS_CAPTIONS_PANEL = "cap.captionsPanel"
const LS_AUTO_FOLLOW = "cap.captionsAutoFollow"

function readInitialPanelOpen() {
  if (typeof window === "undefined") return true
  try {
    const v = localStorage.getItem(LS_CAPTIONS_PANEL)
    if (v === "open") return true
    if (v === "closed") return false
  } catch {
    /* ignore */
  }
  return window.matchMedia("(min-width: 1024px)").matches
}

function readInitialAutoFollow() {
  if (typeof window === "undefined") return false
  try {
    const v = localStorage.getItem(LS_AUTO_FOLLOW)
    if (v === "1") return true
    if (v === "0") return false
  } catch {
    /* ignore */
  }
  const mobile = window.matchMedia("(max-width: 1023px)").matches
  return !mobile
}

const DEFAULT_STYLE = {
  fontFamily: "Tajawal",
  font_size_pct: 5.5,
  color: "#FFFFFF",
  bg_enabled: true,
  bg_color: "#000000",
  bg_opacity: 0.6,
  shadow: 2,
  outline_enabled: false,
  outline_color: "#000000",
  position: "bottom-center",
  position_x_pct: 50,
  position_y_pct: 88,
  caption_mode: "sentences",
  timing_offset: 0,
  max_words_per_line: 6,
  max_segment_duration: 3,
  sliding_window: 3,
  min_display_time: 0.7,
  caption_animation: "none",
  karaoke_color: "#8B80FF",
}

export default function Editor() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state } = useLocation()
  const previewRef = useRef(null)
  const mainScrollRef = useRef(null)
  const captionColumnRef = useRef(null)

  useEffect(() => {
    if (!state?.videoUrl || !Array.isArray(state?.words)) {
      navigate("/", {
        replace: true,
        state: { editorSessionMissing: true },
      })
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
  const [expandedCaptionId, setExpandedCaptionId] = useState(null)

  const [captionsPanelOpen, setCaptionsPanelOpen] = useState(
    readInitialPanelOpen,
  )
  const [autoFollow, setAutoFollow] = useState(readInitialAutoFollow)

  useEffect(() => {
    try {
      localStorage.setItem(
        LS_CAPTIONS_PANEL,
        captionsPanelOpen ? "open" : "closed",
      )
    } catch {
      /* ignore */
    }
  }, [captionsPanelOpen])

  useEffect(() => {
    try {
      localStorage.setItem(LS_AUTO_FOLLOW, autoFollow ? "1" : "0")
    } catch {
      /* ignore */
    }
  }, [autoFollow])

  const onPatchWord = useCallback((id, patch) => {
    setWords((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    )
  }, [])

  function onDelete(id) {
    setWords((prev) => prev.filter((w) => w.id !== id))
    setExpandedCaptionId((cur) => (cur === id ? null : cur))
  }

  const seekTo = useCallback((time) => {
    previewRef.current?.pause?.()
    previewRef.current?.seek?.(time)
  }, [])

  const handleDownloadSrt = useCallback(() => {
    try {
      downloadSRT(words)
    } catch {
      /* ignore */
    }
  }, [words])

  if (!state?.videoUrl || !Array.isArray(state?.words)) return null

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
      <StudioNavBar onBack={() => navigate("/")} />

      <main
        ref={mainScrollRef}
        className="flex-1 overflow-y-auto px-4 pt-4 pb-[calc(11rem+env(safe-area-inset-bottom))] w-full max-w-[480px] lg:max-w-[1100px] mx-auto"
      >
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
          <div className="w-full">
            <VideoStage
              ref={previewRef}
              videoUrl={state.videoUrl}
              words={words}
              style={{ ...style, timing_offset: 0 }}
              onTimeUpdate={setCurrentTime}
              onVideoDimensions={() => {}}
              onStyleChange={(patch) =>
                setStyle((s) => ({ ...s, ...patch }))
              }
            />
          </div>

          <div
            ref={captionColumnRef}
            className="mt-8 lg:mt-0 lg:max-h-[min(560px,calc(100vh-140px))] lg:overflow-y-auto lg:pr-1 lg:overscroll-contain"
          >
            <CaptionList
              words={words}
              currentTime={currentTime}
              expandedId={expandedCaptionId}
              onExpandedChange={setExpandedCaptionId}
              onPatchWord={onPatchWord}
              onDelete={onDelete}
              onSeek={seekTo}
              mainScrollRef={mainScrollRef}
              columnScrollRef={captionColumnRef}
              panelOpen={captionsPanelOpen}
              onTogglePanel={() => setCaptionsPanelOpen((v) => !v)}
              autoFollow={autoFollow}
              onAutoFollowChange={setAutoFollow}
            />
          </div>
        </div>

        <div className="mt-10 space-y-6">
          <SettingsSection style={style} onChange={setStyle} />

          <div className="text-center text-[11px] text-[var(--text-muted)] pb-2">
            <a
              href={BRAND.instagram}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--text-secondary)] hover:text-[var(--accent-bright)]"
            >
              {BRAND.instagramHandle}
            </a>
            <span className="mx-2 text-[var(--border-subtle)]">·</span>
            <span>
              {t("footer.madeBy")} {BRAND.ownerName}
            </span>
          </div>
        </div>
      </main>

      <ActionBar
        words={words}
        videoUrl={state.videoUrl}
        style={style}
        onDownloadSrt={handleDownloadSrt}
      />
    </div>
  )
}
