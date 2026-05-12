function pad(value, length = 2) {
  return String(value).padStart(length, "0")
}

function formatSRTTime(seconds) {
  const total = Math.max(0, Number(seconds) || 0)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const wholeSeconds = Math.floor(total % 60)
  const ms = Math.round((total - Math.floor(total)) * 1000)
  return `${pad(hours)}:${pad(minutes)}:${pad(wholeSeconds)},${pad(ms, 3)}`
}

export function generateSRT(captions) {
  if (!Array.isArray(captions) || captions.length === 0) return ""

  return captions
    .map((cap, index) => {
      const startTime = formatSRTTime(cap.start)
      const endTime = formatSRTTime(cap.end)
      const text = String(cap.text ?? cap.word ?? "").trim()
      return `${index + 1}\n${startTime} --> ${endTime}\n${text}\n`
    })
    .join("\n")
}

export function downloadSRT(captions, filename = "captions.srt") {
  const content = generateSRT(captions)
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  triggerDownload(blob, filename)
}

export function downloadFile(blob, filename) {
  triggerDownload(blob, filename)
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
