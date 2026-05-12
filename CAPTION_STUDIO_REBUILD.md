# Caption Studio — خطة إعادة البناء الكاملة

> **الهدف:** إعادة بناء Caption Studio من الصفر بتصميم Colorful & Friendly يستهدف المستخدم العادي على الموبايل أولاً، مع الحفاظ على نفس الباك إند الحالي (FastAPI + Cloudflare R2 + FFmpeg).

---

## ١. فلسفة المشروع الجديد

### المشكلة مع النسخة القديمة
- Timeline معقد لا يناسب الموبايل
- محرر كابشن احترافي لمستخدمين عاديين
- تدفق غير واضح — المستخدم لا يعرف الخطوة التالية

### القرار الجديد: "3 شاشات بس"
```
رفع ← معالجة ← مراجعة ← تصدير
```
كل شاشة عندها هدف واحد، وزر واحد رئيسي فقط.

### المبدأ التصميمي
- **Mobile-first** — الموبايل هو المنتج الأساسي
- **Colorful & Friendly** — ألوان دافية، خطوط ودية
- **Zero learning curve** — المستخدم يفهم كل شيء بدون شرح
- **بطاقات بدل Timeline** — كل جملة = بطاقة واحدة قابلة للتعديل

---

## ٢. Stack التقني

### الفرونت إند
| التقنية | الإصدار | السبب |
|---------|---------|-------|
| React | 18 | نفس Stack المشاريع الحالية |
| Vite | 5 | سرعة البناء |
| Tailwind CSS | 3 | مرونة التصميم |
| react-router-dom | v6 | التنقل بين الشاشات |
| @google/generative-ai | latest | SDK رسمي لـ Gemini |
| uuid | latest | معرّفات فريدة للجلسات |

### الباك إند (بدون تغيير)
| التقنية | الإصدار |
|---------|---------|
| Python | 3.11 |
| FastAPI | latest |
| Uvicorn | latest |
| google-generativeai | latest |
| ffmpeg-python | latest |
| boto3 + botocore | latest |
| httpx | latest |
| python-multipart | latest |
| python-dotenv | latest |

### الذكاء الاصطناعي
```
النموذج: gemini-2.5-pro
```
> **لماذا gemini-2.5-pro؟**
> أعلى دقة في التفريغ الصوتي، وأفضل فهم للسياق العربي، ويدعم الـ long context (1M token) مما يسمح بمعالجة فيديوهات طويلة بدون مشاكل.

---

## ٣. هيكل المشروع

```
caption-studio/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadZone.jsx          # منطقة رفع الفيديو
│   │   │   ├── ProcessingScreen.jsx    # شاشة المعالجة مع Progress
│   │   │   ├── CaptionCard.jsx         # بطاقة جملة واحدة
│   │   │   ├── ReviewScreen.jsx        # شاشة مراجعة البطاقات
│   │   │   ├── ExportScreen.jsx        # شاشة التصدير
│   │   │   └── VideoPreview.jsx        # مشغّل الفيديو المصغّر
│   │   ├── pages/
│   │   │   ├── HomePage.jsx            # الصفحة الرئيسية (رفع)
│   │   │   ├── ProcessPage.jsx         # صفحة المعالجة
│   │   │   ├── ReviewPage.jsx          # صفحة المراجعة
│   │   │   └── ExportPage.jsx          # صفحة التصدير
│   │   ├── hooks/
│   │   │   ├── useUpload.js            # منطق الرفع لـ R2
│   │   │   ├── useTranscribe.js        # منطق التفريغ
│   │   │   └── useExport.js            # منطق التصدير
│   │   ├── utils/
│   │   │   ├── srt.js                  # توليد ملف SRT
│   │   │   └── session.js              # إدارة الجلسة
│   │   ├── styles/
│   │   │   └── globals.css             # المتغيرات والألوان
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── backend/
    ├── main.py                         # FastAPI app
    ├── routes/
    │   ├── upload.py                   # POST /api/upload-url
    │   ├── transcribe.py               # POST /api/transcribe
    │   └── export.py                   # POST /api/export
    ├── services/
    │   ├── gemini_service.py           # التفريغ بـ gemini-2.5-pro
    │   ├── ffmpeg_service.py           # استخراج صوت + حرق كابشن
    │   └── r2_service.py               # إدارة Cloudflare R2
    ├── models/
    │   └── schemas.py                  # Pydantic models
    ├── .env
    ├── requirements.txt
    └── Dockerfile
```

---

## ٤. نظام الألوان والتصميم

