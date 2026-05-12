import { useEffect, useRef, useState } from "react"

function formatNum(value) {
  const v = Math.max(0, Number(value) || 0)
  return v.toFixed(2).replace(/\.?0+$/, "")
}

export default function TimeStepper({
  label,
  value,
  onChange,
  min = 0,
  max = Number.POSITIVE_INFINITY,
}) {
  const [text, setText] = useState(() => formatNum(value))
  const focusedRef = useRef(false)

  useEffect(() => {
    if (!focusedRef.current) setText(formatNum(value))
  }, [value])

  function clamp(raw) {
    return Math.max(min, Math.min(max, raw))
  }

  function commitRaw(next) {
    if (!Number.isFinite(next)) return
    const clamped = clamp(next)
    const rounded = Math.round(clamped * 100) / 100
    if (Math.abs(rounded - Number(value)) > 0.001) onChange(rounded)
    return rounded
  }

  function applyTyped() {
    const raw = String(text).trim().replace(",", ".")
    if (!raw) {
      setText(formatNum(value))
      return
    }
    let next
    if (/^[+\-]/.test(raw)) {
      const delta = parseFloat(raw)
      if (!Number.isFinite(delta)) {
        setText(formatNum(value))
        return
      }
      next = Number(value || 0) + delta
    } else {
      const abs = parseFloat(raw)
      if (!Number.isFinite(abs)) {
        setText(formatNum(value))
        return
      }
      next = abs
    }
    const applied = commitRaw(next)
    setText(formatNum(applied ?? value))
  }

  function adjust(delta) {
    const applied = commitRaw(Number(value || 0) + delta)
    if (!focusedRef.current) setText(formatNum(applied ?? value))
  }

  const canDecrease = Number(value) > min + 0.001
  const canIncrease = Number(value) < max - 0.001

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <span className="text-[11px] font-extrabold text-ink-soft shrink-0 w-9">
        {label}
      </span>
      <div className="flex items-center bg-surface-warm border border-line rounded-md overflow-hidden shrink-0 h-8">
        <StepBtn
          aria-label="ناقص ثانية"
          onClick={() => adjust(-1)}
          disabled={!canDecrease}
        >
          <span className="font-mono tabular-nums text-[11.5px] font-extrabold">
            −1
          </span>
        </StepBtn>
        <div className="relative flex items-center border-x border-line">
          <input
            type="text"
            inputMode="decimal"
            dir="ltr"
            value={text}
            aria-label={`${label} بالثواني`}
            onFocus={(e) => {
              focusedRef.current = true
              e.currentTarget.select()
            }}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => {
              focusedRef.current = false
              applyTyped()
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                applyTyped()
                e.currentTarget.blur()
              } else if (e.key === "Escape") {
                e.preventDefault()
                setText(formatNum(value))
                e.currentTarget.blur()
              }
            }}
            className="cap-focus-ring font-mono tabular-nums text-[12.5px] font-bold text-ink bg-transparent text-center outline-none w-[58px] h-8 px-1"
          />
          <span className="font-mono text-[10.5px] font-bold text-ink-soft pr-1.5 select-none pointer-events-none">
            ث
          </span>
        </div>
        <StepBtn
          aria-label="زائد ثانية"
          onClick={() => adjust(1)}
          disabled={!canIncrease}
        >
          <span className="font-mono tabular-nums text-[11.5px] font-extrabold">
            +1
          </span>
        </StepBtn>
      </div>
    </div>
  )
}

function StepBtn({ children, onClick, disabled, ...rest }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onMouseDown={(e) => {
        e.preventDefault()
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onClick()
      }}
      disabled={disabled}
      className="cap-focus-ring inline-flex items-center justify-center min-w-[34px] h-8 px-1.5 text-ink hover:bg-line/60 active:bg-line disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      {...rest}
    >
      {children}
    </button>
  )
}
