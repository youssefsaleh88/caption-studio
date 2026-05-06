import { useState } from "react"

const BACKEND = import.meta.env.VITE_BACKEND_URL

export function useTranscription() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function transcribe(videoUrl, languageHint = "auto") {
    setLoading(true)
    setError(null)
    try {
      if (!BACKEND) {
        throw new Error("VITE_BACKEND_URL is not set.")
      }
      const res = await fetch(`${BACKEND}/api/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_url: videoUrl,
          language_hint: languageHint || "auto",
        }),
      })
      if (!res.ok) {
        let detail = "Transcription failed"
        try {
          const data = await res.json()
          detail = data.detail || detail
        } catch (_) {
          /* ignore body parse error, keep default detail */
        }
        throw new Error(detail)
      }
      const data = await res.json()
      return data.words
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { transcribe, loading, error }
}