### الـ Design Tokens
```css
/* globals.css */
:root {
  /* Primary — Warm Orange/Coral */
  --color-primary: #FF6B6B;
  --color-primary-alt: #FF9F43;
  --color-primary-gradient: linear-gradient(135deg, #FF6B6B, #FF9F43);

  /* Secondary — Soft Purple */
  --color-secondary: #667EEA;
  --color-secondary-alt: #764BA2;
  --color-secondary-gradient: linear-gradient(135deg, #667EEA, #764BA2);

  /* Surfaces */
  --color-bg: #FAFAFA;
  --color-surface: #FFFFFF;
  --color-surface-warm: #FFFBF5;
  --color-border: #F0EDFF;

  /* Text */
  --color-text-primary: #1A1A2E;
  --color-text-secondary: #6B7280;
  --color-text-muted: #9CA3AF;

  /* Status */
  --color-success: #10B981;
  --color-success-bg: #D1FAE5;
  --color-processing: #8B5CF6;
  --color-processing-bg: #EDE9FE;
}
```

### الخط
```
font-family: 'Nunito', sans-serif
```
> تحميل من Google Fonts — خط ودي ومناسب للمستخدم العادي

### قواعد الـ Spacing
```
border-radius الكبير: 20-28px (للبطاقات والأزرار الرئيسية)
border-radius المتوسط: 12-16px (للعناصر الداخلية)
padding الشاشات: 20px يمين ويسار
gap بين العناصر: 12-16px
```

---

## ٥. الشاشات بالتفصيل

### شاشة ١: الرفع (HomePage)

**العناصر:**
```
Logo + اسم التطبيق
↓
Icon كبير + عنوان ترحيبي
↓
Upload Zone (dashed border, drag & drop)
↓
زر "ابدأ ←" (gradient button)
↓
صيغ مدعومة (badges صغيرة)
```

**المنطق:**
```javascript
// useUpload.js
const uploadFlow = async (file) => {
  // 1. الحصول على Presigned URL
  const { uploadUrl, videoUrl } = await fetch('/api/upload-url', {
    method: 'POST',
    body: JSON.stringify({ filename: file.name, contentType: file.type })
  })

  // 2. رفع مباشر للـ R2
  await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type }
  })

  // 3. حفظ الـ videoUrl في الجلسة
  session.set('videoUrl', videoUrl)
  session.set('originalFile', URL.createObjectURL(file))

  // 4. الانتقال لشاشة المعالجة
  navigate('/process')
}
```

---

### شاشة ٢: المعالجة (ProcessPage)

**العناصر:**
```
Icon متحرك (emoji أو SVG animation)
↓
عنوان "بنعمل السحر ✦"
↓
Progress Bar (مع نسبة مئوية)
↓
Steps List:
  ✅ رُفع الفيديو بنجاح
  ✅ استُخرج الصوت
  ⏳ جاري التفريغ بالـ AI...
  ○  تجهيز الكابشن
```

**المنطق:**
```javascript
// useTranscribe.js
const transcribe = async () => {
  const videoUrl = session.get('videoUrl')

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ video_url: videoUrl })
  })

  // الباك إند يرجع: [{ word, start, end, id }]
  const { words } = await response.json()

  // تحويل الكلمات لجمل
  const sentences = groupWordsToSentences(words)

  session.set('captions', sentences)
  navigate('/review')
}

// دالة تجميع الكلمات في جمل (كل 8-12 كلمة أو عند وقفة > 0.5 ثانية)
const groupWordsToSentences = (words) => {
  const sentences = []
  let current = []

  words.forEach((word, i) => {
    current.push(word)
    const isLongPause = words[i+1] && (words[i+1].start - word.end) > 0.5
    const isLongEnough = current.length >= 10

    if (isLongPause || isLongEnough || i === words.length - 1) {
      sentences.push({
        id: uuid(),
        text: current.map(w => w.word).join(' '),
        start: current[0].start,
        end: current[current.length - 1].end,
        words: current
      })
      current = []
    }
  })

  return sentences
}
```

---

### شاشة ٣: المراجعة (ReviewPage)

**العناصر:**
```
← زر رجوع | "راجع الكابشن" | زر "التالي →"
↓
Video Preview صغير (مع الكابشن الحالي عليه)
↓
"الكابشن" label + عدد الجمل
↓
بطاقات قابلة للتعديل:
  [0:00] مرحباً بالجميع في هذا الفيديو  ✏️
  [0:04] أهلاً وسهلاً بيكم  ✏️  ← active (ملوّن)
  [0:07] النهارده هنتكلم عن موضوع مهم  ✏️
↓
زر "تصدير ✓"
```

