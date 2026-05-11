import { Suspense, lazy } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Home from "./pages/Home"
import MobileEditorPage from "./pages/MobileEditorPage"

const AdvancedEditorPage = lazy(() => import("./pages/AdvancedEditorPage"))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/review" element={<MobileEditorPage />} />
        <Route
          path="/editor"
          element={
            <Suspense fallback={<div className="h-screen bg-[var(--editor-rail)]" />}>
              <AdvancedEditorPage />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
