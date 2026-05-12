import { useState, useRef } from "react"
import { downloadSRT, downloadFile } from "../utils/srt"
import { friendlyError } from "../utils/errors"
import { getPresetById } from "../utils/stylePresets"

const BACKEND = import.meta.env.VITE_BACKEND_URL

function buildExportPayload(videoUrl, captions, presetId, customStyle = {}) {
  const preset = getPresetById(presetId)

  // Merge preset style with any custom overrides from the style panel
  const mergedStyle = { ...preset.style, ...customStyle }

  // Each caption stays intact as one sentence segment. We pass per-word
  // timing so karaoke / word-by-word animations can target real words.
  const captionPayload = captions.map((c, i) => ({
    id: String(c.id ?? i),
    word: String(c.text ?? c.word ?? "").trim(),
    start: Number(c.start) || 0,
    end: Number(c.end) || 0,
    words: Array.isArray(c.words)
      ? c.words.map((w) => ({
          word: String(w.word ?? "").trim(),
          start: Number(w.start) || 0,
          end: Number(w.end) || 0,
        }))
      : null,
  }))

  return {
    video_url: videoUrl,
    captions: captionPayload,
    style: {
      ...mergedStyle,
      caption_mode: "presplit",
      min_display_time: 0.8,
      timing_offset: 0.0,
    },
  }
}

// Simulates smooth progress from 0→85% during the estimated export time,
// then jumps to 100% when the actual response arrives.
function useProgressSimulator() {
  const [progress, setProgress] = useState(0)
  const timerRef = useRef(null)

  function start(estimatedMs = 30000) {
    setProgress(0)
    const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      // Ease-out curve: approaches 85% asymptotically
      const ratio = elapsed / estimatedMs
      const pct = Math.min(85, Math.round(85 * (1 - Math.exp(-ratio * 2.5))))
      setProgress(pct)
      if (pct < 85) {
        timerRef.current = requestAnimationFrame(tick)
      }
    }
    timerRef.current = requestAnimationFrame(tick)
  }

  function finish() {
    if (timerRef.current) cancelAnimationFrame(timerRef.current)
    setProgress(100)
    // Reset after a short delay so the UI shows 100% briefly
    setTimeout(() => setProgress(0), 1800)
  }

  function reset() {
    if (timerRef.current) cancelAnimationFrame(timerRef.current)
    setProgress(0)
  }

  return { progress, start, finish, reset }
}

export function useExport() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const { progress, start: startProgress, finish: finishProgress, reset: resetProgress } = useProgressSimulator()

  async function exportSRT(captions) {
    setError(null)
    if (!Array.isArray(captions) || captions.length === 0) {
      setError("مفيش كابشن لتصديره")
      return false
    }
    try {
      downloadSRT(captions, "captions.srt")
      return true
    } catch (err) {
      setError(friendlyError(err.message || err))
      return false
    }
  }

  async function exportMP4(videoUrl, captions, presetId = "classic", customStyle = {}) {
    setError(null)
    if (!videoUrl) {
      setError("الفيديو الأصلي مش متاح، ارفعه تاني")
      return false
    }
    if (!Array.isArray(captions) || captions.length === 0) {
      setError("مفيش كابشن لتصديره")
      return false
    }
    if (!BACKEND) {
      setError("إعدادات السيرفر مش مظبوطة")
      return false
    }

    setBusy(true)
    // Estimate ~30s for short videos, up to 90s. We don't know duration here
    // so we use a reasonable default.
    startProgress(45000)

    try {
      const res = await fetch(`${BACKEND}/api/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildExportPayload(videoUrl, captions, presetId, customStyle)),
      })
      if (!res.ok) {
        const data = await safeJson(res)
        throw new Error(data?.detail || "export failed")
      }
      const blob = await res.blob()
      finishProgress()
      downloadFile(blob, "captioned_video.mp4")
      return true
    } catch (err) {
      resetProgress()
      setError(friendlyError(err.message || err))
      return false
    } finally {
      setBusy(false)
    }
  }

  return { exportSRT, exportMP4, busy, error, setError, progress }
}

async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}
