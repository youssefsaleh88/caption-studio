import { useTranslation } from "react-i18next"
import HelpHint from "./HelpHint"

function groupWords(words) {
  const out = []
  let chunk = []
  for (const w of words) {
    chunk.push(w)
    if (chunk.length >= 7) {
      out.push(chunk)
      chunk = []
    }
  }
  if (chunk.length) out.push(chunk)
  return out
}

export default function StepReview({
  words,
  selectedWordId,
  onPickWord,
  onPlayPause,
}) {
  const { t } = useTranslation()
  const groups = groupWords(words)

  return (
    <div className="space-y-3">
      <HelpHint text={t("mobile.reviewHelp")} />
      <button
        type="button"
        onClick={onPlayPause}
        className="cap-focus-visible min-h-[48px] w-full rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 text-sm font-semibold text-[var(--text-primary)]"
      >
        {t("mobile.playPause")}
      </button>

      <div className="space-y-2">
        {groups.map((sentence, idx) => (
          <div
            key={`g-${idx}`}
            className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3"
          >
            <div className="flex flex-wrap gap-1.5">
              {sentence.map((w) => {
                const selected = String(w.id) === String(selectedWordId)
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => onPickWord?.(w.id)}
                    className={[
                      "cap-focus-visible rounded-[var(--radius-sm)] px-2.5 py-1.5 text-sm transition-colors",
                      selected
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--bg-surface)] text-[var(--text-primary)]",
                    ].join(" ")}
                  >
                    {w.word || "…"}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

