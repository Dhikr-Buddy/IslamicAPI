# 🕌 IslamicAPI (اسلامک اے پی آئی)

اسلامک اے پی آئی (IslamicAPI) ایک **انتہائی درست، آف لائن فرسٹ، تیز رفتار اور دوبارہ تیار کی جانے والی ڈیٹا سیٹ پائپ لائن** ہے جو اسلامک ایپلی کیشنز کے لیے تیار کی گئی ہے۔ یہ تصدیق شدہ قرآنی متن، احادیث کے مجموعے (صحاح ستہ اور دیگر مقبول کتابیں جو 50MB سے چھوٹے حصوں میں تقسیم ہیں)، نماز کے اوقات، قبلہ کی سمت، معروف قاریوں کی آڈیو میپنگز، اور موبائل کلائنٹ SDKs تک براہ راست، آف لائن رسائی فراہم کرتا ہے۔

---

## 🚀 بنیادی تعمیراتی اصول (Core Architectural Tenets)
1. **مطلق سچائی (Absolute Veracity):** مذہبی متن کے لیے کسی بھی قسم کی مصنوعی ذہانت یا لاجک ماڈلز (LLMs) کا استعمال نہیں کیا گیا ہے تاکہ غلط معلومات یا مغالطے (hallucinations) سے بچا جا سکے۔ ہر ریکارڈ کے مستند ذرائع واضح طور پر ظاہر کیے گئے ہیں۔
2. **آف لائن فرسٹ اور اعلی کارکردگی (Offline-First):** قرآن، حدیث، اور نماز کے اوقات کا بنیادی انجن مکمل طور پر آف لائن کام کرتا ہے۔ بڑے ڈیٹا سیٹس (جیسے صحاح ستہ) کو **50MB سے چھوٹے حصوں** میں تقسیم کیا گیا ہے تاکہ گٹ ہب (GitHub) پر فائل سائز کی پابندیوں سے بچا جا سکے اور بوقت ضرورت آسانی سے لوڈ کیا جا سکے۔
3. **مشین لرننگ پر انحصار کا خاتمہ:** الفاظ اور آیات کی آڈیو ٹائمنگز پہلے سے تیار کردہ ریکارڈز سے حاصل کی جاتی ہیں یا ان کی لمبائی کے حساب سے الگورتھم کے ذریعے متحرک طور پر تیار کی جاتی ہیں، جس سے لوکل سسٹم پر مشین لرننگ ماڈلز (جیسے Whisper) چلانے کی ضرورت بالکل ختم ہو جاتی ہے۔

---

## 🛠️ خصوصیات کا جائزہ (Feature Overview)

### 🎙️ 1. معروف تلاوتیں اور نیم اسپیسز (Namespaces)
اسلامک اے پی آئی مختلف ورژنز اور قاریوں کو خوبصورت نوٹیشنز کے ذریعے تلاش کرنے میں مدد دیتا ہے:
- **`imam:everyayah` (مثال: `sudais:everyayah`)** آیت بہ آیت تلاوت (EveryAyah)۔
- **`imam:haram` (مثال: `sudais:haram`)** مسجد الحرام اور مسجد نبوی کے تراویح اور تلاوت کے ریکارڈز۔
- **`imam:mp3quran` (مثال: `sudais:mp3quran`)** ایم پی تھری قرآن (MP3Quran) سے سورت کی سطح پر آڈیو اسٹریمز۔

### 🗓️ 2. نماز کے اوقات کا حساب (Offline Prayer Times)
مختلف بین الاقوامی معیاری طریقوں کو قبول کرتا ہے اور ناموں کے اسپیلنگ کو خودکار طور پر درست کرتا ہے (جیسے `isna`, `umm ul qura`, `karachi`):
- **ISNA** (اسلامک سوسائٹی آف نارتھ امریکہ) — فجر $15^\circ$، عشاء $15^\circ$
- **UmmAlQura** (ام القراء مکہ مکرمہ)
- **Karachi** (جامعہ العلوم الاسلامیہ کراچی)
- **MuslimWorldLeague** (رابطہ عالم اسلامی)
- **Egyptian** (مصری سروے اتھارٹی)
- **Dubai** (دبئی)
- **MoonsightingCommittee** (رؤیت ہلال کمیٹی)

