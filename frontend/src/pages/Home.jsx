import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"
import UploadZone from "../components/UploadZone"
import BrandHeader from "../components/BrandHeader"
import BrandFooter from "../components/BrandFooter"

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
  return { enabled, charDelayMs }
}

function serverTypingMotion() {
  return { enabled: true, charDelayMs: 38 }
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
    <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-center tracking-tight max-w-3xl mx-auto leading-tight min-h-[3.5rem] sm:min-h-[4rem]">
      <span>{shown}</span>
      {!done ? (
        <span
          className="cap-typing-caret inline-block w-0.5 h-[1em] ms-1 bg-accent align-middle animate-caret-pulse-soft rounded-sm"
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
    <div className="min-h-screen w-full bg-dark text-white relative overflow-hidden flex flex-col">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none bg-mesh-gradient animate-gradient-shift opacity-90"
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 15% 20%, rgba(139,124,255,0.22) 0%, transparent 50%), radial-gradient(ellipse at 85% 80%, rgba(139,124,255,0.12) 0%, transparent 55%)",
        }}
      />

      <BrandHeader />

      <main className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-6 pt-8 sm:pt-12 pb-10 flex-1 w-full max-w-5xl mx-auto">
        {showColdBanner ? (
          <div
            className="w-full max-w-xl mb-6 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-3 sm:px-4 text-sm text-amber-100/95 flex gap-3 items-start"
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
              className="cap-focus-visible shrink-0 min-h-11 min-w-11 px-2 rounded-lg border border-white/15 bg-white/5 text-white/90 hover:bg-white/10 text-lg leading-none"
              aria-label={t("home.dismissHint")}
            >
              ×
            </button>
          </div>
        ) : null}

        <div className="animate-fade-up opacity-0 w-full">
          <TypingTitle text={t("home.title")} />
        </div>
        <p className="mt-4 text-white/55 text-center text-sm sm:text-base opacity-0 animate-fade-up [animation-delay:120ms]">
          {t("home.poweredBy")}
        </p>

        <div className="mt-10 sm:mt-14 w-full max-w-xl opacity-0 animate-fade-up [animation-delay:220ms]">
          <UploadZone />
        </div>

        <p className="mt-8 text-xs text-white/35 text-center opacity-0 animate-fade-up [animation-delay:320ms]">
          {t("home.subtitle")}
        </p>
      </main>

      <BrandFooter className="relative z-10 mt-auto" />
    </div>
  )
}
