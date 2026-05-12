import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import HomePage from "./pages/HomePage"
import ProcessPage from "./pages/ProcessPage"
import ReviewPage from "./pages/ReviewPage"
import ExportPage from "./pages/ExportPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/process" element={<ProcessPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
