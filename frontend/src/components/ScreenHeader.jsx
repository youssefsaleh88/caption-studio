import { useNavigate } from "react-router-dom"

export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  backTo = "/",
  right,
}) {
  const navigate = useNavigate()

  function goBack() {
    if (onBack) onBack()
    else if (backTo) navigate(backTo)
    else navigate(-1)
  }

  return (
    <header className="flex items-start justify-between gap-3 mb-5">
      <button
        type="button"
        onClick={goBack}
        aria-label="رجوع"
        className="cap-btn-ghost cap-focus-ring !min-h-[40px] !w-10 !p-0 shrink-0 -ms-2"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <div className="flex-1 text-center mt-1">
        <h1 className="text-[19px] font-extrabold text-ink leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] font-bold text-ink-soft mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      <div className="shrink-0 min-w-[40px] flex justify-end">
        {right || <span className="w-10 h-10 block" aria-hidden="true" />}
      </div>
    </header>
  )
}
