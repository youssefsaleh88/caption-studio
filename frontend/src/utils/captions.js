/**
 * @typedef {{ id: string, word: string, start: number, end: number }} WordItem
 * @typedef {{ id: string, text: string, start: number, end: number, wordIds: string[] }} Segment
 */

const DEFAULT_GAP = 0.35

function endsWithSentencePunctuation(text) {
  return /[.!?؟。]$/.test(String(text).trim())
}

/**
 * Group word-level captions into sentence-like segments.
 * @param {WordItem[]} words
 * @param {{ maxWords?: number, maxDuration?: number, gapThreshold?: number }} opts
 * @returns {Segment[]}
 */
export function groupIntoSegments(words, opts = {}) {
  if (!Array.isArray(words) || words.length === 0) return []

  const maxWords = Math.max(1, Number(opts.maxWords) || 6)
  const maxDuration = Math.max(0.5, Number(opts.maxDuration) || 3)
  const gapThreshold = Number(opts.gapThreshold)
    ? Number(opts.gapThreshold)
    : DEFAULT_GAP

  const sorted = [...words].sort((a, b) => a.start - b.start)

  /** @type {Segment[]} */
  const segments = []
  let bucket = []
  let bucketStart = null

  function flushBucket() {
    if (bucket.length === 0) return
    const start = bucketStart ?? bucket[0].start
    const end = bucket[bucket.length - 1].end
    const text = bucket.map((w) => w.word).join(" ").trim()
    const wordIds = bucket.map((w) => String(w.id))
    segments.push({
      id: `seg-${segments.length}`,
      text,
      start,
      end,
      wordIds,
    })
    bucket = []
    bucketStart = null
  }

  for (let i = 0; i < sorted.length; i++) {
    const w = sorted[i]
    const prev = sorted[i - 1]

    if (bucket.length === 0) {
      bucket.push(w)
      bucketStart = w.start
      continue
    }

    const gap = w.start - prev.end
    const durSoFar = w.end - bucketStart
    const wordsSoFar = bucket.length

    const breakForGap = gap > gapThreshold
    const breakForDuration = durSoFar > maxDuration
    const breakForWords = wordsSoFar >= maxWords
    const breakForPunct = endsWithSentencePunctuation(prev.word)

    if (breakForGap || breakForDuration || breakForWords || breakForPunct) {
      flushBucket()
      bucket.push(w)
      bucketStart = w.start
    } else {
      bucket.push(w)
    }
  }

  flushBucket()
  return segments
}

/**
 * Apply timing offset (seconds) to word timings; clamps start/end >= 0.
 * @param {WordItem[]} words
 * @param {number} offsetSec
 */
export function applyTimingOffsetToWords(words, offsetSec) {
  const o = Number(offsetSec) || 0
  return words.map((w) => {
    const s = Math.max(0, w.start + o)
    const e = Math.max(s, w.end + o)
    return { ...w, start: s, end: e }
  })
}

/**
 * Apply timing offset to segments.
 * @param {Segment[]} segments
 * @param {number} offsetSec
 */
export function applyTimingOffsetToSegments(segments, offsetSec) {
  const o = Number(offsetSec) || 0
  return segments.map((seg) => {
    const s = Math.max(0, seg.start + o)
    const e = Math.max(s, seg.end + o)
    return { ...seg, start: s, end: e }
  })
}

/**
 * Find active word index at time t (after optional offset applied on words).
 * @param {WordItem[]} words sorted by start preferred
 * @param {number} t
 */
export function findActiveWordIndex(words, t) {
  if (!words.length) return -1
  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    if (t >= w.start && t <= w.end) return i
  }
  let best = -1
  let bestDist = Infinity
  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    const mid = (w.start + w.end) / 2
    const dist = Math.abs(t - mid)
    if (dist < bestDist) {
      bestDist = dist
      best = i
    }
  }
  return best
}

/**
 * Sliding window text around anchor index.
 * @param {WordItem[]} words
 * @param {number} anchorIndex
 * @param {number} windowSize
 */
export function slidingWindowText(words, anchorIndex, windowSize) {
  const n = words.length
  const ws = Math.max(1, Math.min(7, Math.floor(Number(windowSize) || 3)))
  if (n === 0 || anchorIndex < 0) return ""
  const i = Math.min(Math.max(anchorIndex, 0), n - 1)
  let left = Math.max(0, i - Math.floor((ws - 1) / 2))
  let right = Math.min(n - 1, left + ws - 1)
  left = Math.max(0, right - ws + 1)
  const slice = words.slice(left, right + 1)
  return slice.map((w) => w.word).join(" ").trim()
}

/**
 * Non-overlapping word chunks of fixed size (for sliding/caption-chunk mode).
 * @param {WordItem[]} words
 * @param {number} windowSize
 * @returns {Segment[]}
 */
export function chunkByWindow(words, windowSize) {
  if (!Array.isArray(words) || words.length === 0) return []
  const ws = Math.max(1, Math.min(7, Math.floor(Number(windowSize) || 3)))
  const sorted = [...words].sort((a, b) => a.start - b.start)
  /** @type {Segment[]} */
  const chunks = []
  for (let i = 0; i < sorted.length; i += ws) {
    const slice = sorted.slice(i, i + ws)
    const text = slice.map((w) => w.word).join(" ").trim()
    const start = slice[0].start
    const end = slice[slice.length - 1].end
    const wordIds = slice.map((w) => String(w.id))
    chunks.push({
      id: `chunk-${chunks.length}`,
      text,
      start,
      end,
      wordIds,
    })
  }
  return chunks
}

/**
 * Extend each segment's end to at least start + minSec, capped at the next segment's start.
 * @param {{ start: number, end: number, text?: string }[]} segments
 * @param {number} minSec
 */
export function applyMinDisplayTime(segments, minSec) {
  const min = Math.max(0, Number(minSec) || 0)
  if (!Array.isArray(segments) || segments.length === 0 || min <= 0) {
    return segments ? [...segments] : []
  }
  const sorted = [...segments].sort((a, b) => a.start - b.start)
  return sorted.map((seg, i) => {
    const nextStart =
      i + 1 < sorted.length ? sorted[i + 1].start : Infinity
    const s = seg.start
    const rawEnd = seg.end
    const desiredEnd = Math.max(rawEnd, s + min)
    const end = Math.min(desiredEnd, nextStart)
    return {
      ...seg,
      end: Math.max(s, end),
    }
  })
}
