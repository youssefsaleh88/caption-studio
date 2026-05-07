export default function SettingCard({ title, children, className = "" }) {
  return (
    <section
      className={`rounded-[var(--radius-card)] bg-[var(--bg-card)] border border-[var(--border-subtle)] p-[var(--space-md)] ${className}`}
    >
      {title ? (
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
          {title}
        </h3>
      ) : null}
      {children}
    </section>
  )
}
