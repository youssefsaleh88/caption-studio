import { useState, useEffect, useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"

const STORAGE_KEY = "cap.editorSession"

export function useEditorSession() {
  const location = useLocation()
  const navigate = useNavigate()

  const [session, setSession] = useState(() => {
    // 1. Check location state
    if (location.state?.videoUrl && Array.isArray(location.state?.words)) {
      return {
        videoUrl: location.state.videoUrl,
        words: location.state.words,
      }
    }
    // 2. Check localStorage
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.videoUrl && Array.isArray(parsed.words)) {
            return parsed
          }
        }
      } catch {
        /* ignore */
      }
    }
    return null
  })

  useEffect(() => {
    // Persist changes
    if (session) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      } catch {
        /* ignore */
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* ignore */
      }
    }
  }, [session])

  const clearSession = useCallback(() => {
    setSession(null)
    navigate("/", { replace: true })
  }, [navigate])

  const updateWords = useCallback((newWords) => {
    setSession((prev) => (prev ? { ...prev, words: newWords } : prev))
  }, [])

  return { session, updateWords, clearSession }
}
