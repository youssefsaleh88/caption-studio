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

// Group word-level transcription into sentence cards.
// Break a sentence when: long pause (>0.5s), 10+ words, or sentence-ending punctuation.
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
    const longPause = next && Number(next.start) - Number(w.end) > 0.5
    const longEnough = bucket.length >= 10
    const punctuationBreak = endsSentence(w.word) && bucket.length >= 3
    const isLast = i === sorted.length - 1

    if (longPause || longEnough || punctuationBreak || isLast) {
      flush()
    }
  }

  return sentences
}

function cryptoId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `id_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
}
