import { formatTimePrecise } from "../utils/time"

export default function TimeStepper({
  label,
  value,
  onChange,
  min = 0,
  max = Number.POSITIVE_INFINITY,
}) {
  function adjust(delta) {
    const raw = Number(value || 0) + delta
    const clamped = Math.max(min, Math.min(max, raw))
    const rounded = Math.round(clamped * 100) / 100
    if (Math.abs(rounded - value) > 0.001) onChange(rounded)
  }

  const canDecrease = value > min + 0.001
  const canIncrease = value < max - 0.001

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <span className="text-[11px] font-extrabold text-ink-soft shrink-0 w-9">
        {label}
      </span>
      <div className="flex items-center bg-surface-warm border border-line rounded-md overflow-hidden shrink-0">
        <StepBtn
          aria-label="-0.5 ثانية"
          onClick={() => adjust(-0.5)}
          disabled={!canDecrease}
        >
          <DoubleChevron dir="prev" />
        </StepBtn>
        <StepBtn
          aria-label="-0.1 ثانية"
          onClick={() => adjust(-0.1)}
          disabled={!canDecrease}
        >
          <SingleChevron dir="prev" />
        </StepBtn>
        <span className="font-mono tabular-nums text-[12.5px] font-bold text-ink px-2 min-w-[58px] text-center">
          {formatTimePrecise(value)}
        </span>
        <StepBtn
          aria-label="+0.1 ثانية"
          onClick={() => adjust(0.1)}
          disabled={!canIncrease}
        >
          <SingleChevron dir="next" />
        </StepBtn>
        <StepBtn
          aria-label="+0.5 ثانية"
          onClick={() => adjust(0.5)}
          disabled={!canIncrease}
        >
          <DoubleChevron dir="next" />
        </StepBtn>
      </div>
    </div>
  )
}

function StepBtn({ children, onClick, disabled, ...rest }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onClick()
      }}
      disabled={disabled}
      className="cap-focus-ring inline-flex items-center justify-center w-7 h-8 text-ink hover:bg-line/60 active:bg-line disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      {...rest}
    >
      {children}
    </button>
  )
}

function SingleChevron({ dir }) {
  // For RTL UI, prev points right (›) and next points left (‹) visually.
  const d = dir === "prev" ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  )
}

function DoubleChevron({ dir }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {dir === "prev" ? (
        <>
          <path d="m6 6 6 6-6 6" />
          <path d="m13 6 6 6-6 6" />
        </>
      ) : (
        <>
          <path d="m18 6-6 6 6 6" />
          <path d="m11 6-6 6 6 6" />
        </>
      )}
    </svg>
  )
}
