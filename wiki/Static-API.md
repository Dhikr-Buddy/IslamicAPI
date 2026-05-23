# Static Raw Web API

The entire database can be accessed over a **static HTTP JSON API** without spinning up any backend, using raw GitHub CDN links.

---

## The Unified API Index

All raw dataset files are cataloged inside `data/api/index.json`. This index contains direct public URL endpoints for all normalized sub-datasets.

Index location:
```
https://raw.githubusercontent.com/Dhikr-Buddy/IslamicAPI/master/data/api/index.json
```

---

## File Resolution Map

| Key | Path | Description |
| :--- | :--- | :--- |
| **`quran`** | `data/quran/normalized/quran.json` | 6,236 ayah records with simple/uthmani text. |
| **`hadith`** | `data/hadith/normalized/hadith.json` | Bukhari, Muslim, and general collections corpus. |
| **`audio`** | `data/audio/normalized/audio-index.json` | Complete reciter profiles and url maps. |
| **`fonts`** | `data/fonts/normalized/fonts.json` | Mushaf font configurations and categories. |
| **`fontCss`** | `data/fonts/css/deen-fonts.css` | Ready-to-inject CSS font face declarations. |
| **`prayerMethods`** | `data/prayer/calculation-methods.json` | Pre-defined prayer calculation parameters. |
| **`sourceRegistry`** | `data/metadata/source-registry.json` | Complete provenance registry of crawlers. |

---

## Client Integration Examples

### 1. Browser/ESM client (`deen-web.js`)
We serve a lightweight ESM client that automatically bootstraps database loading:

```js
import { createDeenRawClient } from "https://dhikr-buddy.github.io/IslamicAPI/deen-web.js";

const deen = createDeenRawClient();

// Load full datasets directly in browser (extremely fast via CDNs)
const quran = await deen.loadQuran();
const hadith = await deen.loadHadith();

console.log(`Loaded ${quran.ayahs.length} ayahs.`);
```

### 2. Manual Fetch in JavaScript
To resolve URLs dynamically from the index:

```js
const indexUrl = "https://raw.githubusercontent.com/Dhikr-Buddy/IslamicAPI/master/data/api/index.json";

// 1. Load index
const index = await (await fetch(indexUrl)).json();

// 2. Fetch specific dataset
const quranData = await (await fetch(index.files.quran.url)).json();
console.log(quranData.ayahs[0].text.simple);
```
