import { useTranslation } from "react-i18next"
import CaptainLogo from "../CaptainLogo"
import LanguageSwitcher from "../LanguageSwitcher"

export default function StudioNavBar({ onBack, showBack = true }) {
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-2 px-3 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/85 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--bg-base)]/70 safe-area-pt">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="cap-focus-visible shrink-0 flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm py-2 px-1 rounded-[var(--radius-sm)]"
          >
            <svg
              width="16"
              height="16"
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
            <span className="hidden sm:inline">{t("nav.back")}</span>
          </button>
        ) : null}

        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <CaptainLogo size="sm" wordmark className="max-w-[min(220px,52vw)] sm:max-w-none" />
          <span className="shrink-0 rounded-[var(--radius-pill)] bg-[var(--accent-dim)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent-bright)] border border-[var(--accent)]/25">
            {t("studio.badge")}
          </span>
        </div>
      </div>

      <div className="shrink-0">
        <LanguageSwitcher />
      </div>
    </header>
  )
}