### 🌍 3. متعدد زبانوں میں قرآنی تراجم
آیت کے رسپانس پے لوڈ میں براہ راست دنیا کی مقبول زبانوں کے تراجم شامل ہیں:
- **انگریزی**: Sahih International (`en_sahih`) اور Yusuf Ali (`en_yusufali`)
- **اردو**: ابوالاعلیٰ مودودی (`ur_maududi`)
- **انڈونیشین**: وزارت مذہبی امور (`id_kemenag`)
- **روسی**: ابو عادل (`ru_abuadel`)
- **ترک**: دیانت وقف (`tr_diyanet`)
- **اسپینی**: جولیوس کورٹیز (`es_cortes`)
- **فرانسیسی**: محمد حمید اللہ (`fr_hamidullah`)
- **جرمن**: ابو رضا (`de_aburida`)
- **بنگالی**: ظہور الحق (`bn_hoque`)
- **چینی**: ما جیان (`zh_jian`)

### ⏱️ ٹائم اسٹیمپ سسٹمز (صفحہ، آیت اور لفظ کی سطح پر)
آڈیو تلاوت کو قرآنی متن کے ساتھ بالکل درست ترتیب دینے کے لیے:
- **صفحہ وار سسٹم:** قرآن مجید کے صفحات (1 سے 604) میں آنے والی سورتوں اور آیات کے شروعاتی اور آخری وقت کی معلومات حاصل کریں۔
- **آیت وار سسٹم:** ہر آیت کی پلے بیک کے لیے ملی سیکنڈ کی سطح پر دورانیہ اور ٹائمنگز حاصل کریں۔
- **لفظ وار سسٹم:** عربی الفاظ کے حساب سے انتہائی حقیقت پسندانہ ٹائم اسٹیمپس جو ہر لفظ کی تلاوت کی درست ٹائمنگ کو ظاہر کرتے ہیں۔

---

## 📱 سپورٹڈ کلائنٹ لائبریریز (SDKs)

اسلامک اے پی آئی پانچ بڑے ماحولوں میں بہترین اور آپٹمائزڈ لائبریری فائلز فراہم کرتا ہے:

| ایکو سسٹم | لائبریری ڈائریکٹری/فائل | بنیادی فراہم کردہ فنکشنز |
| :--- | :--- | :--- |
| **JavaScript / Node** | `packages/deen-sdk/src/index.js` | قرآن وحدیث کا انڈیکس، نماز اور قبلہ کا حساب، حرمین کے تلاوت مجموعے، الفاظ کے ٹائم اسٹیمپس |
| **Python** | `deensdk/core.py` | پائڈانٹک (Pydantic) سے تصدیق شدہ ماڈلز، تلاش کے انجن، قبلہ و نماز، گٹ ہب لوڈر اور ڈاؤن لوڈر |
| **Flutter / Dart** | `packages/deen-sdk-flutter/lib/deen_sdk.dart` | آف لائن قبلہ ڈائرکشن، نماز کے اوقات کا حساب، لچکدار ناموں کی اصلاح، آڈیو ٹیمپلیٹس |
| **Swift (iOS/macOS)** | `packages/deen-sdk-swift/Sources/DeenSDK/DeenSDK.swift` | سوئفٹ کے محفوظ اسٹرکچرز، نماز کے اوقات کی فل میتھ میٹیکل کیلکولیشن، قبلہ کمپاس اور ٹیمپلیٹس |
| **Kotlin (Android)** | `packages/deen-sdk-kotlin/src/main/kotlin/deensdk/DeenSDK.kt` | کوٹلن آبجیکٹ برائے نماز اوقات، ٹائم فارمیٹنگ اور کیلنڈر انٹیگریشنز |

---

