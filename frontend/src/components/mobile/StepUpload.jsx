import { useTranslation } from "react-i18next"
import UploadZone from "../UploadZone"
import HelpHint from "./HelpHint"

export default function StepUpload() {
  const { t } = useTranslation()
  return (
    <div className="space-y-3">
      <HelpHint text={t("mobile.uploadHelp")} />
      <UploadZone />
    </div>
  )
}

