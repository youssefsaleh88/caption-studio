import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"
import UploadZone from "../components/UploadZone"
import BrandFooter from "../components/BrandFooter"
import StepUpload from "../components/mobile/StepUpload"
import StudioNavBar from "../components/studio/StudioNavBar"

/** مرجع ثابت مطلوب: useSyncExternalStore يقارن اللقطة بـ Object.is — كائن جديد كل مرة يسبب حلقة React #185 */
const TYPING_MOTION_SERVER_SNAP = Object.freeze({
  enabled: true,
  charDelayMs: 38,
})

let typingMotionClientCache = {
  key: "",
  snap: TYPING_MOTION_SERVER_SNAP,
}

function subscribeTypingMotion(cb) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

function snapshotTypingMotion() {
  const cs = getComputedStyle(document.documentElement)
  const enabled =
    cs.getPropertyValue("--cap-motion-enable-typing").trim() !== "0"
  const raw = cs.getPropertyValue("--cap-motion-typing-char-delay").trim()
  const charDelayMs = Math.max(0, parseFloat(raw)) || 0
  const key = `${enabled}:${charDelayMs}`
  if (typingMotionClientCache.key === key) {
    return typingMotionClientCache.snap
  }
  const snap = Object.freeze({ enabled, charDelayMs })
  typingMotionClientCache = { key, snap }
  return snap
}

function serverTypingMotion() {
  return TYPING_MOTION_SERVER_SNAP
}

function TypingTitle({ text }) {
  const motion = useSyncExternalStore(
    subscribeTypingMotion,
    snapshotTypingMotion,
    serverTypingMotion,
  )
  const [shown, setShown] = useState(() => (!motion.enabled ? text : ""))
  const [done, setDone] = useState(() => !motion.enabled)

  useEffect(() => {
    if (!motion.enabled) {
      setShown(text)
      setDone(true)
      return
    }

    setShown("")
    setDone(false)
    let cancelled = false
    let i = 0
    let tid
    const initialPause = motion.charDelayMs > 0 ? 120 : 0
    const stepDelay = motion.charDelayMs > 0 ? motion.charDelayMs : 38

    function step() {
      if (cancelled) return
      i += 1
      setShown(text.slice(0, i))
      if (i >= text.length) {
        setDone(true)
        return
      }
      tid = window.setTimeout(step, stepDelay)
    }

    tid = window.setTimeout(step, initialPause)
    return () => {
      cancelled = true
      window.clearTimeout(tid)
    }
  }, [text, motion.enabled, motion.charDelayMs])

  return (
    <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-center tracking-tight max-w-3xl mx-auto leading-tight min-h-[3.5rem] sm:min-h-[4rem]">
      <span className="bg-gradient-to-r from-[var(--accent)] via-[var(--blue)] to-[var(--accent-bright)] bg-clip-text text-transparent">
        {shown}
      </span>
      {!done ? (
        <span
          className="cap-typing-caret inline-block w-0.5 h-[1em] ms-1 bg-[var(--accent)] align-middle animate-caret-pulse-soft rounded-sm"
          aria-hidden
        />
      ) : null}
    </h1>
  )
}

export default function Home() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [coldDismissed, setColdDismissed] = useState(false)
  const showColdBanner =
    Boolean(location.state?.editorSessionMissing) && !coldDismissed

  const clearLocationFlag = useCallback(() => {
    navigate(
      {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
        state: {},
      },
      { replace: true },
    )
  }, [navigate, location.pathname, location.search, location.hash])

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] relative overflow-hidden flex flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgb(108 99 255 / 0.35), transparent 55%), radial-gradient(ellipse at 100% 100%, rgb(79 172 254 / 0.12), transparent 45%)",
        }}
      />

      <StudioNavBar showBack={false} onBack={() => navigate("/")} mobileCompact />

      <main className="relative z-10 lg:hidden flex flex-col px-3 pt-4 pb-6 flex-1 w-full max-w-lg mx-auto">
        {showColdBanner ? (
          <div
            className="w-full mb-3 rounded-[var(--radius-card)] border border-amber-500/35 bg-amber-500/10 px-3 py-3 text-sm text-amber-100/95 flex gap-3 items-start"
            role="status"
          >
            <p className="flex-1 leading-snug text-start">
              {t("home.editorSessionMissing")}
            </p>
            <button
              type="button"
              onClick={() => {
                setColdDismissed(true)
                clearLocationFlag()
              }}
              className="cap-focus-visible shrink-0 min-h-11 min-w-11 px-2 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-white/5 text-[var(--text-primary)] hover:bg-white/10 text-lg leading-none"
              aria-label={t("home.dismissHint")}
            >
              ×
            </button>
          </div>
        ) : null}
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)] text-center">
          ارفع الفيديو وابدأ في 4 خطوات سهلة
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)] text-center">
          مناسب لأي مستخدم جديد بدون خبرة تقنية.
        </p>
        <div className="mt-4">
          <StepUpload />
        </div>
      </main>

      <main className="relative z-10 hidden lg:flex flex-col items-center justify-center px-4 sm:px-6 pt-6 sm:pt-10 pb-10 flex-1 w-full max-w-lg mx-auto">
        {showColdBanner ? (
          <div
            className="w-full mb-6 rounded-[var(--radius-card)] border border-amber-500/35 bg-amber-500/10 px-3 py-3 sm:px-4 text-sm text-amber-100/95 flex gap-3 items-start"
            role="status"
          >
            <p className="flex-1 leading-snug text-start">
              {t("home.editorSessionMissing")}
            </p>
            <button
              type="button"
              onClick={() => {
                setColdDismissed(true)
                clearLocationFlag()
              }}
              className="cap-focus-visible shrink-0 min-h-11 min-w-11 px-2 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-white/5 text-[var(--text-primary)] hover:bg-white/10 text-lg leading-none"
              aria-label={t("home.dismissHint")}
            >
              ×
            </button>
          </div>
        ) : null}

        <div className="animate-cap-slide-up opacity-0 w-full [animation-fill-mode:forwards]">
          <TypingTitle text={t("home.title")} />
        </div>
        <p className="mt-4 text-[var(--text-secondary)] text-center text-sm sm:text-base animate-cap-slide-up opacity-0 [animation-delay:90ms] [animation-fill-mode:forwards]">
          {t("home.poweredBy")}
        </p>

        <div className="mt-10 sm:mt-12 w-full animate-cap-slide-up opacity-0 [animation-delay:160ms] [animation-fill-mode:forwards]">
          <UploadZone />
        </div>

        <p className="mt-8 text-xs text-[var(--text-muted)] text-center animate-cap-slide-up opacity-0 [animation-delay:240ms] [animation-fill-mode:forwards]">
          {t("home.subtitle")}
        </p>
      </main>

      <BrandFooter className="relative z-10 mt-auto border-[var(--border-subtle)] bg-[var(--bg-card)]/80 text-[var(--text-secondary)]" />
    </div>
  )
}
