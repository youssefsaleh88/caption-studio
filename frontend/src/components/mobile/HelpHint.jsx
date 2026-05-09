export default function HelpHint({ text }) {
  if (!text) return null
  return (
    <p className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-card)]/75 px-3 py-2 text-sm leading-relaxed text-[var(--text-secondary)]">
      {text}
    </p>
  )
}

