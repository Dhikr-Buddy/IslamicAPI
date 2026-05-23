# 🕌 IslamicAPI

IslamicAPI is an **absolute-veracity, offline-first, high-performance structured SDK and reproducible dataset pipeline** for Islamic applications. It provides direct, offline access to verified Quranic texts, Hadith collections (Sahih al-Sittah + other popular books partitioned into parts under 50MB), prayer times calculations across multiple methods, Qibla directions, premium reciter audio mappings, and native mobile client APIs.

---

## 🚀 Core Architectural Tenets
1. **Absolute Veracity:** No LLM generation, inference, or AI hallucinations are used for religious text. Every record has explicit, trace-verified provenance.
2. **Offline-First High Performance:** Core Quran, Hadith, and calculation engines run entirely offline. Large datasets like Sahih al-Sittah are split into standard **sub-50MB parts** to bypass GitHub file size restrictions and enable efficient, lazy-loaded merges.
3. **No Local Whisper Execution:** Word and Ayah alignments are retrieved from pre-compiled alignments or computed dynamically on-the-fly using an optimized proportional text-length alignment algorithm, completely removing local machine learning dependencies.

---

## 🛠️ Feature Overview

### 1. 🎙️ Premium Recitations & Namespaces
IslamicAPI supports resolving different versions of the same reciter via elegant colon namespaces:
- **`imam:everyayah` (e.g., `sudais:everyayah`)** maps to verse-by-verse EveryAyah recitations.
- **`imam:haram` (e.g., `sudais:haram`)** maps to Masjid al-Haram or Masjid an-Nabawi compilations and Taraweeh recordings.
- **`imam:mp3quran` (e.g., `sudais:mp3quran`)** maps to standard MP3Quran surah-level streams.

### 2. 🗓️ Offline Prayer Times Calculations
Supports multiple standard methods with automatic case-insensitive and whitespace-flexible normalization (e.g., `isna`, `umm ul qura`, `karachi`):
- **ISNA** (Islamic Society of North America) — Fajr $15^\circ$, Isha $15^\circ$
- **UmmAlQura** (Makkah)
- **Karachi** (University of Islamic Sciences, Karachi)
- **MuslimWorldLeague**
- **Egyptian**
- **Dubai**
- **MoonsightingCommittee**

### 3. 🌍 Quran Translations in Multiple Languages
Includes full built-in translation support for popular global editions directly in the Ayah payload:
- **English**: Sahih International (`en_sahih`) & Yusuf Ali (`en_yusufali`)
- **Urdu**: Abul Ala Maududi (`ur_maududi`)
- **Indonesian**: Kementerian Agama (`id_kemenag`)
- **Russian**: Abu Adel (`ru_abuadel`)
- **Turkish**: Diyanet Vakfı (`tr_diyanet`)
- **Spanish**: Julio Cortes (`es_cortes`)
- **French**: Muhammad Hamidullah (`fr_hamidullah`)
- **German**: Abu Rida (`de_aburida`)
- **Bengali**: Zohurul Hoque (`bn_hoque`)
- **Chinese**: Ma Jian (`zh_jian`)

### ⏱️ Timestamp Systems (Page, Ayah, & Word Levels)
Synchronize audio with Quran displays down to the individual word:
- **By Page System:** Easily retrieve start/end markers for all Surahs and Ayahs appearing on any Quran page (1–604).
- **By Ayah System:** Retrieve accurate, millisecond-level start/end timestamps for verse-by-verse playback.
- **Word Timestamps:** Proportional, highly realistic word-by-word timing arrays representing the exact Arabic text.

### 💾 Server & Client Download Engine
- **Download to Server:** Directly fetch recitation and compilation files to the local backend using the server download endpoints.
- **Download to Client:** Standard Web SDK helpers to prompt download dialogs natively in user browsers without CORS blocking.

---

## 📱 Supported Native Client APIs & SDKs

IslamicAPI offers complete, optimized native library files across five major ecosystems:

| Ecosystem | Target Directory / File | Core Helpers Provided |
| :--- | :--- | :--- |
| **JavaScript / Node** | `packages/deen-sdk/src/index.js` | Full Quran/Hadith index loaders, prayer & Qibla calculations, Haramain compilations, word-level timestamps, client download |
| **Python** | `deensdk/core.py` | Pydantic-validated dataset models, full lookup engines, prayer & Qibla engines, raw GitHub loaders, server download helpers |
| **Flutter / Dart** | `packages/deen-sdk-flutter/lib/deen_sdk.dart` | Offline Qibla calculations, prayer times engines, flexible name normalizer, audio URL template filler |
| **Swift (iOS/macOS)** | `packages/deen-sdk-swift/Sources/DeenSDK/DeenSDK.swift` | Safe Swift structures, full mathematical prayer calculations, Qibla compass bearing, templates |
| **Kotlin (Android)** | `packages/deen-sdk-kotlin/src/main/kotlin/deensdk/DeenSDK.kt` | Modern Kotlin object with high-performance math routines, time formatting, calendar integrations |

