export function formatTime(seconds) {
  const total = Math.max(0, Number(seconds) || 0)
  const minutes = Math.floor(total / 60)
  const secs = Math.floor(total % 60)
  return `${minutes}:${String(secs).padStart(2, "0")}`
}

export function formatDuration(seconds) {
  const total = Math.max(0, Number(seconds) || 0)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = Math.floor(total % 60)
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`
}
