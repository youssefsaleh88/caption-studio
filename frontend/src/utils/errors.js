// Map backend / network errors into friendly Arabic messages.
export function friendlyError(raw) {
  const text = String(raw || "").toLowerCase()

  if (!raw) return "حصل خطأ غير متوقع، جرّب تاني 🔄"

  if (text.includes("network") || text.includes("failed to fetch")) {
    return "في مشكلة في الاتصال بالإنترنت، اتأكد ثم جرّب تاني 📶"
  }
  if (text.includes("quota") || text.includes("rate") || text.includes("429")) {
    return "الخدمة مشغولة دلوقتي، استنى لحظة وجرّب تاني ⏳"
  }
  if (text.includes("too large") || text.includes("413")) {
    return "الفيديو كبير شوية، جرّب فيديو أصغر من 500 ميجا 🎞️"
  }
  if (text.includes("unsupported") || text.includes("format")) {
    return "صيغة الفيديو دي مش مدعومة، جرّب MP4 أو MOV 🎬"
  }
  if (text.includes("transcription") || text.includes("gemini")) {
    return "حصلت مشكلة في تفريغ الصوت، جرّب تاني بعد لحظات 🎤"
  }
  if (text.includes("export") || text.includes("ffmpeg")) {
    return "حصلت مشكلة في تجهيز الفيديو النهائي، جرّب تاني 🛠️"
  }

  return typeof raw === "string" ? raw : "حصل خطأ، جرّب تاني 🔄"
}
