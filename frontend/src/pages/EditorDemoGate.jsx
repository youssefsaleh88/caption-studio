import { Navigate } from "react-router-dom"

import {
  EDITOR_DEMO_NAV_STATE,
} from "../demo/editorDemoState"

/** خارج وضع التطوير يُرمى للرئيسية حتى لا تُنشَر جلسة عرض عمومية عن طريق الخطأ. */
export default function EditorDemoGate() {
  if (!import.meta.env.DEV) {
    return <Navigate to="/" replace />
  }
  return <Navigate to="/editor" replace state={EDITOR_DEMO_NAV_STATE} />
}