## 💻 ٹیکنیکل گائیڈ (Technical Usage Guides)

### جاوا اسکرپٹ لائبریری (`@deen/sdk`)

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

// 1. سورت اور آیت کی معلومات حاصل کریں
const surah = getSurah(1); // سورہ الفاتحہ
const ayah = getAyah(1, 1);

// 2. قاریوں کے آڈیو لنکس حاصل کریں
const everyAyahUrl = getAudioUrl("sudais:everyayah", 1, 1);
const haramUrl = getAudioUrl("sudais:haram", 1);

// 3. نماز کے اوقات کا حساب لگائیں
const times = calculatePrayerTimes({
  latitude: 40.7128,
  longitude: -74.006,
  date: "2026-05-22",
  timezone: -4,
  method: "isna"
});

// 4. آیت اور الفاظ کے ٹائم اسٹیمپس حاصل کریں
const ayahTimestamps = getAyahTimestamps(1);
const wordTimestamps = getWordTimestamps(1, 1);
```

### پائتھون لائبریری (`deensdk`)

```python
from deensdk import (
    get_ayah,
    calculate_prayer_times,
    get_ayah_timestamps,
    get_word_timestamps,
    download_recitation
)

# 1. آیت کی معلومات حاصل کریں
ayah = get_ayah(1, 1)

# 2. نماز کے اوقات کا حساب لگائیں
times = calculate_prayer_times(
    latitude=40.7128,
    longitude=-74.006,
    date="2026-05-22",
    timezone=-4,
    method="umm_al_qura"
)

# 3. الفاظ اور آیت کی ٹائمنگز
ayah_times = get_ayah_timestamps(1)
word_times = get_word_timestamps(1, 1)

# 4. تلاوت لوکل سرور پر ڈاؤن لوڈ کریں
local_file_path = download_recitation(reciter_id="alafasy", surah_number=1, ayah_number=1)
print(f"Downloaded recitation to: {local_file_path}")
```

---

## 🗺️ لوکل ویب سرور لنکس (HTTP Endpoints)

آپ اپنے لوکل سسٹم پر آف لائن ویب سرور چلا سکتے ہیں:

```sh
pnpm dev
```

دستیاب لنکس (HTTP Endpoints):
- `GET /health` -> سرور صحت کی رپورٹ `{"ok": true}`
- `GET /quran/surah/:number` -> مکمل سورت مع آیات کے
- `GET /quran/search?q=query` -> قرآن مجید میں تیز رفتار لوکل سرچ
- `GET /hadith/:id` -> مخصوص حدیث کا حصول
- `GET /hadith/random?collection=bukhari` -> رینڈم حدیث کا حصول
- `GET /prayer/times` -> نماز کے اوقات کا حساب
- `GET /qibla` -> قبلہ کی سمت (کمپاس بیرنگ)

---

## 📦 سورس کوڈ سے ڈیٹا کی تعمیر

تمام ڈیٹا سورس فائلز گٹ ہب سنک کے لیے `/data` فولڈر میں موجود ہیں:
- قرآن مجید: `data/quran/normalized/quran.json`
- ٹائم اسٹیمپس: `data/quran/normalized/timestamps.json`
- احادیث کے مجموعے:
  - `data/hadith/normalized/hadith.json`
  - `data/hadith/normalized/hadith_part_1.json`
  - `data/hadith/normalized/hadith_part_2.json`

ڈیٹا سیٹس کو سورس سے دوبارہ بنانے اور سنک کرنے کے لیے:
```sh
pnpm sync:updates
```

---

## 🧪 ٹیسٹنگ (Testing)

پائتھون اور جاوا اسکرپٹ دونوں لائبریریوں میں 100% ٹیسٹ کوریج موجود ہے۔ اپنے لوکل سسٹم پر ٹیسٹ چلائیں:

```sh
# جاوا اسکرپٹ ٹیسٹ چلائیں
npm test

# پائتھون ٹیسٹ چلائیں
python -m unittest tests/test_sdk.py
```
