import { useId } from "react"

/**
 * Mark + wordmark for Captain / Caption Studio.
 */
export default function CaptainLogo({
  size = "md",
  wordmark = true,
  className = "",
}) {
  const reactId = useId()
  const gradId = `capLogoGrad-${reactId.replace(/:/g, "")}`
  const markPx = size === "sm" ? 24 : 28
  const textSize = size === "sm" ? "text-sm" : "text-base"

  return (
    <div
      className={[
        "flex items-center gap-2.5 min-w-0",
        className,
      ].join(" ")}
    >
      <span
        className="shrink-0 rounded-[10px] overflow-hidden bg-gradient-to-br from-[var(--accent)] to-[var(--blue)] p-[2px] shadow-md shadow-[var(--accent)]/25"
        aria-hidden
      >
        <span className="flex items-center justify-center rounded-[8px] bg-black/25 backdrop-blur-[2px]">
          <svg
            width={markPx}
            height={markPx}
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="28" height="28" rx="8" fill={`url(#${gradId})`} />
            <rect x="6" y="8" width="12" height="2" rx="1" fill="white" fillOpacity="0.92" />
            <rect x="5" y="13" width="16" height="2.5" rx="1" fill="white" />
            <rect x="7" y="18.5" width="10" height="2" rx="1" fill="white" fillOpacity="0.85" />
            <circle cx="21.5" cy="8.5" r="3.5" fill="white" />
            <path
              d="M19.5 8.5 L21 10.5 L24 6.5"
              stroke="#6c63ff"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <defs>
              <linearGradient id={gradId} x1="6" y1="4" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--accent)" />
                <stop offset="1" stopColor="var(--blue)" />
              </linearGradient>
            </defs>
          </svg>
        </span>
      </span>

      {wordmark ? (
        <span className={`font-display font-extrabold ${textSize} tracking-tight leading-none min-w-0`}>
          <span className="bg-gradient-to-r from-[var(--accent)] via-[var(--blue)] to-[var(--accent-bright)] bg-clip-text text-transparent">
            Caption
          </span>
          <span className="font-semibold text-[var(--text-secondary)] ms-1">
            Studio
          </span>
        </span>
      ) : null}
    </div>
  )
}