**المنطق:**
```javascript
// CaptionCard.jsx
const CaptionCard = ({ caption, isActive, onEdit, onDelete }) => {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(caption.text)

  return (
    <div className={`cap-card ${isActive ? 'active' : ''}`}>
      <span className="cap-time">{formatTime(caption.start)}</span>

      {editing ? (
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={() => { onEdit(caption.id, text); setEditing(false) }}
          autoFocus
        />
      ) : (
        <span className="cap-text" onClick={() => setEditing(true)}>
          {caption.text}
        </span>
      )}

      <button onClick={() => setEditing(true)}>✏️</button>
      <button onClick={() => onDelete(caption.id)}>🗑️</button>
    </div>
  )
}
```

> **ملاحظة مهمة:** لا يوجد Timeline. المستخدم يضغط على البطاقة يعدّل النص مباشرة. بسيط زي تعديل رسالة WhatsApp.

---

### شاشة ٤: التصدير (ExportPage)

**العناصر:**
```
🎉 Icon + "جاهز للتصدير!"
↓
خيار ١: 🎬 فيديو MP4 (كابشن محروق) ← مختار افتراضياً
خيار ٢: 📄 ملف SRT (للمونتاج)
↓
زر "تصدير الآن ↓"
```

**المنطق:**
```javascript
// useExport.js
const exportVideo = async (format) => {
  if (format === 'srt') {
    // SRT من الواجهة مباشرة — بدون باك إند
    const srtContent = generateSRT(session.get('captions'))
    downloadFile(srtContent, 'captions.srt', 'text/plain')
    return
  }

  // MP4 — يطلب الباك إند
  const response = await fetch('/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      video_url: session.get('videoUrl'),
      captions: session.get('captions'),
      style: {
        font_size: 24,
        font_color: 'white',
        bg_color: 'black@0.5',
        position: 'bottom'
      }
    })
  })

  const blob = await response.blob()
  downloadFile(blob, 'captioned_video.mp4', 'video/mp4')
}
```

---

## ٦. الباك إند — التغيير الوحيد (النموذج)

### gemini_service.py
```python
import google.generativeai as genai
import os
import base64
import json

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# ✅ أعلى دقة متاحة
MODEL = "gemini-2.5-pro"

async def transcribe_audio(audio_path: str) -> list[dict]:
    """تفريغ الصوت إلى كلمات مع توقيت دقيق"""

    with open(audio_path, "rb") as f:
        audio_data = base64.b64encode(f.read()).decode("utf-8")

    model = genai.GenerativeModel(MODEL)

    prompt = """
    أنت نظام متخصص في تفريغ الصوت بدقة عالية.
    
    المطلوب:
    - فرّغ هذا الصوت كلمة بكلمة
    - أعطِ لكل كلمة وقت البداية (start) ووقت النهاية (end) بالثواني
    - كن دقيقاً في التوقيت قدر الإمكان
    - ادعم اللغة العربية والإنجليزية والعامية المصرية
    
    أرجع JSON فقط بهذا الشكل بدون أي نص إضافي:
    {
      "words": [
        {"word": "مرحباً", "start": 0.0, "end": 0.5},
        {"word": "بالجميع", "start": 0.6, "end": 1.1}
      ]
    }
    """

    response = model.generate_content([
        {"mime_type": "audio/wav", "data": audio_data},
        prompt
    ])

    # تنظيف الاستجابة وتحويلها لـ JSON
    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]

    result = json.loads(text)
    return result["words"]
```

### متغيرات البيئة (.env)
```env
# Gemini
GEMINI_API_KEY=your_key_here

# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=caption-studio
R2_PUBLIC_URL=https://your-bucket.r2.dev

# App
CORS_ORIGINS=http://localhost:5173,https://your-app.vercel.app
MAX_FILE_SIZE_MB=500
```

---

## ٧. إدارة الجلسة (بدون Backend State)

```javascript
// utils/session.js
// كل البيانات تُحفظ في sessionStorage (تُمسح عند إغلاق التاب)

const SESSION_KEY = 'caption_studio_session'

export const session = {
  set: (key, value) => {
    const current = session.getAll()
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      ...current,
      [key]: value
    }))
  },

  get: (key) => {
    const data = session.getAll()
    return data[key] ?? null
  },

  getAll: () => {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}')
    } catch {
      return {}
    }
  },

  clear: () => sessionStorage.removeItem(SESSION_KEY)
}
```

> **لماذا sessionStorage وليس localStorage؟**
> الفيديوهات حساسة — أفضل أن تُمسح تلقائياً عند إغلاق التاب. كما أن localStorage يسبب مشاكل لو راكمت فيديوهات كثيرة.