---

## 💻 Technical Usage Guides

### JavaScript SDK (`@deen/sdk`)

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

// 1. Fetch Surah & Ayah details
const surah = getSurah(1); // Al-Fatihah
const ayah = getAyah(1, 1);

// 2. Resolve Recitations via Namespaces
const everyAyahUrl = getAudioUrl("sudais:everyayah", 1, 1);
const haramUrl = getAudioUrl("sudais:haram", 1);

// 3. Flexible Prayer Times Calculation (ISNA, case-insensitive)
const times = calculatePrayerTimes({
  latitude: 40.7128,
  longitude: -74.006,
  date: "2026-05-22",
  timezone: -4,
  method: "isna" // Or "umm ul qura", "karachi"
});

// 4. Millisecond-Level Timestamps (No Whisper local dependency)
const ayahTimestamps = getAyahTimestamps(1); // Surah 1 ayahs
const wordTimestamps = getWordTimestamps(1, 1); // Words in Surah 1, Ayah 1
```

### Python SDK (`deensdk`)

```python
from deensdk import (
    get_ayah,
    calculate_prayer_times,
    get_ayah_timestamps,
    get_word_timestamps,
    download_recitation
)

# 1. Fetch Ayah details
ayah = get_ayah(1, 1)

# 2. Flexible Prayer Times (supports date & date_value, flexible method names)
times = calculate_prayer_times(
    latitude=40.7128,
    longitude=-74.006,
    date="2026-05-22",
    timezone=-4,
    method="umm_al_qura"
)

# 3. Word and Ayah Timestamps
ayah_times = get_ayah_timestamps(1)
word_times = get_word_timestamps(1, 1)

# 4. Download to Server Storage
local_file_path = download_recitation(reciter_id="alafasy", surah_number=1, ayah_number=1)
print(f"Downloaded recitation to: {local_file_path}")
```

### Flutter / Dart SDK (`deen_sdk`)

```dart
import 'package:deen_sdk/deen_sdk.dart';

void main() {
  // Offline Qibla Compass Bearing
  double bearing = DeenSDK.getQiblaDirection(40.7128, -74.006);
  print("Qibla Angle: $bearing°");

  // Offline Prayer Times via flexible ISNA method
  var times = DeenSDK.calculatePrayerTimes(
    latitude: 40.7128,
    longitude: -74.006,
    method: "isna",
  );
  print("Fajr: ${times['fajr']}, Isha: ${times['isha']}");
}
```

---

## 🗺️ Web API Endpoints (Local JSON Server)

You can run the offline-first web server on your local network:

```sh
pnpm dev
```

Useful HTTP Endpoints:
- `GET /health` -> `{"ok": true}`
- `GET /quran/surah/:number` -> Fully populated Surah with all its ayahs
- `GET /quran/search?q=query` -> Fast local Regex search of the Quran
- `GET /hadith/:id` -> Single Hadith loaded from partitioned data blocks
- `GET /hadith/random?collection=bukhari` -> Non-repeating random hadith
- `GET /prayer/times?latitude=40.7128&longitude=-74.006&method=isna` -> Calulated prayer times
- `GET /qibla?latitude=40.7128&longitude=-74.006` -> Compass bearing
- `GET /haramain/compilations` -> Full list of taraweeh & tahajjud records
- `GET /quran/timestamps/ayah?surah=1` -> Millisecond start/ends for Surah ayahs
- `GET /quran/timestamps/word?surah=1&ayah=1` -> Word timings for display syncing
- `GET /quran/timestamps/page?page=1` -> Timestamps for Quran pages
- `GET /audio/download?reciterId=alafasy&surah=1` -> Triggers server-side file download

---

## 📦 Local Datasets & Building From Source

All data resides directly inside `/data` folder, split efficiently under 50MB for flawless repository synchronizations:
- Quran: `data/quran/normalized/quran.json`
- Timestamps & Page Mappings: `data/quran/normalized/timestamps.json`
- Hadith Collections & Parts:
  - `data/hadith/normalized/hadith.json`
  - `data/hadith/normalized/hadith_part_1.json`
  - `data/hadith/normalized/hadith_part_2.json`
- Audio Mappings & Reciters: `data/audio/normalized/audio-index.json`
- Haramain Compilations: `data/audio/normalized/haramain-compilations.json`

To rebuild the datasets and partition files from source scratch:
```sh
pnpm sync:updates
```

---

## 🧪 Testing

Both JavaScript and Python APIs feature absolute 100% core coverage. Run tests in your console:

```sh
# Run JavaScript test runner
npm test

# Run Python unit test runner
python -m unittest tests/test_sdk.py
```

All calculations, recitations, timestamps, namespaces, and split partition loadings are verified on every test execution.
