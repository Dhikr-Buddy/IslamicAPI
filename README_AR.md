# 🕌 IslamicAPI (واجهة برمجة التطبيقات الإسلامية)

واجهة برمجة التطبيقات الإسلامية (IslamicAPI) هي **حزمة أدوات برمجية (SDK) عالية الأداء تعمل بدون اتصال بالإنترنت ومسار لإنتاج مجموعات البيانات القابلة لإعادة الإنتاج** للتطبيقات الإسلامية. توفر الحزمة وصولاً مباشراً دون اتصال بالإنترنت لنصوص القرآن الكريم المعتمدة ومجموعات الحديث الشريف (الكتب الستة وغيرها مقسمة إلى أجزاء أقل من 50 ميجابايت) وحساب مواقيت الصلاة واتجاه القبلة وتصنيفات تلاوات القراء المتميزين وحزم التطوير للهواتف المحمولة.

---

## 🚀 المبادئ المعمارية الأساسية
1. **الصحة المطلقة (Absolute Veracity):** لا يتم استخدام توليد النصوص عبر النماذج اللغوية الكبيرة (LLMs) أو الذكاء الاصطناعي لتجنب الهلوسة في النصوص الدينية. كل سجل يحتوي على مصادر واضحة وموثقة بشكل صريح (Provenance).
2. **أداء عالٍ بدون اتصال بالإنترنت (Offline-First):** تعمل المحركات الأساسية للقرآن والحديث الشريف ومواقيت الصلاة بالكامل دون الحاجة للاتصال بالإنترنت. تم تقسيم مجموعات البيانات الضخمة (مثل الكتب الستة) إلى **أجزاء أقل من 50 ميجابايت** لتجنب قيود حجم الملفات في GitHub وتمكين الدمج الفعال عند الطلب.
3. **بدون اعتماد على نماذج التعلم الآلي المحلية:** يتم جلب توقيتات الكلمات والآيات من توقيتات مسبقة الصنع أو حسابها ديناميكياً باستخدام خوارزمية محسنة لتوزيع التوقيت حسب طول النص، مما يلغي تماماً الحاجة لتشغيل نماذج تعلم الآلة المحلية (مثل Whisper).

---

## 🛠️ نظرة عامة على الميزات

### 1. 🎙️ التلاوات المميزة ونطاقات التسمية (Namespaces)
يدعم IslamicAPI الوصول إلى إصدارات مختلفة لنفس القارئ باستخدام نطاقات تسمية أنيقة:
- **`imam:everyayah` (مثال: `sudais:everyayah`)** للتلاوات آية بآية (EveryAyah).
- **`imam:haram` (مثال: `sudais:haram`)** لتسجيلات الحرم المكي والحرم المدني والصلوات والتروايح المجمعة.
- **`imam:mp3quran` (مثال: `sudais:mp3quran`)** للبث الصوتي العادي على مستوى السورة من MP3Quran.

### 2. 🗓️ حساب مواقيت الصلاة دون اتصال بالإنترنت
يدعم العديد من الطرق المعتمدة عالمياً مع معالجة مرنة لأسماء الطرق (مثال: `isna`, `umm ul qura`, `karachi`):
- **ISNA** (الجمعية الإسلامية لأمريكا الشمالية) — الفجر $15^\circ$، العشاء $15^\circ$
- **UmmAlQura** (أم القرى - مكة المكرمة)
- **Karachi** (جامعة العلوم الإسلامية بكراتشي)
- **MuslimWorldLeague** (رابطة العالم الإسلامي)
- **Egyptian** (الهيئة المصرية العامة للمساحة)
- **Dubai** (دبي)
- **MoonsightingCommittee** (لجنة رصد الأهلة)

### 3. 🌍 ترجمات القرآن بلغات متعددة
يتضمن دعم الترجمة المدمج للعديد من اللغات العالمية الشهيرة مباشرة في حمولة الآية:
- **الإنجليزية**: Sahih International (`en_sahih`) و Yusuf Ali (`en_yusufali`)
- **الأردية**: Abul Ala Maududi (`ur_maududi`)
- **الإندونيسية**: Kementerian Agama (`id_kemenag`)
- **الروسية**: Abu Adel (`ru_abuadel`)
- **التركية**: Diyanet Vakfı (`tr_diyanet`)
- **الإسبانية**: Julio Cortes (`es_cortes`)
- **الفرنسية**: Muhammad Hamidullah (`fr_hamidullah`)
- **الألمانية**: Abu Rida (`de_aburida`)
- **البنغالية**: Zohurul Hoque (`bn_hoque`)
- **الصينية**: Ma Jian (`zh_jian`)

### ⏱️ أنظمة التوقيت (على مستوى الصفحة، الآية، والكلمة)
مزامنة الصوت مع نصوص القرآن حتى مستوى الكلمة الواحدة:
- **نظام الصفحات:** استرجع بسهولة مؤشرات البداية والنهاية لجميع السور والآيات التي تظهر في أي صفحة من صفحات المصحف الشريف (1-604).
- **نظام الآيات:** استرجع توقيتات دقيقة بالملي ثانية لكل آية لبدء وإيقاف التشغيل بمرونة.
- **توقيتات الكلمات:** مصفوفات توقيت تناسبية واقعية للغاية تمثل توقيت كل كلمة عربية بشكل مستقل.

---

## 📱 حزم التطوير والواجهات البرمجية المدعومة (SDKs)

توفر IslamicAPI ملفات مكتبية كاملة ومحسنة عبر خمسة أنظمة برمجية رئيسية:

