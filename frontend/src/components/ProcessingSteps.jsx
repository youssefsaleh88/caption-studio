const STATES = {
  done: {
    icon: (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    badge: "bg-ok text-white",
    text: "text-ink",
  },
  active: {
    icon: (
      <span className="block w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-[spin-slow_0.9s_linear_infinite]" />
    ),
    badge: "bg-info text-white",
    text: "text-ink font-bold",
  },
  pending: {
    icon: <span className="block w-2 h-2 rounded-full bg-ink-muted" />,
    badge: "bg-line text-ink-muted",
    text: "text-ink-muted",
  },
}

export default function ProcessingSteps({ steps }) {
  return (
    <ul className="space-y-3" aria-label="مراحل المعالجة">
      {steps.map((step) => {
        const state = STATES[step.state] || STATES.pending
        return (
          <li
            key={step.key}
            className="flex items-center gap-3 cap-animate-fade-up"
          >
            <span
              aria-hidden="true"
              className={[
                "inline-flex items-center justify-center w-7 h-7 rounded-full shrink-0",
                state.badge,
              ].join(" ")}
            >
              {state.icon}
            </span>
            <span className={["text-[15px]", state.text].join(" ")}>
              {step.label}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
