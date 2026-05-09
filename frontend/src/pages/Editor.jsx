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
import MobileShell from "../components/mobile/MobileShell"
import StepExport from "../components/mobile/StepExport"
import StepReview from "../components/mobile/StepReview"
import StepStyle from "../components/mobile/StepStyle"
import SettingsSection from "../components/studio/SettingsSection"
import StudioNavBar from "../components/studio/StudioNavBar"
import TranscriptPanel from "../components/studio/TranscriptPanel"
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

const MOBILE_TOTAL_STEPS = 4

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
  const [mobileStep, setMobileStep] = useState(1)
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

  const mobileStepTitle = (() => {
    if (mobileStep === 1) return "الخطوة 1: المعاينة"
    if (mobileStep === 2) return "الخطوة 2: مراجعة الكلام"
    if (mobileStep === 3) return "الخطوة 3: تنسيق الشكل"
    return "الخطوة 4: التصدير"
  })()
  const mobileStepHint = (() => {
    if (mobileStep === 1) return "شوف الفيديو بسرعة واتأكد إن المحتوى صحيح."
    if (mobileStep === 2) return "اضغط على أي كلمة لتعديلها بسهولة."
    if (mobileStep === 3) return "اختار ستايل جاهز أو افتح التخصيص المتقدم."
    return "حمّل الفيديو النهائي أو ملف الترجمة."
  })()
  const mobileCtaLabel =
    mobileStep < MOBILE_TOTAL_STEPS ? "التالي" : "إنهاء"

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
            <div className="lg:hidden flex-1 min-h-0">
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
                  <div className="space-y-3">
                    <p className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-card)]/75 px-3 py-2 text-sm text-[var(--text-secondary)]">
                      استخدم زر التشغيل لمعاينة سريعة قبل التعديل.
                    </p>
                    <button
                      type="button"
                      onClick={() => previewRef.current?.togglePlay?.()}
                      className="cap-focus-visible min-h-[48px] w-full rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 text-sm font-semibold text-[var(--text-primary)]"
                    >
                      تشغيل/إيقاف المعاينة
                    </button>
                    <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-xs font-mono text-[var(--text-muted)]">
                      {currentTime.toFixed(2)}s / {timelineDuration.toFixed(2)}s
                    </div>
                  </div>
                ) : null}

                {mobileStep === 2 ? (
                  <StepReview
                    words={words}
                    selectedWordId={selectedWordId}
                    onPickWord={handleTimelineRequestEdit}
                    onPlayPause={() => previewRef.current?.togglePlay?.()}
                  />
                ) : null}

                {mobileStep === 3 ? (
                  <StepStyle style={style} onChange={setStyle} />
                ) : null}

                {mobileStep === 4 ? (
                  <StepExport
                    words={words}
                    videoUrl={state.videoUrl}
                    style={style}
                    onDownloadSrt={handleDownloadSrt}
                    exportAnchorId="cap-editor-export-anchor"
                  />
                ) : null}
              </MobileShell>
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
            className="hidden"
            aria-label={t("editor.mobileTabsNav")}
          >
            <div />
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
