import { useRef, useState } from "react"

export default function UploadZone({ onPick, disabled }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  function open() {
    if (!disabled) inputRef.current?.click()
  }

  function handleFiles(files) {
    const file = files?.[0]
    if (file) onPick?.(file)
  }

  return (
    <div
      onClick={open}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        if (!disabled) handleFiles(e.dataTransfer.files)
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
          e.preventDefault()
          open()
        }
      }}
      className={[
        "cap-focus-ring",
        "relative w-full rounded-xl border-2 border-dashed transition-all",
        "flex flex-col items-center justify-center text-center",
        "px-6 py-12 sm:px-8 sm:py-14",
        "select-none",
        dragOver
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-line-strong bg-surface hover:bg-surface-warm hover:border-primary/40",
        disabled ? "opacity-60 pointer-events-none" : "cursor-pointer",
      ].join(" ")}
    >
      <div
        aria-hidden="true"
        className="relative w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ background: "var(--color-primary-gradient)" }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full"
          style={{
            background: "var(--color-primary-gradient)",
            opacity: 0.35,
            animation: "pulse-ring 1.8s ease-out infinite",
          }}
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3v12" />
          <path d="m6 9 6-6 6 6" />
          <path d="M5 21h14" />
        </svg>
      </div>

      <h3 className="text-[18px] font-extrabold text-ink mb-1.5">
        اسحب فيديوهك هنا
      </h3>
      <p className="text-[14px] font-semibold text-ink-soft max-w-[26ch]">
        أو اضغط لاختيار ملف من جهازك
      </p>

      <div className="mt-5 flex items-center flex-wrap justify-center gap-1.5">
        {["MP4", "MOV", "WEBM", "AVI"].map((ext) => (
          <span
            key={ext}
            className="cap-pill bg-surface-warm text-ink-soft border border-line"
          >
            {ext}
          </span>
        ))}
        <span className="cap-pill bg-info-bg text-info">حتى 500MB</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,.avi,.mp4,.mov,.webm,.mkv,.m4v"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
