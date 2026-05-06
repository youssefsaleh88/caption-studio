import { BRAND } from "../utils/brand"

export default function BrandHeader({
  showBack = false,
  onBack,
  rightSlot,
  compact = false,
}) {
  return (
    <header
      className={[
        "relative z-10 flex items-center justify-between border-b border-white/5 bg-dark-surface/40 backdrop-blur-sm",
        compact ? "px-4 py-3 h-12" : "px-8 py-6",
      ].join(" ")}
    >
      <div className="flex items-center gap-3 min-w-0">
        {showBack && (
          <>
            <button
              type="button"
              onClick={onBack}
              className="text-white/60 hover:text-white text-sm flex items-center gap-2 shrink-0"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back
            </button>
            <span className="w-px h-5 bg-white/10 shrink-0" />
          </>
        )}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m22 8-6 4 6 4V8Z" />
              <rect x="2" y="6" width="14" height="12" rx="2" ry="2" />
            </svg>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-2 min-w-0">
            <span className="text-sm font-semibold tracking-tight truncate">
              {BRAND.appName}
            </span>
            <span className="text-xs text-white/45 truncate">
              by {BRAND.ownerName}
            </span>
          </div>
        </div>
      </div>
      {rightSlot ? (
        <div className="shrink-0">{rightSlot}</div>
      ) : null}
    </header>
  )
}
