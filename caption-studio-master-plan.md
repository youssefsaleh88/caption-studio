# Caption Studio — Master Merged Review & Roadmap

_Merged on: 2026-05-11_

---

## 0) مقدمة وملخص تنفيذي

Caption Studio منتج شغال End-to-End لإنشاء الكابشن العربي: رفع الفيديو، تفريغ بالكلمات مع التوقيت، مراجعة وتعديل، ثم تصدير SRT أو MP4 بحرق الكابشن. سلسلة الـ backend قوية ومنفذة بشكل صحيح، لكن الفجوة الأساسية الآن هي Product/UX fit: الواجهة الحالية أقرب لأداة Power Users (نمط CapCut/DaVinci) بينما المستخدم الأساسي أستاذ غير تقني على الموبايل.

النتيجة: المطلوب ليس إعادة كتابة المحرك، بل بناء تدفق بسيط فوقه، مع فصل واضح بين:

- Core Flow بسيط للمستخدم الأساسي (Mobile-first)
- Advanced Editor كامل للمستخدم المتقدم (Desktop-first)

الحكم النهائي الذي يلخص الدمج:

> المحرك ممتاز. ابنِ كابينة قيادة أبسط له.

---

## 1) ماهية المشروع والحالة الحالية

### 1.1 التدفّق التشغيلي الفعلي الآن

1. المستخدم يفتح `/` ويرفع فيديو.
2. `UploadZone` يطلب `POST /api/upload-url` ثم يرفع الفيديو عبر presigned PUT URL.
3. الواجهة ترسل `POST /api/transcribe` برابط الفيديو ولغة hint.
4. الـ backend ينزّل الفيديو، يستخرج الصوت بـ FFmpeg، ثم يرسله لـ Gemini ويرجع قائمة كلمات `{word,start,end}`.
5. الواجهة تنتقل إلى `/editor` بـ `location.state` وتحمل `videoUrl + words`.
6. المستخدم يعدل النص/الستايل.
7. التصدير:
   - SRT من الواجهة (`utils/srtExport.js`)
   - MP4 محروق كابشن عبر `POST /api/export` ثم ASS + FFmpeg.

### 1.2 تعريف المشروع المختصر

تطبيق جلسة واحدة:

- Upload video
- Auto transcription
- Quick caption editing
- Export SRT / MP4

### 1.3 Stack (الحالة الأحدث المعتمدة)

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind + react-router-dom + i18next |
| Backend | FastAPI + Uvicorn + google-generativeai + ffmpeg-python + httpx + boto3 |
| Storage | Cloudflare R2 |
| AI | Gemini (2.0 Flash + fallback chain) |
| Hosting | CORS حالياً localhost + netlify domains |

### 1.4 ما هو جيد / ما هو غير مناسب

**جيد:**

- فصل backend services منطقي (`gemini`, `ffmpeg`, `r2`, `ass_subtitles`)
- فصل hooks في الواجهة (`useVideoUpload`, `useTranscription`)
- وجود i18n + RTL + بنية components جيدة كقاعدة

**غير مناسب حالياً:**

- تعقيد Frontend زائد للمستخدم الأساسي
- `CaptionTimeline.jsx` ضخم ومركب
- `Home.jsx` فيه مسارين عرض منفصلين بشكل يزيد التعقيد
- `Editor.jsx` يجمع منطق mobile + desktop + نصوص hardcoded
- لا توجد اختبارات كافية

---

## 2) الجرد الكامل لواجهة المستخدم

### 2.1 Routes الحالية

| Route | File | Purpose |
|---|---|---|
| `/` | `frontend/src/pages/Home.jsx` | Upload landing |
| `/editor` | `frontend/src/pages/Editor.jsx` | Main editor (mobile wizard + desktop studio) |

### 2.2 UI Surfaces

