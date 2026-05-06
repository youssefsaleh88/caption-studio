import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { groupIntoSegments, chunkByWindow } from "../utils/captions"

/**
 * @typedef {{ id: string, word: string, start: number, end: number }} WordItem
 */

export default function CaptionEditor({
  words,
  style,
  currentTime,
  timingOffset = 0,
  onSeek,
  onPatchWord,
  onPatchSegment,
  onDelete,
  onAddAfter,
}) {
  const { t } = useTranslation()
  const [expandedId, setExpandedId] = useState(null)

  const o = Number(timingOffset) || 0

  const segments = useMemo(() => {
    const sliding = style?.caption_mode === "sliding"
    if (sliding) {
      return chunkByWindow(words, style?.sliding_window ?? 3)
    }
    return groupIntoSegments(words, {
      maxWords: style?.max_words_per_line ?? 6,
      maxDuration: style?.max_segment_duration ?? 3,
    })
  }, [
    words,
    style?.caption_mode,
    style?.sliding_window,
    style?.max_words_per_line,
    style?.max_segment_duration,
  ])

  const wordMap = useMemo(() => {
    const m = new Map()
    for (const w of words) m.set(String(w.id), w)
    return m
  }, [words])

  function segActive(seg) {
    const t0 = currentTime
    return t0 >= seg.start + o && t0 <= seg.end + o
  }

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  function handleSentenceTimes(seg, field, value) {
    const num = Number(value)
    if (Number.isNaN(num)) return
    const raw = num - o
    const ids = seg.wordIds.map(String)
    if (field === "start") {
      onPatchSegment(ids, { start: raw })
    } else {
      onPatchSegment(ids, { end: raw })
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-1 mb-3 shrink-0">
        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
          {t("caption.title")}
        </h3>
        <span className="text-xs text-white/40 font-mono">
          {words.length} {t("caption.wordsCount")}
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3 pb-2">
        {segments.map((seg) => {
          const active = segActive(seg)
          const open = expandedId === seg.id
          return (
            <article
              key={seg.id}
              className={[
                "rounded-2xl border transition-all duration-200",
                active
                  ? "border-accent/80 bg-accent/10 shadow-lg shadow-accent/10"
                  : "border-white/10 bg-dark-surface/50 hover:border-white/20",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => toggleExpand(seg.id)}
                className="w-full text-left px-4 py-3 flex flex-col gap-1"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] font-medium text-white/95 leading-snug flex-1">
                    {seg.text || "…"}
                  </p>
                  <span className="text-[10px] font-mono text-white/45 shrink-0 pt-0.5">
                    {(seg.start + o).toFixed(2)} → {(seg.end + o).toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSeek?.(Math.max(0, seg.start + o))
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/90 transition-all duration-200"
                  >
                    {t("caption.playFromHere")}
                  </button>
                  <span className="text-[11px] text-white/35">
                    {open ? "−" : "+"}
                  </span>
                </div>
              </button>

              {open && (
                <div className="px-4 pb-4 pt-0 border-t border-white/5 space-y-4">
                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <label className="block">
                      <span className="text-[11px] text-white/50 uppercase tracking-wide block mb-1">
                        {t("caption.sentenceStart")}
                      </span>
                      <input
                        type="number"
                        step={0.05}
                        min={0}
                        value={Number(seg.start + o).toFixed(2)}
                        onChange={(e) =>
                          handleSentenceTimes(seg, "start", e.target.value)
                        }
                        className="w-full bg-dark px-3 py-2.5 rounded-xl border border-white/10 text-sm text-white outline-none focus:border-accent min-h-[44px]"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[11px] text-white/50 uppercase tracking-wide block mb-1">
                        {t("caption.sentenceEnd")}
                      </span>
                      <input
                        type="number"
                        step={0.05}
                        min={0}
                        value={Number(seg.end + o).toFixed(2)}
                        onChange={(e) =>
                          handleSentenceTimes(seg, "end", e.target.value)
                        }
                        className="w-full bg-dark px-3 py-2.5 rounded-xl border border-white/10 text-sm text-white outline-none focus:border-accent min-h-[44px]"
                      />
                    </label>
                  </div>

                  <div className="space-y-2">
                    {seg.wordIds.map((wid) => {
                      const w = wordMap.get(String(wid))
                      if (!w) return null
                      return (
                        <div
                          key={wid}
                          className="rounded-xl border border-white/8 bg-dark/80 p-3 space-y-2"
                        >
                          <input
                            type="text"
                            value={w.word}
                            onChange={(e) =>
                              onPatchWord(w.id, { word: e.target.value })
                            }
                            placeholder={t("caption.editText")}
                            className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent"
                          />
                          <div className="flex flex-wrap gap-2 items-end">
                            <label className="flex-1 min-w-[100px]">
                              <span className="text-[10px] text-white/45 block mb-0.5">
                                {t("caption.wordStart")}
                              </span>
                              <input
                                type="number"
                                step={0.05}
                                min={0}
                                value={Number(w.start + o).toFixed(2)}
                                onChange={(e) => {
                                  const v = Number(e.target.value)
                                  if (!Number.isNaN(v))
                                    onPatchWord(w.id, {
                                      start: v - o,
                                    })
                                }}
                                className="w-full bg-dark px-2 py-2 rounded-lg border border-white/10 text-xs font-mono min-h-[40px]"
                              />
                            </label>
                            <label className="flex-1 min-w-[100px]">
                              <span className="text-[10px] text-white/45 block mb-0.5">
                                {t("caption.wordEnd")}
                              </span>
                              <input
                                type="number"
                                step={0.05}
                                min={0}
                                value={Number(w.end + o).toFixed(2)}
                                onChange={(e) => {
                                  const v = Number(e.target.value)
                                  if (!Number.isNaN(v))
                                    onPatchWord(w.id, { end: v - o })
                                }}
                                className="w-full bg-dark px-2 py-2 rounded-lg border border-white/10 text-xs font-mono min-h-[40px]"
                              />
                            </label>
                            <div className="flex gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => onAddAfter(w.id)}
                                className="px-3 py-2 rounded-lg bg-white/8 hover:bg-white/12 text-xs min-h-[40px]"
                                title={t("caption.addAfterTitle")}
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => onDelete(w.id)}
                                className="px-3 py-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-200 text-xs min-h-[40px]"
                                title={t("caption.deleteTitle")}
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </article>
          )
        })}

        {words.length === 0 && (
          <div className="text-sm text-white/40 px-2 py-6 text-center">
            {t("caption.noCaptions")}
          </div>
        )}
      </div>
    </div>
  )
}
