import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { sortWordsByStart } from "../../utils/timelineUtils"

function formatT(sec) {
  const s = Math.max(0, Number(sec) || 0)
  const m = Math.floor(s / 60)
  const r = s - m * 60
  return `${m}:${r.toFixed(2).padStart(5, "0")}`
}

export default function WordListStrip({
  words,
  selectedWordId,
  onPickWord,
}) {
  const { t } = useTranslation()
  const sorted = useMemo(() => sortWordsByStart(words), [words])

  return (
    <details className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)]/70 bg-[var(--bg-base)]/60 text-[var(--text-primary)] overflow-hidden">
      <summary className="cursor-pointer select-none list-none px-3 py-2.5 text-xs font-semibold text-[var(--accent-bright)] hover:bg-[var(--accent)]/10 [&::-webkit-details-marker]:hidden flex items-center justify-between gap-2">
        <span>{t("studio.wordList.title")}</span>
        <span className="text-[10px] font-mono text-[var(--text-muted)]">
          {sorted.length}
        </span>
      </summary>
      <ul className="max-h-[min(200px,32vh)] overflow-y-auto overscroll-contain border-t border-[var(--border-subtle)]/50 px-1 py-1 space-y-0.5">
        {sorted.map((w) => {
          const isSel = String(w.id) === String(selectedWordId)
          return (
            <li key={w.id}>
              <button
                type="button"
                onClick={() => onPickWord?.(w.id)}
                className={[
                  "cap-focus-visible w-full text-start rounded-[var(--radius-sm)] px-2 py-2.5 min-h-[44px] border transition-colors",
                  isSel
                    ? "border-[var(--accent-bright)] bg-[var(--accent)]/15"
                    : "border-transparent hover:border-[var(--accent)]/30 hover:bg-[var(--bg-card)]",
                ].join(" ")}
              >
                <span className="block text-[10px] font-mono tabular-nums text-[var(--text-muted)]">
                  {formatT(w.start)} – {formatT(w.end)}
                </span>
                <span className="block text-sm font-medium text-[var(--text-primary)] leading-snug mt-0.5 line-clamp-2">
                  {w.word || "…"}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </details>
  )
}