| Surface | File | Purpose |
|---|---|---|
| Home Mobile | `Home.jsx` | مدخل الرفع للموبايل |
| Home Desktop | `Home.jsx` | نسخة desktop من نفس الصفحة |
| UploadZone | `components/UploadZone.jsx` | اختيار ملف + رفع + تفريغ |
| Mobile Step Preview | `Editor.jsx` | معاينة بسيطة (زر تشغيل/إيقاف + وقت) |
| Mobile Step Review | `components/mobile/StepReview.jsx` | مراجعة الكلمات |
| Mobile Step Style | `components/mobile/StepStyle.jsx` | اختيار presets |
| Mobile Step Export | `components/mobile/StepExport.jsx` | تصدير SRT/MP4 |
| TranscriptPanel | `components/studio/TranscriptPanel.jsx` | قائمة كلمات على desktop |
| VideoStage | `components/studio/VideoStage.jsx` | فيديو + overlay captions |
| CaptionTimeline | `components/studio/CaptionTimeline.jsx` | timeline تعديل دقيق |
| SettingsSection | `components/studio/SettingsSection.jsx` | إعدادات متقدمة |
| ActionBar | `components/studio/ActionBar.jsx` | أزرار التصدير |
| WordEditBottomSheet | `components/studio/WordEditBottomSheet.jsx` | تعديل كلمة |
| StudioNavBar | `components/studio/StudioNavBar.jsx` | شريط علوي في الاستوديو |

### 2.3 قائمة المكونات المفصلة (إضافة من المراجعة الأولى)

`VideoStage`, `VideoControls`, `CaptionTimeline`, `TranscriptPanel`, `WordEditBottomSheet`, `WordEditorForm`, `SettingsSection`, `ActionBar`, `StepReview`, `StepStyle`, `StepExport`, `MobileShell`, `AnimationPicker`, `ColorPicker`, `RangeSlider`, `PositionControl`, `CaptionItem`.

### 2.4 تدفّق المستخدم الحالي

`Home -> UploadZone(upload + transcribe) -> /editor -> Review/Style/Edit -> Export`

---

## 3) تحليل احتياجات المستخدم الأساسي (الأستاذ)

الاحتياج الحقيقي:

1. أرفع الفيديو
2. أتأكد النص صحيح
3. أختار شكل بسيط
4. أحمّل الناتج

### 3.1 ما سيستخدمه فعلاً

- رفع الفيديو
- تصحيح نصي سريع للكلمات
- Presets جاهزة
- تنزيل SRT
- تصدير MP4

### 3.2 ما يضيف احتكاكاً غير ضروري

- تحريك start/end لكل كلمة بزمن دقيق
- Timeline بالسحب/التمديد
- Advanced parameters (min display, max words, segment duration...)
- Caption mode labels غير مفهومة لغير التقني
- Animation options كثيرة (karaoke/typewriter...)
- بحث متقدم داخل transcript لحالات ليست أساسية
- تنقل wizard مع خطوات زائدة

### 3.3 ما هو ناقص فعلاً

- Copy SRT to clipboard
- Retry transcription من داخل التدفق
- Session persistence عند refresh/close
- Progress feedback أوضح أثناء الانتظار

---

## 4) تدقيق الميزات (Feature Audit المدمج)

### Keep (Core)

- Video upload
- Auto transcription
- Video preview with live captions
- Word text correction
- SRT download
- MP4 export
- Style presets

### Move to Advanced only

- CaptionTimeline drag/resize/split
- Full SettingsSection controls
- Word timing controls
- Sliding window and fine timing controls
- Animation deep controls
- Transcript search/power tooling

### Remove/Downgrade in Core flow

- لغة الواجهة المتعددة أمام المستخدم الأساسي (تخفيف)
- اختيار language hint في الرفع (default auto)
- Typing hero complexity
- خيارات خطوط كثيرة (تختزل إلى اثنين)
- تحكم position الدقيق X/Y

---

## 5) تقييم قابلية الاستخدام على الموبايل

### أعلى مشكلات

1. Step Preview ضعيفة القيمة مقارنة بعرض الفيديو الدائم.
2. Timing sliders في sheet تربك المستخدم وتزيد الأخطاء.
3. لا يوجد progress مرحلي واضح أثناء التفريغ.
4. الحالة تضيع عند refresh بسبب الاعتماد على `location.state`.
5. Export UX لا يشرح الفرق بوضوح بين SRT وMP4.

