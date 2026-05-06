function toSrtTime(seconds) {
  const total = Math.max(0, Number(seconds) || 0)
  const hh = String(Math.floor(total / 3600)).padStart(2, "0")
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0")
  const ss = String(Math.floor(total % 60)).padStart(2, "0")
  const ms = String(Math.round((total - Math.floor(total)) * 1000)).padStart(3, "0")
  return `${hh}:${mm}:${ss},${ms}`
}

export function generateSRT(words) {
  if (!Array.isArray(words) || words.length === 0) return ""
  return words
    .map(
      (w, i) =>
        `${i + 1}\n${toSrtTime(w.start)} --> ${toSrtTime(w.end)}\n${w.word}\n`,
    )
    .join("\n")
}

export function downloadSRT(words, filename = "captions.srt") {
  const content = generateSRT(words)
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
