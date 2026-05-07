/**
 * @typedef {{ id: string, word: string, start: number, end: number }} WordItem
 */

const MIN_SLICE = 0.06
const MIN_GAP = 0.02

export function sortWordsByStart(words) {
  if (!Array.isArray(words)) return []
  return [...words].sort((a, b) => a.start - b.start || a.end - b.end)
}

/**
 * Find word index where time lies strictly inside (with slice margin).
 * @param {WordItem[]} sorted
 * @param {number} time
 */
/** @param {WordItem[]} sorted */
export function findWordIndexForSplit(sorted, time) {
  const t = Number(time)
  if (!Number.isFinite(t)) return -1
  for (let i = 0; i < sorted.length; i++) {
    const w = sorted[i]
    const s = Number(w.start)
    const e = Number(w.end)
    if (t >= s + MIN_SLICE && t <= e - MIN_SLICE) return i
  }
  return -1
}

function splitWordText(raw) {
  const s = String(raw ?? "")
  if (!s.trim()) return ["", ""]
  const mid = Math.max(1, Math.ceil(s.length / 2))
  const a = s.slice(0, mid).trim()
  const b = s.slice(mid).trim()
  if (!a) return [s, s]
  if (!b) return [s, s]
  return [a, b]
}

/**
 * Split the word under `time` into two words at `time`.
 * @param {WordItem[]} words
 * @param {number} time
 * @param {(s: string) => string} newId
 * @param {number} [durationMax]
 * @returns {WordItem[] | null}
 */
export function splitWordAtTime(words, time, newId, durationMax) {
  const sorted = sortWordsByStart(words)
  const idx = findWordIndexForSplit(sorted, time)
  if (idx < 0) return null
  const w = sorted[idx]
  const t = Math.min(
    Math.max(Number(time), Number(w.start) + MIN_SLICE),
    Number(w.end) - MIN_SLICE,
  )
  const [leftText, rightText] = splitWordText(w.word)
  const left = {
    ...w,
    word: leftText,
    start: Number(w.start),
    end: t,
  }
  const right = {
    id: newId(),
    word: rightText,
    start: t,
    end: Number(w.end),
  }
  const others = sorted.filter((_, i) => i !== idx)
  const merged = sortWordsByStart([...others, left, right])
  const cap =
    Number.isFinite(Number(durationMax)) && Number(durationMax) > 0
      ? Number(durationMax)
      : null
  return normalizeWordSequence(merged, cap)
}

/**
 * Clamp word times after drag/resize so segments stay ordered with minimal gaps.
 * @param {WordItem[]} words
 * @param {number} [durationMax] — if finite, last segment end is capped.
 */
export function normalizeWordSequence(words, durationMax) {
  const sorted = sortWordsByStart(words)
  if (sorted.length === 0) return []
  const out = sorted.map((w) => ({ ...w }))
  const cap =
    Number.isFinite(Number(durationMax)) && Number(durationMax) > 0
      ? Number(durationMax)
      : null

  for (let i = 0; i < out.length; i++) {
    let s = Number(out[i].start)
    let e = Number(out[i].end)
    if (!Number.isFinite(s)) s = 0
    if (!Number.isFinite(e)) e = s + MIN_SLICE
    if (e - s < MIN_SLICE) e = s + MIN_SLICE
    if (i > 0) {
      const prevE = out[i - 1].end
      if (s < prevE + MIN_GAP) {
        s = prevE + MIN_GAP
        e = Math.max(e, s + MIN_SLICE)
      }
    }
    out[i].start = s
    out[i].end = e
  }

  if (cap != null) {
    for (let i = out.length - 1; i >= 0; i--) {
      let e = Math.min(Number(out[i].end), cap)
      let s = Math.min(Number(out[i].start), e - MIN_SLICE)
      if (i > 0 && s < out[i - 1].end + MIN_GAP) {
        s = out[i - 1].end + MIN_GAP
        e = Math.max(s + MIN_SLICE, Math.min(e, cap))
      }
      s = Math.max(0, s)
      e = Math.max(s + MIN_SLICE, e)
      out[i].start = s
      out[i].end = e
    }
  }

  return out
}

/**
 * Move entire word by delta seconds; clamp against neighbors and [0, duration].
 * @param {WordItem[]} words
 * @param {string} id
 * @param {number} deltaSec
 * @param {number} duration
 */
export function moveWordByDelta(words, id, deltaSec, duration) {
  const sorted = sortWordsByStart(words)
  const idx = sorted.findIndex((w) => String(w.id) === String(id))
  if (idx < 0) return words

  const w = { ...sorted[idx] }
  const dur = Math.max(MIN_SLICE, w.end - w.start)
  let newStart = w.start + deltaSec
  let newEnd = newStart + dur

  const prev = sorted[idx - 1]
  const next = sorted[idx + 1]
  if (prev) newStart = Math.max(newStart, prev.end + MIN_GAP)
  if (next) newEnd = Math.min(newEnd, next.start - MIN_GAP)
  newStart = Math.max(0, newStart)
  newEnd = Math.min(Number(duration) || Infinity, newEnd)
  if (newEnd - newStart < MIN_SLICE) {
    newEnd = newStart + MIN_SLICE
    if (next && newEnd > next.start - MIN_GAP) {
      newEnd = next.start - MIN_GAP
      newStart = Math.max(prev ? prev.end + MIN_GAP : 0, newEnd - dur)
    }
  }

  const merged = sorted.map((x, i) =>
    i === idx ? { ...x, start: newStart, end: newEnd } : x,
  )
  return normalizeWordSequence(merged, duration)
}

/**
 * Resize from left edge (change start).
 */
export function resizeWordStart(words, id, newStart, duration) {
  const sorted = sortWordsByStart(words)
  const idx = sorted.findIndex((w) => String(w.id) === String(id))
  if (idx < 0) return words
  const w = { ...sorted[idx] }
  const prev = sorted[idx - 1]
  const maxStart = w.end - MIN_SLICE
  let s = Math.min(Number(newStart), maxStart)
  if (prev) s = Math.max(s, prev.end + MIN_GAP)
  s = Math.max(0, s)
  const merged = sorted.map((x, i) => (i === idx ? { ...x, start: s } : x))
  return normalizeWordSequence(merged, duration)
}

/**
 * Resize from right edge (change end).
 */
export function resizeWordEnd(words, id, newEnd, duration) {
  const sorted = sortWordsByStart(words)
  const idx = sorted.findIndex((w) => String(w.id) === String(id))
  if (idx < 0) return words
  const w = { ...sorted[idx] }
  const next = sorted[idx + 1]
  const minEnd = w.start + MIN_SLICE
  let e = Math.max(Number(newEnd), minEnd)
  if (next) e = Math.min(e, next.start - MIN_GAP)
  const dur = Number(duration)
  if (Number.isFinite(dur) && dur > 0) e = Math.min(e, dur)
  const merged = sorted.map((x, i) => (i === idx ? { ...x, end: e } : x))
  return normalizeWordSequence(merged, duration)
}
