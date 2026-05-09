import { useState } from "react"
import ActionBar from "../studio/ActionBar"
import HelpHint from "./HelpHint"

export default function StepExport({
  words,
  videoUrl,
  style,
  onDownloadSrt,
  exportAnchorId,
}) {
  const [done, setDone] = useState(false)

  return (
    <div className="space-y-3">
      <HelpHint text="اضغط تصدير، واستنى لحد ما التحميل يبدأ. غالبا العملية بتاخد دقيقة أو دقيقتين." />
      {done ? (
        <div className="rounded-[var(--radius-card)] border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          تم التصدير بنجاح. تقدر تشارك الفيديو مباشرة.
        </div>
      ) : null}
      <ActionBar
        embedded
        exportAnchorId={exportAnchorId}
        words={words}
        videoUrl={videoUrl}
        style={style}
        onDownloadSrt={onDownloadSrt}
        onExportSuccess={() => setDone(true)}
      />
    </div>
  )
}

