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
import CaptionTimeline from "../components/studio/CaptionTimeline"
import LanguageSwitcher from "../components/LanguageSwitcher"
import SettingsSection from "../components/studio/SettingsSection"
import StudioNavBar from "../components/studio/StudioNavBar"
import TranscriptPanel from "../components/studio/TranscriptPanel"
import WordListStrip from "../components/studio/WordListStrip"
import VideoStage from "../components/studio/VideoStage"
import WordEditBottomSheet from "../components/studio/WordEditBottomSheet"
import { BRAND } from "../utils/brand"
import { downloadSRT } from "../utils/srtExport"
import { sortWordsByStart } from "../utils/timelineUtils"

const LS_AUTO_FOLLOW = "cap.captionsAutoFollow"

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

function scrollExportAnchorIntoView() {
  const desktop = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches
  const id = desktop ? "cap-editor-export-aside" : "cap-editor-export-anchor"
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
}

export default function Editor() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state } = useLocation()
  const previewRef = useRef(null)

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
  const [autoFollow, setAutoFollow] = useState(readInitialAutoFollow)
  const [activeMobileTab, setActiveMobileTab] = useState("edit")
  const [selectedWordId, setSelectedWordId] = useState(null)
  const [sheetWordId, setSheetWordId] = useState(null)
  const [coarseEditorTouch, setCoarseEditorTouch] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(max-width: 1023px)")
    const sync = () => setCoarseEditorTouch(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(LS_AUTO_FOLLOW, autoFollow ? "1" : "0")
    } catch {
      /* ignore */
    }
  }, [autoFollow])

  useEffect(() => {
    if (sheetWordId && !words.some((w) => w.id === sheetWordId)) {
      setSheetWordId(null)
    }
  }, [words, sheetWordId])

  const onPatchWord = useCallback((id, patch) => {
    setWords((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    )
  }, [])

  function onDelete(id) {
    setWords((prev) => prev.filter((w) => w.id !== id))
    setSelectedWordId((cur) => (cur === id ? null : cur))
    setSheetWordId((cur) => (cur === id ? null : cur))
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

  const sheetWord = useMemo(
    () => (sheetWordId ? words.find((w) => w.id === sheetWordId) : null),
    [words, sheetWordId],
  )

  const wordsSortedByStart = useMemo(
    () => sortWordsByStart(words),
    [words],
  )

  const selectTranscriptRow = useCallback(
    (id) => {
      setSelectedWordId(id)
      const w = words.find((x) => x.id === id)
      if (w) seekTo(w.start)
    },
    [words, seekTo],
  )

  const handleTimelineRequestEdit = useCallback(
    (id) => {
      setSelectedWordId(id)
      setSheetWordId(id)
      const w = words.find((x) => x.id === id)
      if (w) seekTo(w.start)
    },
    [words, seekTo],
  )

  const handleSheetPatch = useCallback(
    (patch) => {
      if (!sheetWordId) return
      onPatchWord(sheetWordId, patch)
    },
    [sheetWordId, onPatchWord],
  )

  const handleSheetPatchKeepOpen = useCallback(
    (patch) => {
      if (!sheetWordId) return
      onPatchWord(sheetWordId, patch)
    },
    [sheetWordId, onPatchWord],
  )

  const handleNavigateSheetWord = useCallback(
    (id) => {
      setSheetWordId(id)
      setSelectedWordId(id)
    },
    [],
  )

  const handleSheetDelete = useCallback(() => {
    if (sheetWordId) onDelete(sheetWordId)
  }, [sheetWordId])

  const videoStageProps = {
    videoUrl: state.videoUrl,
    words,
    style: { ...style, timing_offset: 0 },
    onTimeUpdate: setCurrentTime,
    onVideoDimensions: () => {},
    onStyleChange: (patch) => setStyle((s) => ({ ...s, ...patch })),
    onDurationChange: setVideoDuration,
  }

  if (!state?.videoUrl || !Array.isArray(state?.words)) return null

  const stageClassUnified =
    "flex-1 min-h-[200px] max-h-[min(52vh,calc(100dvh-15rem))] lg:min-h-[220px] lg:max-h-[min(56vh,calc(100dvh-18rem))] w-full max-w-[min(420px,100%)] mx-auto"

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-[var(--editor-rail)] text-[var(--text-primary)]">
      <header className="lg:hidden shrink-0 flex items-center justify-between gap-2 px-3 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/90 backdrop-blur-md safe-area-pt">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="cap-focus-visible shrink-0 flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 rounded-[var(--radius-sm)]"
          aria-label={t("nav.back")}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <span className="min-w-0 truncate text-center text-xs font-semibold text-[var(--text-primary)]">
          {t("brand.appName")}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => {
              setActiveMobileTab("export")
              requestAnimationFrame(() => scrollExportAnchorIntoView())
            }}
            className="cap-focus-visible rounded-[var(--radius-sm)] bg-gradient-to-r from-[var(--accent)] to-[var(--blue)] px-3 py-2 text-[11px] font-bold text-white shadow-md shadow-[var(--accent)]/25"
          >
            {t("studio.action.export")}
          </button>
        </div>
      </header>

      <div className="hidden lg:block">
        <StudioNavBar onBack={() => navigate("/")} />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 min-w-0">
        <aside className="hidden lg:flex lg:flex-col min-h-0 w-[min(320px,32vw)] shrink-0 border-e border-[var(--border-subtle)]/60 bg-[var(--bg-base)]/50">
          <TranscriptPanel
            words={words}
            currentTime={currentTime}
            selectedWordId={selectedWordId}
            onSelectWord={selectTranscriptRow}
            onEditWord={handleTimelineRequestEdit}
            autoFollow={autoFollow}
            onAutoFollowChange={setAutoFollow}
          />
        </aside>

        <div className="flex-1 flex flex-col min-h-0 min-w-0 border-e border-[var(--border-subtle)]/60 lg:border-e">
          <div className="hidden lg:flex shrink-0 items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border-subtle)]/50 bg-[var(--bg-base)]/35">
            <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)]">
              16:9
            </span>
            <button
              type="button"
              onClick={() => scrollExportAnchorIntoView()}
              className="cap-focus-visible rounded-[var(--radius-sm)] bg-gradient-to-r from-[var(--accent)] to-[var(--blue)] px-3 py-1.5 text-[11px] font-bold text-white shadow-md shadow-[var(--accent)]/25"
            >
              {t("studio.action.export")}
            </button>
          </div>

          <div className="shrink-0 px-2 pt-2 pb-1 lg:px-4 lg:pt-4 lg:pb-2">
            <div className="rounded-2xl overflow-hidden border border-[var(--border-subtle)]/80 shadow-lg shadow-black/20 bg-black/30 flex min-h-0 flex-col">
              <VideoStage
                ref={previewRef}
                {...videoStageProps}
                stageClassName={stageClassUnified}
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="lg:hidden flex-1 min-h-0 flex flex-col gap-2 px-2">
              {activeMobileTab === "edit" ? (
                <>
                  <CaptionTimeline
                    words={words}
                    duration={timelineDuration}
                    currentTime={currentTime}
                    onSeek={seekTo}
                    onWordsChange={handleWordsFromTimeline}
                    newId={() => uuidv4()}
                    selectedWordId={selectedWordId}
                    onSelectWord={setSelectedWordId}
                    onRequestEditWord={handleTimelineRequestEdit}
                    variant="roomy"
                    mediaControlRef={previewRef}
                  />
                  <WordListStrip
                    words={words}
                    selectedWordId={selectedWordId}
                    onPickWord={handleTimelineRequestEdit}
                  />
                </>
              ) : null}

              {activeMobileTab === "style" ? (
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain -mx-1 px-1 pb-2">
                  <SettingsSection style={style} onChange={setStyle} />
                </div>
              ) : null}

              {activeMobileTab === "export" ? (
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-2">
                  <ActionBar
                    embedded
                    exportAnchorId="cap-editor-export-anchor"
                    words={words}
                    videoUrl={state.videoUrl}
                    style={style}
                    onDownloadSrt={handleDownloadSrt}
                  />
                </div>
              ) : null}
            </div>

            <div className="hidden lg:block shrink-0">
              <CaptionTimeline
                words={words}
                duration={timelineDuration}
                currentTime={currentTime}
                onSeek={seekTo}
                onWordsChange={handleWordsFromTimeline}
                newId={() => uuidv4()}
                selectedWordId={selectedWordId}
                onSelectWord={setSelectedWordId}
                onRequestEditWord={handleTimelineRequestEdit}
                variant="default"
              />
            </div>
          </div>

          <nav
            className="lg:hidden shrink-0 flex items-stretch justify-around gap-1 border-t border-[var(--border-subtle)] bg-[var(--bg-base)]/95 pb-[max(6px,env(safe-area-inset-bottom))] pt-1"
            aria-label={t("editor.mobileTabsNav")}
          >
            <MobileTabButton
              active={activeMobileTab === "edit"}
              onClick={() => setActiveMobileTab("edit")}
              label={t("editor.tabEdit")}
              icon="edit"
            />
            <MobileTabButton
              active={activeMobileTab === "style"}
              onClick={() => setActiveMobileTab("style")}
              label={t("editor.tabStyle")}
              icon="style"
            />
            <MobileTabButton
              active={activeMobileTab === "export"}
              onClick={() => setActiveMobileTab("export")}
              label={t("editor.tabExport")}
              icon="export"
            />
          </nav>
        </div>

        <aside className="hidden lg:flex w-[min(360px,34vw)] shrink-0 flex-col min-h-0 bg-[var(--bg-base)] border-t lg:border-t-0 lg:border-s border-[var(--border-subtle)]/80">
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
            exportAnchorId="cap-editor-export-aside"
            words={words}
            videoUrl={state.videoUrl}
            style={style}
            onDownloadSrt={handleDownloadSrt}
          />
        </aside>
      </div>

      <WordEditBottomSheet
        open={Boolean(sheetWordId && sheetWord)}
        word={sheetWord}
        sortedWords={wordsSortedByStart}
        onClose={() => setSheetWordId(null)}
        onPatch={handleSheetPatch}
        onPatchKeepOpen={handleSheetPatchKeepOpen}
        onDelete={handleSheetDelete}
        onSeek={seekTo}
        onNavigateToWordId={handleNavigateSheetWord}
        timeStep={coarseEditorTouch ? 0.1 : 0.05}
        largeTouch={coarseEditorTouch}
      />
    </div>
  )
}

function MobileTabButton({ active, onClick, label, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "cap-focus-visible flex flex-1 flex-col items-center justify-center gap-0.5 py-2 rounded-[var(--radius-sm)] text-[10px] font-semibold transition-colors",
        active
          ? "text-[var(--accent-bright)] bg-[var(--accent)]/12"
          : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
      ].join(" ")}
    >
      <TabIcon name={icon} active={active} />
      <span className="leading-tight text-center px-0.5">{label}</span>
    </button>
  )
}

function TabIcon({ name, active }) {
  const stroke = active ? "currentColor" : "currentColor"
  const op = active ? 1 : 0.65
  if (name === "style") {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        opacity={op}
        aria-hidden
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    )
  }
  if (name === "export") {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        opacity={op}
        aria-hidden
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    )
  }
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="2"
      opacity={op}
      aria-hidden
    >
      <rect x="3" y="14" width="4" height="6" rx="1" />
      <rect x="10" y="10" width="4" height="10" rx="1" />
      <rect x="17" y="6" width="4" height="14" rx="1" />
    </svg>
  )
}
