import UploadZone from "../UploadZone"
import HelpHint from "./HelpHint"

export default function StepUpload() {
  return (
    <div className="space-y-3">
      <HelpHint text="اختار فيديو واحد، واحنا هنحوّل الكلام المكتوب تلقائيًا خلال دقيقة تقريبًا." />
      <UploadZone />
    </div>
  )
}

