import { useEffect, useRef, useState } from "react"

function formatNum(value) {
  const v = Math.max(0, Number(value) || 0)
  const rounded = Math.round(v * 1000) / 1000
  const s = rounded.toFixed(3).replace(/\.?0+$/, "")
  return s || "0"
}

export default function TimeStepper({
  label,
  value,
  onChange,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  stepLarge = 1,
  stepSmall = 0.1,
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
    const rounded = Math.round(clamped * 1000) / 1000
    if (Math.abs(rounded - Number(value)) > 0.0005) onChange(rounded)
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

  const canDecrease = Number(value) > min + 0.0005
  const canIncrease = Number(value) < max - 0.0005

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[11px] font-extrabold text-ink-soft shrink-0 w-10">
          {label}
        </span>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-1">
          <StepBtn
            aria-label={`ناقص ${stepLarge} ثانية`}
            onClick={() => adjust(-stepLarge)}
            disabled={!canDecrease || Number(value) - min < stepLarge - 0.0005}
          >
            <span className="font-mono tabular-nums text-[11px] font-extrabold">−{stepLarge}</span>
          </StepBtn>
          <StepBtn
            aria-label={`ناقص ${stepSmall} ثانية`}
            onClick={() => adjust(-stepSmall)}
            disabled={!canDecrease}
          >
            <span className="font-mono tabular-nums text-[11px] font-extrabold">−{stepSmall}</span>
          </StepBtn>
          <div className="flex items-center bg-surface-warm border border-line rounded-md overflow-hidden shrink-0 h-9">
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
              className="cap-focus-ring font-mono tabular-nums text-[13px] font-bold text-ink bg-transparent text-center outline-none w-[64px] h-9 px-1"
            />
            <span className="font-mono text-[10.5px] font-bold text-ink-soft pe-1.5 select-none pointer-events-none">
              ث
            </span>
          </div>
          <StepBtn aria-label={`زائد ${stepSmall} ثانية`} onClick={() => adjust(stepSmall)} disabled={!canIncrease}>
            <span className="font-mono tabular-nums text-[11px] font-extrabold">+{stepSmall}</span>
          </StepBtn>
          <StepBtn
            aria-label={`زائد ${stepLarge} ثانية`}
            onClick={() => adjust(stepLarge)}
            disabled={!canIncrease || max - Number(value) < stepLarge - 0.0005}
          >
            <span className="font-mono tabular-nums text-[11px] font-extrabold">+{stepLarge}</span>
          </StepBtn>
        </div>
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
      className="cap-focus-ring inline-flex items-center justify-center min-h-9 min-w-[38px] px-1.5 rounded-md border border-line bg-surface text-ink hover:bg-line/50 active:bg-line/70 disabled:opacity-30 disabled:hover:bg-surface transition-colors"
      {...rest}
    >
      {children}
    </button>
  )
}
