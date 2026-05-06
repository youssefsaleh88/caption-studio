import { useState } from "react"

const BACKEND = import.meta.env.VITE_BACKEND_URL

const MAX_MB = 200
const ALLOWED = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  "video/avi",
]

export function useVideoUpload() {
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  async function upload(file) {
    setError(null)
    setProgress(0)

    if (!file) {
      setError("No file provided.")
      return null
    }

    const isAllowedType =
      ALLOWED.includes(file.type) ||
      /\.(mp4|mov|webm|avi)$/i.test(file.name || "")
    if (!isAllowedType) {
      setError("Unsupported format. Use MP4, MOV, WEBM or AVI.")
      return null
    }

    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File too large. Max ${MAX_MB}MB.`)
      return null
    }

    if (!BACKEND) {
      setError("VITE_BACKEND_URL is not set.")
      return null
    }

    setUploading(true)
    try {
      const signedRes = await fetch(`${BACKEND}/api/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type || "application/octet-stream",
        }),
      })

      if (!signedRes.ok) {
        let detail = "Could not prepare upload URL."
        try {
          const data = await signedRes.json()
          detail = data.detail || detail
        } catch (_) {
          // keep fallback message
        }
        throw new Error(detail)
      }

      const { upload_url: uploadUrl, video_url: videoUrl } = await signedRes.json()

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open("PUT", uploadUrl, true)
        xhr.setRequestHeader(
          "Content-Type",
          file.type || "application/octet-stream",
        )

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return
          const pct = Math.round((event.loaded / event.total) * 100)
          setProgress(pct)
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error(`Upload failed with status ${xhr.status}`))
        }

        xhr.onerror = () => reject(new Error("Network error during upload."))
        xhr.send(file)
      })

      setProgress(100)
      return videoUrl
    } catch (err) {
      setError(err.message || "Upload failed.")
      return null
    } finally {
      setUploading(false)
    }
  }

  return { upload, progress, uploading, error }
}
