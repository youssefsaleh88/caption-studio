# Design Tokens: Caption Studio

**Slug:** `caption-studio-ui`  
**الفلسفة:** Minimal modern ، أداة إنتاج **داكنة أولًا**؛ وضع فاتح مسوًّد كأساس لمفتاح مستقبلي على `<html>`.

---

## المصدر المرجعي في الكود

| الملف | الغرض |
|-------|--------|
| `frontend/src/tokens.css` | قيم حقيقية لـ `:root` (داكن)، و`[data-theme="light"]`، وسياسات `prefers-reduced-motion`. |
| `frontend/src/index.css` | `@import "./tokens.css"` ثم أوامر عامة؛ `body`, scrollbar، `accent-color` على range؛ مفاتيح التركيز معرّفة في `tokens.css` للاستعمال الانتقائي. |
| `frontend/tailwind.config.js` | ما زال مصدر **`theme.extend.colors`** بالقيم الثابتة (`#8B7CFF` …) لمكوّنات تستخدم **`dark-*`/`accent*`** وحرفيات `white/10`؛ **المرحلة التالية المقترحة:** ربط الألوان بـ `rgb(var(...) / <alpha-value>)` أو كلاسّات مغلفة بتدريج لتقليل الفَرْق بين التوؤم والطبقة. |

---

## الألوان (دلالية)

معادلات الأسماء الأساسية → متغير CSS:

| الدلالية | المتغير | قيمة حالية (داكن v1) |
|----------|---------|-------------------------|
| خلفية التطبيق | `--cap-bg-root` | `#0B0B10` |
| بطاقات/أسطح | `--cap-bg-surface` | `#16161E` |
| طبقات مرتفعة | `--cap-bg-elevated` | `#1E1E2A` |
| نص رئيسي | `--cap-text-primary` | `#E8E8F2` |
| نص مساعد | `--cap-text-secondary` | `#E8E8F2` بشفافية حوالي 65٪ |
| نص خامد | `--cap-text-tertiary` ، `--cap-text-muted` | ~40–35٪ |
| حدود خفيفة/عادية/قوية | `--cap-border-*` | متدرجات الأبيض بشفافية في الداكن |
| إجراء رئيسي | `--cap-accent` | `#8B7CFF` |
| حالة خطأ تقريبية | `--cap-status-error` | `#F97171` |
| ستارة مودال | `--cap-overlay-scrim` | أسود شفّاف |

**Tailwind اليوم:**

- `colors.dark.DEFAULT` ≈ `--cap-bg-root`
- `colors.dark.surface` ≈ `--cap-bg-surface`
- `colors.dark.elevated` ≈ `--cap-bg-elevated`
- `colors.accent.DEFAULT` ≈ `--cap-accent`

---

## الوضع الفاتح

يُحمَّل بتعريف `:root[data-theme="light"]` في `tokens.css`. **التطبيق الحالي لا يضبط `data-theme`** على الوثيقة؛ هذا متعمّد (المنتج arabic/tool داكن حصريًا في v1).

لم نربط الوضع الفاتح آلياً بـ `prefers-color-scheme: light` حتى لا تتحول الواجهة دون قرار منتج؛ عند تشغيل مفتاح لاحق يمكن ضبط `data-theme` من التفضيلات أو نظام الهاتف وفق منتجكم.

عند احتياج منتج لتبديل يدوي:

1. ربط مفتاح مستخدم بـ `document.documentElement.setAttribute('data-theme', 'light'|'dark')`.
2. اختبار تباين النص العربي لواجهات طويلة.

---

## المسافة والشعاع والظلال

قاعدة **4px** في `--cap-space-*`؛ نصف قطري الأزراق الكبرى مستخدم في JSX كـ Tailwind (`rounded-xl`، `rounded-2xl`). القيم الموثَّقة تعادل المنطقة:

| متغير | قيمة | ملاحظة |
|--------|------|---------|
| `--cap-space-4`–`12` | 1rem→3rem | زرّ تبويب موبايل ~ `min-h-[48px]` = ~12 وحدة عمل |
| `--cap-radius-lg` ، `xl` ، `2xl` | من 1rem إلى 1.5rem | تطابق نمط الواجهة الحالية |
| `--cap-shadow-sheet` | ظل قوي أسفل ورقة الإعدادات | يُمكن ربطه لاحقًا بصف منفصل في Tailwind |

---

## الطباعة

- **/stacks:** `--cap-font-body`, `--cap-font-body-rtl`, `--cap-font-mono`.
- **مقياس تجريبي** في المتغيرات للاستخدام المرحلي في CSS خام؛ JSX يعتمد أغلبه على كلاسّات Tailwind (`text-sm`، `text-3xl`، إلخ).
- خطوط Google محمّلة في `index.html` (Inter، Cairo، Noto Arabic، إلخ) — لم تُزل التكرارات الزائدة (DM Sans…) في هذا الإصدار لتقليل نطاق أثر البناء.

---

## الحركة وإتاحة الحركة

| متغير | الاستخدام المقترح |
|--------|-------------------|
| `--cap-duration-*` ، `--cap-easing-default` | `transition-duration`/`transition-timing-function` عند refactor |
| `@media (prefers-reduced-motion: reduce)` | يكمِّن المدة إلى ~قيمة مهملة؛ يعطّل منطقيًا تأثيرات طويلة |
| `--cap-motion-typing-char-delay` ، `--cap-motion-enable-typing` | **يُرجّى wiring** من `TypingTitle` و `animate-pulse` في مرحلة لاحقة لمطابقة الـ Brief (إيقاف تأثير كتابة وتموّج مستمر تحت هذا الإعداد). |

---

## نقاط الانكسار (`breakpoints`)

يُعتمد افتراضيًا على **Tailwind v3**:

- `lg` (**1024px**) — ظهور عمود المحكِّر الثلاثي (`Editor.jsx`).
- المرجع الظاهري: `useSyncExternalStore` يستعمل `(min-width: 1024px)` نفس المبدأ.

---

## الترابط مع Tailwind للمكونات القادمة

1. أفضل مسار لمكوّن جديد بدون literals: **`style={{ color: 'var(--cap-accent)' }}`** أو أدا `@apply` نادرة؛ أو وسّيع `tailwind.config.js` بحيث `accent.DEFAULT: 'rgb(139 124 255)'` لا يختلف عن المتغير.
2. لمشاكل **`bg-white/10`** مع المتغيرات: احتاج مسار **`color-mix`** أو احتفظ بالطبقة المعتمة بلون Tailwind الزائفي حتى تُعاد هياكة بالكامل.

---

## مخطّط المرحلة اللاحقة (اختياري)

- [ ] ربط `tailwind.config.js` بالمتغيرات مع دعم شفافية الألفا.
- [ ] استخدام `var(--cap-motion-*)` في `Home.jsx` لـ TypingTitle وفي `tailwind` للحركات الشرطية.
- [ ] مزامنة `<meta name="theme-color">` مع `--cap-bg-root` عبر سكربت صغير أو قيمة واحدة ثابتة.

---

تم إنشاؤه ضمن مسار Phase 4 — **design-tokens**.
