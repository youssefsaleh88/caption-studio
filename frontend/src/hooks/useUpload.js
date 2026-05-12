import { useState } from "react"
import { friendlyError } from "../utils/errors"

const BACKEND = import.meta.env.VITE_BACKEND_URL
const MAX_MB = 500
const ALLOWED_EXT = /\.(mp4|mov|webm|avi|m4v|mkv)$/i
const ALLOWED_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  "video/avi",
  "video/x-matroska",
]

export function useUpload() {
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  function validate(file) {
    if (!file) return "اختار فيديو الأول 🎬"
    if (!BACKEND) return "إعدادات السيرفر مش مظبوطة، راجع VITE_BACKEND_URL"

    const typeOk =
      (file.type && ALLOWED_TYPES.includes(file.type)) ||
      ALLOWED_EXT.test(file.name || "")
    if (!typeOk) return "صيغة الفيديو دي مش مدعومة، جرّب MP4 أو MOV 🎬"

    if (file.size > MAX_MB * 1024 * 1024) {
      return `الفيديو كبير شوية، الحد الأقصى ${MAX_MB} ميجا 🎞️`
    }
    return null
  }

  async function upload(file) {
    setError(null)
    setProgress(0)

    const invalid = validate(file)
    if (invalid) {
      setError(invalid)
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
        const data = await safeJson(signedRes)
        throw new Error(data?.detail || "Could not prepare upload URL")
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
          setProgress(Math.round((event.loaded / event.total) * 100))
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error(`Upload failed with status ${xhr.status}`))
        }
        xhr.onerror = () => reject(new Error("network error during upload"))
        xhr.send(file)
      })

      setProgress(100)
      return videoUrl
    } catch (err) {
      setError(friendlyError(err.message || err))
      return null
    } finally {
      setUploading(false)
    }
  }

  return { upload, progress, uploading, error, setError }
}

async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}
