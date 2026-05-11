import { useTranslation } from "react-i18next"

export default function MobileShell({
  step = 1,
  totalSteps = 4,
  title,
  hint,
  onBack,
  ctaLabel,
  onCta,
  ctaDisabled = false,
  children,
}) {
  const { t } = useTranslation()
  return (
    <section className="lg:hidden flex-1 min-h-0 flex flex-col border-t border-[var(--border-subtle)] bg-[var(--bg-base)]/75">
      <header className="shrink-0 px-3 pt-3 pb-2 border-b border-[var(--border-subtle)]/60">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBack}
            className="cap-focus-visible min-h-[44px] rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 text-sm font-semibold text-[var(--text-primary)]"
          >
            {t("nav.back")}
          </button>
          <p className="text-xs font-mono text-[var(--text-muted)]">
            {step}/{totalSteps}
          </p>
        </div>
        <h2 className="mt-2 text-base font-bold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{hint}</p>
        <div className="mt-2 grid grid-cols-4 gap-1.5" aria-hidden>
          {Array.from({ length: totalSteps }, (_, i) => (
            <span
              key={i}
              className={[
                "h-1.5 rounded-full transition-colors",
                i < step ? "bg-[var(--accent)]" : "bg-white/15",
              ].join(" ")}
            />
          ))}
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3">
        {children}
      </div>

      <footer className="shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-base)]/95 px-3 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onCta}
          disabled={ctaDisabled}
          className="cap-focus-visible w-full min-h-[52px] rounded-[var(--radius-card)] bg-gradient-to-r from-[var(--accent)] to-[var(--blue)] px-4 text-sm font-bold text-white shadow-md shadow-[var(--accent)]/30 disabled:opacity-45"
        >
          {ctaLabel}
        </button>
      </footer>
    </section>
  )
}