| النظام البرمجي | ملف/دليل المكتبة | الميزات والوظائف البرمجية |
| :--- | :--- | :--- |
| **JavaScript / Node** | `packages/deen-sdk/src/index.js` | محمل فهارس القرآن والحديث الشريف، حساب الصلاة والقبلة، تجميعات الحرمين، توقيت الكلمات، تنزيل العميل |
| **Python** | `deensdk/core.py` | نماذج بيانات Pydantic المعتمدة، محركات البحث والتحقق، حساب الصلاة والقبلة، جلب الملفات من GitHub وتنزيل الخادم |
| **Flutter / Dart** | `packages/deen-sdk-flutter/lib/deen_sdk.dart` | حساب اتجاه القبلة، مواقيت الصلاة دون اتصال بالإنترنت، معالج أسماء الطرق، تعبئة قوالب روابط الصوت |
| **Swift (iOS/macOS)** | `packages/deen-sdk-swift/Sources/DeenSDK/DeenSDK.swift` | هياكل Swift آمنة النوع، الحسابات الرياضية للمواقيت، اتجاه بوصلة القبلة وقوالب الصوت |
| **Kotlin (Android)** | `packages/deen-sdk-kotlin/src/main/kotlin/deensdk/DeenSDK.kt` | كائنات Kotlin حديثة ذات أداء عالٍ للحسابات الفلكية للمواقيت، وتنسيق الوقت والتكامل مع التقويم |

---

## 💻 دليل الاستخدام التقني

### حزمة تطوير برمجيات JavaScript (`@deen/sdk`)

```javascript
import { 
  getSurah, 
  getAyah, 
  calculatePrayerTimes, 
  getAudioUrl,
  getAyahTimestamps,
  getWordTimestamps,
  getHaramainCompilations
} from "@deen/sdk";

// 1. جلب تفاصيل السورة والآية
const surah = getSurah(1); // سورة الفاتحة
const ayah = getAyah(1, 1);

// 2. حل روابط التلاوة عبر نطاقات التسمية
const everyAyahUrl = getAudioUrl("sudais:everyayah", 1, 1);
const haramUrl = getAudioUrl("sudais:haram", 1);

// 3. حساب مواقيت الصلاة بمرونة
const times = calculatePrayerTimes({
  latitude: 40.7128,
  longitude: -74.006,
  date: "2026-05-22",
  timezone: -4,
  method: "isna"
});

// 4. توقيت الكلمات والآيات بدقة الملي ثانية
const ayahTimestamps = getAyahTimestamps(1);
const wordTimestamps = getWordTimestamps(1, 1);
```

### حزمة تطوير برمجيات Python (`deensdk`)

```python
from deensdk import (
    get_ayah,
    calculate_prayer_times,
    get_ayah_timestamps,
    get_word_timestamps,
    download_recitation
)

# 1. جلب تفاصيل الآية
ayah = get_ayah(1, 1)

# 2. حساب مواقيت الصلاة دون اتصال بالإنترنت
times = calculate_prayer_times(
    latitude=40.7128,
    longitude=-74.006,
    date="2026-05-22",
    timezone=-4,
    method="umm_al_qura"
)

# 3. توقيت الآيات والكلمات
ayah_times = get_ayah_timestamps(1)
word_times = get_word_timestamps(1, 1)

# 4. تنزيل الملفات الصوتية إلى الخادم المضيف
local_file_path = download_recitation(reciter_id="alafasy", surah_number=1, ayah_number=1)
print(f"Downloaded recitation to: {local_file_path}")
```

---

## 🗺️ روابط خدمات الويب (خادم محلي)

يمكنك تشغيل خادم ويب محلي يعمل بدون إنترنت على شبكتك المحلية:

```sh
pnpm dev
```

أهم الروابط البرمجية المتاحة (HTTP Endpoints):
- `GET /health` -> فحص صحة الخادم `{"ok": true}`
- `GET /quran/surah/:number` -> السورة كاملة مع جميع آياتها
- `GET /quran/search?q=query` -> بحث محلي فائق السرعة في القرآن الكريم
- `GET /hadith/:id` -> حديث شريف مفرد من الأجزاء المقسمة
- `GET /hadith/random?collection=bukhari` -> حديث عشوائي غير مكرر
- `GET /prayer/times` -> حساب مواقيت الصلاة بالكامل
- `GET /qibla` -> حساب اتجاه القبلة (البوصلة)
- `GET /quran/timestamps/ayah?surah=1` -> توقيت آيات سورة معينة بالملي ثانية
- `GET /quran/timestamps/word?surah=1&ayah=1` -> توقيت الكلمات للمزامنة البصرية

---

## 📦 بناء مجموعات البيانات محلياً من المصدر

توجد جميع البيانات مباشرة داخل مجلد `/data` مقسمة لتسهيل المزامنة:
- القرآن الكريم: `data/quran/normalized/quran.json`
- التواقيت ومطابقة الصفحات: `data/quran/normalized/timestamps.json`
- الأحاديث النبوية وأجزائها:
  - `data/hadith/normalized/hadith.json`
  - `data/hadith/normalized/hadith_part_1.json`
  - `data/hadith/normalized/hadith_part_2.json`
- القراء والملفات الصوتية: `data/audio/normalized/audio-index.json`

لإعادة بناء مجموعات البيانات وتحديثها بالكامل من المصدر الأصلي:
```sh
pnpm sync:updates
```

---

## 🧪 الاختبارات (Testing)

تحتوي واجهات تطوير بايثون وجافا سكريبت على تغطية اختبار كاملة بنسبة 100%. يمكنك تشغيل الاختبارات عبر سطر الأوامر:

```sh
# تشغيل اختبارات JavaScript
npm test

# تشغيل اختبارات Python
python -m unittest tests/test_sdk.py
```
