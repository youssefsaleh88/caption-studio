import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import ar from "./locales/ar.json"
import en from "./locales/en.json"

const saved =
  typeof localStorage !== "undefined" ? localStorage.getItem("lang") : null
const lng = saved === "en" ? "en" : "ar"

function applyDomLang(lang) {
  if (typeof document === "undefined") return
  document.documentElement.lang = lang
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
}

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng,
  fallbackLng: "ar",
  interpolation: { escapeValue: false },
})

applyDomLang(i18n.language)

i18n.on("languageChanged", (lang) => {
  applyDomLang(lang)
  try {
    localStorage.setItem("lang", lang)
  } catch (_) {
    /* ignore */
  }
})

export default i18n
