export default function UploadProgress({ percent }) {
  const value = Math.min(100, Math.max(0, Math.round(percent || 0)))
  return (
    <div className="w-full" aria-live="polite">
      <div className="flex items-center justify-between mb-2 text-[13px] font-bold">
        <span className="text-ink-soft">جاري رفع الفيديو…</span>
        <span className="text-primary tabular-nums">{value}%</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-line overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-200 ease-out"
          style={{
            width: `${value}%`,
            background: "var(--color-primary-gradient)",
          }}
        />
      </div>
    </div>
  )
}
