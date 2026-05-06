import { useTranslation } from "react-i18next"

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const isAr = i18n.language?.startsWith("ar")

  function toggle() {
    i18n.changeLanguage(isAr ? "en" : "ar")
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-white/15 bg-white/5 text-white/80 hover:text-white hover:border-white/30 transition shrink-0"
      title={isAr ? t("lang.en") : t("lang.ar")}
    >
      {isAr ? "EN" : "عربي"}
    </button>
  )
}
