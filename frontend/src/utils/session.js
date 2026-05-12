// Single-tab session for the active video + captions.
// Lives in sessionStorage so it auto-clears when the tab closes.

const SESSION_KEY = "caption_studio_session"

function readAll() {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}")
  } catch {
    return {}
  }
}

function writeAll(next) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
  } catch {
    /* quota or serialization issue — ignore */
  }
}

export const session = {
  get(key) {
    const data = readAll()
    return data?.[key] ?? null
  },
  set(key, value) {
    const current = readAll()
    writeAll({ ...current, [key]: value })
  },
  setMany(patch) {
    const current = readAll()
    writeAll({ ...current, ...patch })
  },
  getAll() {
    return readAll()
  },
  clear() {
    if (typeof window === "undefined") return
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
  },
}

const TIMELINE_GAP_SEC = 0.02
const MIN_SEGMENT_SEC = 0.2

/** Linearly rescale per-word timings when segment start/end change. */
export function rescaleSegmentWords(seg, newStart, newEnd) {
  const oldStart = Number(seg.start)
  const oldEnd = Number(seg.end)
  const oldDur = oldEnd - oldStart
  const newDur = newEnd - newStart
  if (!Array.isArray(seg.words) || oldDur <= 0.0001) return seg.words
  return seg.words.map((w) => ({
    ...w,
    start: newStart + ((Number(w.start) - oldStart) / oldDur) * newDur,
    end: newStart + ((Number(w.end) - oldStart) / oldDur) * newDur,
  }))
}

/**
 * Remove overlaps, keep a tiny gap between segments, preserve order by time.
 * Shifts or trims segment ends so manual review starts from a sane timeline.
 */
export function refineCaptionTimeline(captions) {
  if (!Array.isArray(captions) || captions.length === 0) return []

  const sorted = [...captions].sort((a, b) => Number(a.start) - Number(b.start))
  const out = sorted.map((c) => ({
    ...c,
    start: Number(c.start),
    end: Number(c.end),
    words: Array.isArray(c.words) ? c.words.map((w) => ({ ...w })) : c.words,
  }))

  for (let i = 0; i < out.length; i += 1) {
    let { start, end } = out[i]
    if (end <= start) {
      end = start + MIN_SEGMENT_SEC
      out[i].words = rescaleSegmentWords({ ...out[i], start, end }, start, end)
    }

    if (i > 0) {
      const minStart = out[i - 1].end + TIMELINE_GAP_SEC
      if (start < minStart) {
        const d = minStart - start
        start += d
        end += d
        if (Array.isArray(out[i].words)) {
          out[i].words = out[i].words.map((w) => ({
            ...w,
            start: Number(w.start) + d,
            end: Number(w.end) + d,
          }))
        }
      }
    }
    out[i].start = start
    out[i].end = end
  }

  for (let i = 0; i < out.length - 1; i += 1) {
    const maxEnd = out[i + 1].start - TIMELINE_GAP_SEC
    if (out[i].end > maxEnd) {
      const nextEnd = Math.max(out[i].start + MIN_SEGMENT_SEC, maxEnd)
      out[i].end = nextEnd
      out[i].words = rescaleSegmentWords(out[i], out[i].start, nextEnd)
    }
  }

  return out
}

// Group word-level transcription into sentence cards.
// Break a sentence when: pause, many words, or sentence-ending punctuation.
export function groupWordsToSentences(words) {
  if (!Array.isArray(words) || words.length === 0) return []

  const sorted = [...words].sort((a, b) => Number(a.start) - Number(b.start))
  const sentences = []
  let bucket = []

  const flush = () => {
    if (bucket.length === 0) return
    sentences.push({
      id: cryptoId(),
      text: bucket.map((w) => w.word).join(" ").replace(/\s+/g, " ").trim(),
      start: Number(bucket[0].start),
      end: Number(bucket[bucket.length - 1].end),
      words: bucket.map((w) => ({
        word: String(w.word),
        start: Number(w.start),
        end: Number(w.end),
      })),
    })
    bucket = []
  }

  const endsSentence = (text) => /[.!?؟。…]\s*$/.test(String(text || "").trim())

  for (let i = 0; i < sorted.length; i += 1) {
    const w = sorted[i]
    bucket.push(w)

    const next = sorted[i + 1]
    const pauseSec = next ? Number(next.start) - Number(w.end) : 0
    const longPause = next && pauseSec > 0.55 && bucket.length >= 2
    const longEnough = bucket.length >= 12
    const punctuationBreak = endsSentence(w.word) && bucket.length >= 2
    const isLast = i === sorted.length - 1

    if (longPause || longEnough || punctuationBreak || isLast) {
      flush()
    }
  }

  return refineCaptionTimeline(sentences)
}

function cryptoId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `id_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
}
