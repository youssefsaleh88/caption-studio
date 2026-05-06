import { useTranslation } from "react-i18next"
import UploadZone from "../components/UploadZone"
import BrandHeader from "../components/BrandHeader"
import BrandFooter from "../components/BrandFooter"

export default function Home() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen w-full bg-dark text-white relative overflow-hidden flex flex-col">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(124,110,250,0.20) 0%, transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(124,110,250,0.10) 0%, transparent 60%)",
        }}
      />

      <BrandHeader />

      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-10 pb-12 flex-1 w-full">
        <h1 className="text-4xl md:text-5xl font-semibold text-center tracking-tight max-w-3xl">
          {t("home.title")}
        </h1>
        <p className="mt-3 text-white/60 text-center text-base">
          {t("home.poweredBy")}
        </p>

        <div className="mt-12 w-full">
          <UploadZone />
        </div>
      </main>

      <BrandFooter className="relative z-10 mt-auto" />
    </div>
  )
}
