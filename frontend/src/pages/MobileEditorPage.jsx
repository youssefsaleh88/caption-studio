import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { v4 as uuidv4 } from "uuid"

import LanguageSwitcher from "../components/LanguageSwitcher"
import MobileShell from "../components/mobile/MobileShell"
import StepExport from "../components/mobile/StepExport"
import StepReview from "../components/mobile/StepReview"
import StepStyle from "../components/mobile/StepStyle"
import StudioNavBar from "../components/studio/StudioNavBar"
import VideoStage from "../components/studio/VideoStage"
import WordEditBottomSheet from "../components/studio/WordEditBottomSheet"
import { useEditorSession } from "../hooks/useEditorSession"
import { downloadSRT } from "../utils/srtExport"
import { sortWordsByStart } from "../utils/timelineUtils"

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

const MOBILE_TOTAL_STEPS = 3

export default function MobileEditorPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { session, updateWords } = useEditorSession()
  const previewRef = useRef(null)

  useEffect(() => {
    if (!session?.videoUrl || !Array.isArray(session?.words)) {
      navigate("/", {
        replace: true,
        state: { editorSessionMissing: true },
      })
    }
  }, [session, navigate])

  const initialWords = useMemo(() => {
    if (!Array.isArray(session?.words)) return []
    return session.words.map((w) => ({
      id: String(w.id ?? uuidv4()),
      word: String(w.word ?? ""),
      start: Number(w.start ?? 0),
      end: Number(w.end ?? 0),
    }))
  }, [session?.words])

  const [words, setWords] = useState(initialWords)
  const [style, setStyle] = useState(DEFAULT_STYLE)
  const [currentTime, setCurrentTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const [mobileStep, setMobileStep] = useState(1)
  const [sheetWordId, setSheetWordId] = useState(null)

  // Sync words back to session when they change
  useEffect(() => {
    updateWords(words)
  }, [words, updateWords])

  const onPatchWord = useCallback((id, patch) => {
    setWords((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    )
  }, [])

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

  const sheetWord = useMemo(
    () => (sheetWordId ? words.find((w) => w.id === sheetWordId) : null),
    [words, sheetWordId],
  )

  const wordsSortedByStart = useMemo(
    () => sortWordsByStart(words),
    [words],
  )

  const handleTimelineRequestEdit = useCallback(
    (id) => {
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

  if (!session?.videoUrl || !Array.isArray(session?.words)) return null

  const mobileStepTitle = (() => {
    if (mobileStep === 1) return t("mobile.stepReviewTitle")
    if (mobileStep === 2) return t("mobile.stepStyleTitle")
    return t("mobile.stepExportTitle")
  })()

  const mobileStepHint = (() => {
    if (mobileStep === 1) return t("mobile.stepReviewHint")
    if (mobileStep === 2) return t("mobile.stepStyleHint")
    return t("mobile.stepExportHint")
  })()

  const mobileCtaLabel =
    mobileStep < MOBILE_TOTAL_STEPS ? t("mobile.next") : t("mobile.finish")

  const stageClassUnified =
    "flex-1 min-h-[200px] max-h-[min(52vh,calc(100dvh-15rem))] w-full max-w-[min(420px,100%)] mx-auto"

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-[var(--editor-rail)] text-[var(--text-primary)] lg:hidden">
      <header className="shrink-0 flex items-center justify-between gap-2 px-3 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/90 backdrop-blur-md safe-area-pt">
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
        </div>
      </header>

      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <div className="shrink-0 px-2 pt-2 pb-1">
          <div className="rounded-2xl overflow-hidden border border-[var(--border-subtle)]/80 shadow-lg shadow-black/20 bg-black/30 flex min-h-0 flex-col relative">
            <VideoStage
              ref={previewRef}
              videoUrl={session.videoUrl}
              words={words}
              style={{ ...style, timing_offset: 0 }}
              onTimeUpdate={setCurrentTime}
              onDurationChange={setVideoDuration}
              stageClassName={stageClassUnified}
            />
            {mobileStep === 1 && (
              <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded font-mono z-10 pointer-events-none">
                {currentTime.toFixed(1)}s
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <MobileShell
            step={mobileStep}
            totalSteps={MOBILE_TOTAL_STEPS}
            title={mobileStepTitle}
            hint={mobileStepHint}
            onBack={() => {
              if (mobileStep > 1) {
                setMobileStep((s) => s - 1)
              } else {
                navigate("/")
              }
            }}
            ctaLabel={mobileCtaLabel}
            onCta={() => {
              if (mobileStep < MOBILE_TOTAL_STEPS) {
                setMobileStep((s) => s + 1)
              } else {
                navigate("/")
              }
            }}
          >
            {mobileStep === 1 ? (
              <StepReview
                words={words}
                selectedWordId={sheetWordId}
                onPickWord={handleTimelineRequestEdit}
                onPlayPause={() => previewRef.current?.togglePlay?.()}
              />
            ) : null}

            {mobileStep === 2 ? (
              <StepStyle style={style} onChange={setStyle} />
            ) : null}

            {mobileStep === 3 ? (
              <StepExport
                words={words}
                videoUrl={session.videoUrl}
                style={style}
                onDownloadSrt={handleDownloadSrt}
              />
            ) : null}
          </MobileShell>
        </div>
      </div>

      <WordEditBottomSheet
        open={Boolean(sheetWordId && sheetWord)}
        word={sheetWord}
        sortedWords={wordsSortedByStart}
        onClose={() => setSheetWordId(null)}
        onPatch={handleSheetPatch}
        onPatchKeepOpen={handleSheetPatchKeepOpen}
        onDelete={() => {
          setWords(words.filter(w => w.id !== sheetWordId))
          setSheetWordId(null)
        }}
        onSeek={seekTo}
        onNavigateToWordId={setSheetWordId}
        timeStep={0.1}
        largeTouch={true}
        hideTimingControls={true}
      />
    </div>
  )
}