### ما يعمل جيداً

- MobileShell كنمط تنقل
- Bottom sheet pattern
- Presets قابلة للنقر بوضوح
- Upload touch flow مناسب

---

## 6) الواجهة المزدوجة المقترحة (المعتمدة)

### 6.1 القرار المعتمد

- `/` -> `UploadPage`
- `/review` -> `MobileEditorPage`
- `/editor` -> `AdvancedEditorPage` (lazy-loaded)

### 6.2 Interface A — Simple Core Flow (الأستاذ)

#### Screen 1: Upload

- زر واضح لاختيار الفيديو
- مرحلتا تقدم واضحتان:
  - جاري الرفع
  - جاري التفريغ الصوتي
- رسائل خطأ عربية بسيطة + إعادة المحاولة

#### Screen 2: Review Captions

- فيديو بالأعلى + قائمة كلمات/مقاطع بالأسفل
- تعديل نصي سريع فقط
- بدون timestamps ظاهرة
- بدون timing controls

#### Screen 3: Pick Style

- 3-4 presets واضحة
- معاينة مباشرة على الفيديو
- لا توجد إعدادات متقدمة

#### Screen 4: Export

- زر أساسي: تحميل الفيديو مع الكابشن (MP4)
- زر ثانوي: تحميل SRT + سطر توضيح الاستخدام
- progress state واضح للتصدير

### 6.3 Interface B — Advanced Editor

الاحتفاظ بكامل القدرات الحالية للمستخدمين المتقدمين:

- Timeline كامل
- Transcript tools
- إعدادات style/timing/animation الكاملة
- التعديل الزمني للكلمات

مع ملاحظة: لا يعرض افتراضياً للمستخدم الأساسي.

---

## 7) توصيات الكود والبنية

### 7.1 الهيكل المعتمد (features/)

```text
frontend/src/
  features/
    upload/
    review/
    style/
    export/
    advanced/
  components/
    mobile/
    shared/
```

### 7.2 تفكيك/تحسين المكونات

- تقسيم `Editor.jsx` إلى صفحات أوضح (mobile review vs advanced editor)
- تقسيم `CaptionTimeline.jsx` لتقليل التعقيد
- إضافة prop للتحكم في ظهور timing controls

### 7.3 إدارة الحالة

إضافة `useEditorSession`:

- قراءة أولية من `location.state`
- fallback إلى `localStorage`
- حفظ التعديلات دورياً
- خيار Start Over لمسح الجلسة

### 7.4 الفصل بين Core وAdvanced في الراوتنج

- `lazy()` للـ advanced route لتقليل الحمل الأولي
- Route guard/redirect واضح بين `/review` و`/editor`

### 7.5 مشاكل صيانة حرجة (من المراجعة الثانية)

- Hardcoded strings خارج i18n
- CORS تحتاج env-based origins
- غياب الاختبارات
- اسم Gemini model غير موثوق في fallback
- FFmpeg export blocking
- عدم وجود file size guard
- ملاحظات انتهاء صلاحية URLs وتوثيقها
- SDK migration item للمستقبل

### 7.6 إضافات جودة كود (من المراجعة الأولى)

- دمج `sheetWordId` + `selectedWordId` لو نفس الدور
- حذف/توحيد `handleSheetPatch` و`handleSheetPatchKeepOpen` إن كانا متطابقين
- إزالة callback فارغ `onVideoDimensions: () => {}`
- إزالة wrapper غير ضروري `StepUpload.jsx`
- تدقيق/حذف `PositionControl.jsx` إن غير مستخدم
- تدقيق/حذف `CaptionItem.jsx` إن غير مستخدم
- معالجة ملف `backend/routes/upload.py` (توصيل أو حذف)

---

## 8) الخطة قصيرة المدى (Professor-Only v1)

### Week 1 — Simplify Mobile Flow

