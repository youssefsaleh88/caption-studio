import { useState } from "react"
import { friendlyError } from "../utils/errors"

const BACKEND = import.meta.env.VITE_BACKEND_URL

export function useTranscribe() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function transcribe(videoUrl) {
    setLoading(true)
    setError(null)
    try {
      if (!BACKEND) throw new Error("VITE_BACKEND_URL is not set")
      const res = await fetch(`${BACKEND}/api/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_url: videoUrl,
          language_hint: "auto",
        }),
      })
      if (!res.ok) {
        const data = await safeJson(res)
        throw new Error(data?.detail || "transcription failed")
      }
      const data = await res.json()
      if (data?.error) {
        throw new Error(data.error)
      }
      return Array.isArray(data?.words) ? data.words : []
    } catch (err) {
      setError(friendlyError(err.message || err))
      return null
    } finally {
      setLoading(false)
    }
  }

  return { transcribe, loading, error, setError }
}

async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}
