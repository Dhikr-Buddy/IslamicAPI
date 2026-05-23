# JavaScript SDK

The `@deen/sdk` package provides offline-first helpers for Quranic text, Hadith, prayer times, Qibla calculations, and recitation lookups.

---

## Importing the SDK

```js
import {
  getSurah,
  getAyah,
  search,
  getHadith,
  randomHadith,
  calculatePrayerTimes,
  getQiblaDirection,
  getAudioUrl,
  getReciterList,
  getFontList,
  getFontCss
} from "@deen/sdk";
```

---

## API Reference

### 1. Quranic Queries

#### `getSurah(number)`
Retrieves a Surah metadata with its full list of ayahs.
*   **Parameters**: `number` (number | string)
*   **Returns**: `SurahObject | null`

```js
const surah = getSurah(1); // Al-Fatihah
console.log(surah.name); // "سُورَةُ الْفَاتِحَةِ"
console.log(surah.ayahs.length); // 7
```

#### `getAyah(surahNumber, ayahNumber)`
Gets a single Ayah record with exact text and original provenance metadata.
*   **Returns**: `AyahObject | null`

```js
const ayah = getAyah(1, 1);
console.log(ayah.text.simple); // "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
console.log(ayah.provenance[0].sourceUrl);
```

#### `search(query, options)`
Performs an offline case-insensitive search across normalized Quranic texts.
*   **Parameters**: `query` (string), `options.limit` (number, default: 25)
*   **Returns**: `Array<AyahObject>`

```js
const results = search("اهْدِنَا");
```

---

### 2. Hadith Corpus

#### `getHadith(id)`
Loads a single Hadith by its composite string identifier.
*   **Parameters**: `id` (string - format: `{collection}:{number}`)
*   **Returns**: `HadithObject | null`

```js
const hadith = getHadith("bukhari:3722");
console.log(hadith.text.ar); // Arabic text
console.log(hadith.text.en); // English translation
```

#### `randomHadith(options)`
Selects a random Hadith, with an optional collection filter.
*   **Parameters**: `options.collection` (string, e.g. `'bukhari'`, `'muslim'`)
*   **Returns**: `HadithObject | null`

```js
const rand = randomHadith({ collection: "muslim" });
```

---

### 3. Calculators (Prayer & Qibla)

#### `calculatePrayerTimes(input)`
Computes offline astronomical prayer times based on latitude, longitude, and date.
*   **Input fields**:
    *   `latitude` (number) - Required.
    *   `longitude` (number) - Required.
    *   `date` (string, format `'YYYY-MM-DD'`) - Optional, defaults to today.
    *   `timezone` (number) - Optional, defaults to local timezone.
    *   `method` (string) - Optional calculation method: `'MuslimWorldLeague'` (default), `'Egyptian'`, `'Karachi'`, `'UmmAlQura'`, `'Dubai'`, `'MoonsightingCommittee'`.
    *   `madhab` (string) - Optional, `'shafi'` (default) or `'hanafi'`.
*   **Returns**: Object containing formatted times (`'HH:MM'`).

```js
const times = calculatePrayerTimes({
  latitude: 40.7128,
  longitude: -74.006,
  timezone: -4,
  method: "MuslimWorldLeague"
});
console.log(times.fajr); // "04:12"
```

#### `getQiblaDirection(latitude, longitude)`
Calculates the exact geodetic Qibla bearing in degrees relative to true North.
*   **Returns**: `number` (compass bearing `0` to `360`).

```js
const bearing = getQiblaDirection(40.7128, -74.006);
console.log(bearing); // 58.48 degrees
```

---

### 4. Media & Assets

#### `getAudioUrl(reciterId, surahNumber, ayahNumber)`
Generates highly reliable recitation audio URLs. Supports both exact database indexing and automatic template fallback for string/numeric IDs.
*   **Returns**: `string | null`

```js
// String-based exact query
const url = getAudioUrl("1:1", 1, 1);

// Numeric fallback query
const fallbackUrl = getAudioUrl(1, 1, 1);
```

#### `getFontList()`
Lists available Mushaf font assets (WOFF2) for Uthmani, Naskh/Indopak, or plain Arabic rendering.
```js
const fonts = getFontList();
```