1. حذف التعقيد الزائد من mobile steps
2. إزالة timing controls من مسار الأستاذ
3. تحسين CTA النصية في التدفق
4. نقل النصوص hardcoded إلى i18n

### Week 1 — UX Polish

5. إضافة Copy SRT
6. إضافة Retry transcription
7. progress messaging مرحلي أثناء الانتظار
8. دعم reduced-motion في التأثيرات

### Week 2 — Stability & Error Handling

9. إصلاح retry state bugs
10. معالجة orphan route في backend
11. تحذير session timeout / expiry behavior
12. اختبار فعلي end-to-end على فيديو عربي حقيقي

### 12-item Execution List (merged)

1. Remove timing sliders in core flow
2. Add localStorage persistence
3. Unify/clean Home entry
4. Simplify Export step hierarchy
5. Remove/merge redundant preview step
6. Hide language hint selector by default
7. Production-ready CORS config
8. Move Arabic hardcoded copy to locale files
9. Add upload size guard
10. Add two-phase upload/transcribe feedback
11. Verify timeline stays desktop-only
12. Add smoke tests for pure utilities

---

## 9) الخطة طويلة المدى (Portfolio / v2)

### Stage 1 — Stable Professor Version

- Core flow بسيط، ثابت، قابل للاستخدام اليومي
- Session persistence
- رسائل أخطاء واضحة

### Stage 2 — Reliability & Product Quality

- Retry/backoff أفضل
- تحسين مراجعة الكلمات (seek from word)
- اقتراحات تصحيح مبنية على low confidence
- تحسين شاشة export (preview thumbnail)
- PWA shell readiness

### Stage 3 — Multi-user Foundations

- auth خفيف
- تنظيم storage per user
- rate limiting
- cleanup jobs

### Stage 4 — Advanced Editor Maturity

- تفعيل advanced route رسميًا
- إعادة تنظيم timeline/settings
- توثيق shortcuts

### Stage 5 — Scale/Monetization

- analytics
- billing
- batch processing
- extended styling/translations

### Mapping مع Phases القديمة

- Phase A (Session persistence) -> Stage 1
- Phase B (Simple flow default) -> Stage 1/2
- Phase C (Quality & polish) -> Stage 2
- Phase D (Monetization/scale) -> Stage 5

---

## 10) قائمة الميزات للحذف/التقليل في المسار البسيط

- Word timing nudges
- Timeline drag/resize
- Full animation chooser (karaoke/typewriter/...)
- Sliding window technical controls
- Position X/Y precision controls
- كثرة خيارات font family (تبقى 2)
- Language switcher في تجربة الأستاذ
- StepUpload wrapper إن بلا قيمة
- HelpHint component إن كان trivial
- PositionControl/CationItem إن كانوا dead code

---

## 11) المخاطر والأسئلة المفتوحة

### 11.1 مخاطر تقنية/تشغيلية

1. حد حجم الفيديو وتأثيره على timeout.
2. اعتماد backend على قابلية الوصول إلى روابط التخزين.
3. fallback model chain قد تحتوي اسمًا غير صالح ويزيد latency.
4. export blocking model يحتاج استراتيجية jobs مستقبلاً.
5. تغيير routes قد يكسر أي روابط محفوظة إذا لم يوجد redirect.

### 11.2 أسئلة قرار المنتج

1. ما هو output الأساسي للمستخدم: SRT أم MP4؟
2. متوسط أطوال الفيديو الفعلية؟
3. هل الاستخدام سيبقى لمستخدم واحد؟
4. هل النشر النهائي Netlify أم دومين مخصص؟
5. هل يلزم استكمال الجلسة عبر أجهزة مختلفة؟

---

## 12) الحكم النهائي الموجز

المشروع قوي هندسياً، والبنية الأساسية جاهزة. التحدي ليس في محرك المعالجة بل في واجهة القيادة للمستخدم الحقيقي. الاتجاه الصحيح: اعتماد تدفق بسيط جداً كافتراضي للموبايل، مع إبقاء المحرر المتقدم كمسار منفصل للمستخدم المتقدم.

> The engine is great. Build a simpler cockpit for it.

