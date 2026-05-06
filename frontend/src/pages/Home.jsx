import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import UploadZone from "../components/UploadZone"
import BrandHeader from "../components/BrandHeader"
import BrandFooter from "../components/BrandFooter"

function TypingTitle({ text }) {
  const [shown, setShown] = useState("")
  const [done, setDone] = useState(false)

  useEffect(() => {
    setShown("")
    setDone(false)
    let cancelled = false
    let i = 0
    let tid
    function step() {
      if (cancelled) return
      i += 1
      setShown(text.slice(0, i))
      if (i >= text.length) {
        setDone(true)
        return
      }
      tid = window.setTimeout(step, 38)
    }
    tid = window.setTimeout(step, 120)
    return () => {
      cancelled = true
      window.clearTimeout(tid)
    }
  }, [text])

  return (
    <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-center tracking-tight max-w-3xl mx-auto leading-tight min-h-[3.5rem] sm:min-h-[4rem]">
      <span>{shown}</span>
      {!done ? (
        <span className="inline-block w-0.5 h-[1em] ml-0.5 bg-accent align-middle animate-pulse rounded-sm" />
      ) : null}
    </h1>
  )
}

export default function Home() {
  const { t } = useTranslation()

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
