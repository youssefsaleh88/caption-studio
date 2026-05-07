/** بيانات عرض لفتح `/editor/demo` بالتطوير — لقطات مراجعة تصميم واختبار الواجهة دون الخادم. */

export const EDITOR_DEMO_VIDEO_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"

/** كلمات تغطي بداية العيّنة (~15 ث) لتعبئة قائمة الجمل بدون تشغيل خادم. */
export const EDITOR_DEMO_WORDS = [
  { id: "d1", word: "Caption", start: 0, end: 0.42 },
  { id: "d2", word: "Studio", start: 0.46, end: 0.88 },
  { id: "d3", word: "demo", start: 0.92, end: 1.36 },
  { id: "d4", word: "—", start: 1.4, end: 1.55 },
  { id: "d5", word: "سطر", start: 1.6, end: 1.94 },
  { id: "d6", word: "تجربة", start: 2, end: 2.45 },
  { id: "d7", word: "للمراجعات", start: 2.5, end: 3.05 },
  { id: "d8", word: "المرئية", start: 3.1, end: 3.55 },
  { id: "d9", word: ".", start: 3.6, end: 3.75 },
  { id: "d10", word: "Font", start: 4, end: 4.42 },
  { id: "d11", word: "&", start: 4.46, end: 4.58 },
  { id: "d12", word: "export", start: 4.62, end: 5.1 },
  { id: "d13", word: "flow", start: 5.14, end: 5.55 },
  { id: "d14", word: "يُحمَّل", start: 5.62, end: 6.12 },
  { id: "d15", word: "هنا", start: 6.16, end: 6.5 },
]

export const EDITOR_DEMO_NAV_STATE = {
  videoUrl: EDITOR_DEMO_VIDEO_URL,
  words: EDITOR_DEMO_WORDS,
}
