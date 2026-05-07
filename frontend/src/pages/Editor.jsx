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
import CaptionTimeline from "../components/studio/CaptionTimeline"
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
  const [videoDuration, setVideoDuration] = useState(0)
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

  const handleWordsFromTimeline = useCallback((next) => {
    setWords(next)
  }, [])

  const handleDownloadSrt = useCallback(() => {
    try {
      downloadSRT(words)
    } catch {
      /* ignore */
    }
  }, [words])

  const timelineDuration = useMemo(() => {
    const ends = words.map((w) => Number(w.end) || 0)
    const maxEnd = ends.length ? Math.max(...ends) : 0
    return Math.max(videoDuration || 0, maxEnd, 0.01)
  }, [videoDuration, words])

  if (!state?.videoUrl || !Array.isArray(state?.words)) return null

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-[var(--editor-rail)] text-[var(--text-primary)]">
      <StudioNavBar onBack={() => navigate("/")} />

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 min-w-0">
        <div className="flex-1 flex flex-col min-h-0 min-w-0 border-e border-[var(--border-subtle)]/60">
          <div
            ref={mainScrollRef}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col"
          >
            <div className="flex-1 min-h-0 flex flex-col items-stretch p-3 lg:p-4">
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
                onDurationChange={setVideoDuration}
                stageClassName="flex-1 min-h-[220px] max-h-[min(56vh,calc(100dvh-20rem))] lg:max-h-[min(62vh,calc(100dvh-16rem))] w-full max-w-[min(420px,100%)] mx-auto"
              />
            </div>

            <div
              ref={captionColumnRef}
              className="shrink-0 max-h-[min(240px,32vh)] lg:max-h-[min(280px,34vh)] overflow-y-auto border-t border-[var(--border-subtle)]/50 bg-[var(--bg-base)]/40 px-3 py-2"
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

          <CaptionTimeline
            words={words}
            duration={timelineDuration}
            currentTime={currentTime}
            onSeek={seekTo}
            onWordsChange={handleWordsFromTimeline}
            newId={() => uuidv4()}
          />
        </div>

        <aside className="w-full lg:w-[min(360px,34vw)] shrink-0 flex flex-col min-h-0 bg-[var(--bg-base)] border-t lg:border-t-0 lg:border-s border-[var(--border-subtle)]/80">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 lg:px-4 lg:py-4">
            <SettingsSection style={style} onChange={setStyle} />

            <div className="mt-8 text-center text-[11px] text-[var(--text-muted)] pb-2">
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

          <ActionBar
            embedded
            words={words}
            videoUrl={state.videoUrl}
            style={style}
            onDownloadSrt={handleDownloadSrt}
          />
        </aside>
      </div>
    </div>
  )
}
