import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Editor from "./pages/Editor"
import EditorDemoGate from "./pages/EditorDemoGate"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor/demo" element={<EditorDemoGate />} />
        <Route path="/editor" element={<Editor />} />
      </Routes>
    </BrowserRouter>
  )
}
