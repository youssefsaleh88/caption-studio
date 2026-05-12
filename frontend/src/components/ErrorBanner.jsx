export default function ErrorBanner({ message, onRetry, onDismiss }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="flex items-start gap-3 p-3.5 rounded-md border bg-warn-bg border-warn/30 cap-animate-fade-up"
    >
      <span aria-hidden="true" className="text-[18px] leading-none mt-0.5">⚠️</span>
      <div className="flex-1 text-[14px] font-semibold text-ink leading-snug">
        {message}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="cap-btn-secondary cap-focus-ring !min-h-[36px] !py-1.5 !px-3 !text-[13px]"
          >
            جرّب تاني
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="إخفاء"
            className="cap-btn-ghost cap-focus-ring !min-h-[36px] !w-9 !p-0 text-[18px]"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
