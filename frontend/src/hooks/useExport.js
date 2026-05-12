import { useState } from "react"
import { downloadSRT, downloadFile } from "../utils/srt"
import { friendlyError } from "../utils/errors"
import { getPresetById } from "../utils/stylePresets"

const BACKEND = import.meta.env.VITE_BACKEND_URL

function buildExportPayload(videoUrl, captions, presetId) {
  const preset = getPresetById(presetId)

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
      ...preset.style,
      caption_mode: "presplit",
      min_display_time: 0.8,
      timing_offset: 0.0,
    },
  }
}

export function useExport() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

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

  async function exportMP4(videoUrl, captions, presetId = "classic") {
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
    try {
      const res = await fetch(`${BACKEND}/api/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildExportPayload(videoUrl, captions, presetId)),
      })
      if (!res.ok) {
        const data = await safeJson(res)
        throw new Error(data?.detail || "export failed")
      }
      const blob = await res.blob()
      downloadFile(blob, "captioned_video.mp4")
      return true
    } catch (err) {
      setError(friendlyError(err.message || err))
      return false
    } finally {
      setBusy(false)
    }
  }

  return { exportSRT, exportMP4, busy, error, setError }
}

async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}