---

## ٨. توليد SRT (من الواجهة)

```javascript
// utils/srt.js
export const generateSRT = (captions) => {
  return captions.map((caption, index) => {
    const startTime = formatSRTTime(caption.start)
    const endTime = formatSRTTime(caption.end)

    return `${index + 1}\n${startTime} --> ${endTime}\n${caption.text}`
  }).join('\n\n')
}

const formatSRTTime = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)

  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`
}

const pad = (n, len = 2) => String(n).padStart(len, '0')
```

---

## ٩. خطة التنفيذ (الترتيب المقترح)

### المرحلة الأولى — الهيكل والتصميم
```
[ ] إنشاء مشروع Vite + React
[ ] إعداد Tailwind + CSS Variables
[ ] تحميل خط Nunito من Google Fonts
[ ] بناء App.jsx مع react-router-dom
[ ] بناء HomePage (شاشة الرفع)
[ ] بناء ProcessPage (شاشة المعالجة - بدون منطق)
[ ] بناء ReviewPage (شاشة البطاقات - بيانات وهمية)
[ ] بناء ExportPage (شاشة التصدير)
```

### المرحلة الثانية — الربط بالباك إند
```
[ ] تحديث gemini_service.py ليستخدم gemini-2.5-pro
[ ] تجربة API الباك إند الحالي (upload-url + transcribe + export)
[ ] ربط useUpload.js بـ /api/upload-url
[ ] ربط useTranscribe.js بـ /api/transcribe
[ ] تطبيق groupWordsToSentences
[ ] ربط useExport.js بـ /api/export
[ ] تجربة توليد SRT من الواجهة
```

### المرحلة الثالثة — الصقل
```
[ ] اختبار على الموبايل (Chrome DevTools + جهاز حقيقي)
[ ] تحسين Loading States والـ Error Handling
[ ] إضافة Toast notifications للأخطاء
[ ] التأكد من أن الكابشن العربي يظهر صح في الفيديو (RTL + خط)
[ ] اختبار مع فيديوهات مختلفة الأحجام والمدد
```

---

## ١٠. نقاط انتبه ليها

### أداء الموبايل
- لا تحمّل الفيديو كاملاً في الذاكرة — استخدم `URL.createObjectURL()`
- اضبط `max-width: 100%` على كل العناصر
- استخدم `touch-action: manipulation` على الأزرار لإلغاء تأخير 300ms

### الكابشن العربي في FFmpeg
```python
# ffmpeg_service.py
# تأكد من تحديد خط يدعم العربية
subtitle_style = "FontName=Arial,FontSize=24,PrimaryColour=&HFFFFFF,BackColour=&H80000000,Bold=1"

# لو مستخدم لينوكس، تأكد من وجود خط عربي
# مثلاً: apt-get install fonts-arabeyes
```

### حجم الفيديو
- الحد الأقصى الموصى به: 500MB
- للفيديوهات الكبيرة: أضف تحذير للمستخدم قبل الرفع
- وقت معالجة gemini-2.5-pro أطول قليلاً من Flash — أضف رسالة انتظار مناسبة

### Error Handling للمستخدم العادي
```
❌ لا: "Error 500: Internal Server Error"
✅ نعم: "حصل مشكلة في معالجة الفيديو، جرب تاني 🔄"

❌ لا: "Transcription failed: API quota exceeded"
✅ نعم: "الخدمة مشغولة دلوقتي، انتظر شوية وجرب تاني ⏳"
```

---

## ١١. معلومات Gemini API

```
Model String:  gemini-2.5-pro
Context Window: 1,048,576 token
Audio Support:  ✅ native
Arabic Support: ✅ ممتاز
Pricing:        $1.25 / 1M input tokens | $10 / 1M output tokens
Free Tier:      متاح عبر Google AI Studio (rate limits)
```

**للاستخدام الشخصي (1-2 مستخدمين):** الـ free tier كافي تماماً.

---

## ملاحظة أخيرة

المشروع الحالي يعمل بالكامل — المطلوب فقط إعادة بناء الفرونت إند مع تغيير واحد في الباك إند (النموذج). الباك إند نفسه لا يحتاج إعادة كتابة، فقط:

1. تحديث `MODEL = "gemini-2.5-pro"` في `gemini_service.py`
2. مراجعة الـ prompt ليكون أكثر وضوحاً للنموذج الجديد
3. بناء الفرونت إند الجديد من الصفر بالتصميم الجديد

---

*آخر تحديث: مايو 2026*
