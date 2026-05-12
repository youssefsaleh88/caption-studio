import { useState } from "react"
import { downloadSRT, downloadFile } from "../utils/srt"
import { friendlyError } from "../utils/errors"

const BACKEND = import.meta.env.VITE_BACKEND_URL

function buildExportPayload(videoUrl, captions) {
  // Map each sentence to the backend caption schema:
  // backend expects [{ id, word, start, end }] and groups via max_words_per_line.
  // We send sentence text in `word` and force max_words_per_line=1 so the backend
  // keeps each sentence intact as one segment.
  const captionPayload = captions.map((c, i) => ({
    id: String(c.id ?? i),
    word: String(c.text ?? c.word ?? "").trim(),
    start: Number(c.start) || 0,
    end: Number(c.end) || 0,
  }))

  return {
    video_url: videoUrl,
    captions: captionPayload,
    style: {
      font_size_pct: 5.5,
      color: "white",
      bg_enabled: true,
      bg_color: "black",
      bg_opacity: 0.55,
      shadow: 2,
      position: "bottom-center",
      outline_enabled: true,
      outline_color: "#000000",
      caption_mode: "sentences",
      max_words_per_line: 1,
      max_segment_duration: 6.0,
      min_display_time: 0.8,
      timing_offset: 0.0,
      caption_animation: "none",
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

  async function exportMP4(videoUrl, captions) {
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
        body: JSON.stringify(buildExportPayload(videoUrl, captions)),
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
