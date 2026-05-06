import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { groupIntoSegments, chunkByWindow } from "../utils/captions"

function boundsFromWords(wordIds, wordMap) {
  const ws = wordIds
    .map((id) => wordMap.get(String(id)))
    .filter(Boolean)
  if (!ws.length) return null
  let lo = Infinity
  let hi = -Infinity
  for (const w of ws) {
    lo = Math.min(lo, w.start, w.end)
    hi = Math.max(hi, w.start, w.end)
  }
  const start = Number.isFinite(lo) ? lo : 0
  const end = Number.isFinite(hi) ? Math.max(start + 0.02, hi) : start + 0.02
  return { start, end }
}

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
  const { t, i18n } = useTranslation()
  const [expandedId, setExpandedId] = useState(null)

  const o = Number(timingOffset) || 0

  const wordMap = useMemo(() => {
    const m = new Map()
    for (const w of words) m.set(String(w.id), w)
    return m
  }, [words])

  const segments = useMemo(() => {
    const sliding = style?.caption_mode === "sliding"
    let segs = sliding
      ? chunkByWindow(words, style?.sliding_window ?? 3)
      : groupIntoSegments(words, {
          maxWords: style?.max_words_per_line ?? 6,
          maxDuration: style?.max_segment_duration ?? 3,
        })
    return segs.map((seg) => {
      const b = boundsFromWords(seg.wordIds, wordMap)
      if (b) return { ...seg, start: b.start, end: b.end }
      const s = Math.min(seg.start, seg.end)
      const e = Math.max(seg.start, seg.end)
      return {
        ...seg,
        start: s,
        end: Math.max(s + 0.02, e),
      }
    })
  }, [
    words,
    wordMap,
    style?.caption_mode,
    style?.sliding_window,
    style?.max_words_per_line,
    style?.max_segment_duration,
  ])

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

  const chromeDir = i18n.language?.startsWith("ar") ? "rtl" : "ltr"

  return (
    <div
      className="flex flex-col h-full min-h-0"
      dir={chromeDir}
    >
      <div className="flex items-center justify-between px-1 mb-4 shrink-0 gap-2">
        <h3 className="text-[13px] font-semibold text-white/90 tracking-wide">
          {t("caption.title")}
        </h3>
        <span className="text-xs text-white/45 font-mono tabular-nums shrink-0">
          {words.length} {t("caption.wordsCount")}
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto ps-1 space-y-3 pb-2">
        {segments.map((seg) => {
          const active = segActive(seg)
          const open = expandedId === seg.id
          const tStart = seg.start + o
          const tEnd = seg.end + o
          return (
            <article
              key={seg.id}
              className={[
                "rounded-2xl border transition-all duration-200 overflow-hidden",
                active
                  ? "border-accent/70 bg-gradient-to-br from-accent/15 to-transparent ring-1 ring-accent/25"
                  : "border-white/12 bg-dark-elevated/40 hover:border-white/22",
              ].join(" ")}
            >
              <div className="px-4 py-3.5 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => toggleExpand(seg.id)}
                  className="w-full text-start group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                    <p className="text-[15px] font-medium text-white leading-relaxed flex-1 order-2 sm:order-1">
                      {seg.text || "…"}
                    </p>
                    <div className="flex items-center gap-2 justify-between sm:flex-col sm:items-end sm:gap-1 shrink-0 order-1 sm:order-2">
                      <span className="text-[11px] font-mono tabular-nums text-accent/90 bg-black/35 px-2 py-1 rounded-lg border border-white/10 whitespace-nowrap">
                        {tStart.toFixed(2)} — {tEnd.toFixed(2)}
                        <span className="text-white/40 ms-1">s</span>
                      </span>
                      <span className="text-[11px] text-white/40 sm:text-end">
                        {open ? t("caption.tapCollapse") : t("caption.tapExpand")}
                      </span>
                    </div>
                  </div>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSeek?.(Math.max(0, tStart))}
                    className="text-xs px-4 py-2.5 rounded-xl bg-accent/90 hover:bg-accent text-white font-medium transition-all duration-200 hover:scale-[1.02] min-h-[44px]"
                  >
                    {t("caption.playFromHere")}
                  </button>
                </div>
              </div>

              {open && (
                <div className="px-4 pb-4 pt-1 border-t border-white/10 space-y-4 bg-black/25">
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
