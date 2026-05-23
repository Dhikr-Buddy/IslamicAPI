# Timestamps & Download Engines

IslamicAPI provides millisecond-accurate alignments of Quranic text with recitation audio streams at the **page, ayah, and word** levels. Additionally, it offers unified client and server download utilities.

---

## 1. Timing & Alignment System

To avoid the overhead and dependency of running heavy machine learning frameworks (like Whisper or Wav2Vec2) locally, IslamicAPI uses a hybrid timing system:
1. **Pre-Compiled Aligned Timestamps:** Standard, meticulously synchronized timing metadata for famous Surahs (like Al-Fatihah) are loaded directly from `data/quran/normalized/timestamps.json`.
2. **Dynamic Fallback Alignment Engine:** For other Surahs, the SDK dynamically calculates high-fidelity alignments proportionally based on character length and word counts, producing consistent, smooth word and ayah highlight markers instantly.

### API Reference (JavaScript)

```javascript
import { getAyahTimestamps, getWordTimestamps, getPageTimestamps } from "@deen/sdk";

// 1. Ayah Timestamps
const ayahs = getAyahTimestamps(1); 
// Returns: [{ ayahNumber: 1, start: 0.0, end: 6.2 }, ...]

// 2. Word Timestamps
const words = getWordTimestamps(1, 1);
// Returns: [{ word: "بِسْمِ", start: 0.0, end: 1.1 }, ...]

// 3. Page Timestamps (by Page System)
const page = getPageTimestamps(1);
// Returns: { page: 1, surahs: [{ surahNumber: 1, startAyah: 1, endAyah: 7, start: 0.0, end: 45.0 }] }
```

### API Reference (Python)

```python
from deensdk import get_ayah_timestamps, get_word_timestamps, get_page_timestamps

ayah_times = get_ayah_timestamps(1)
word_times = get_word_timestamps(1, 1)
page_times = get_page_timestamps(1)
```

---

## 2. Server & Client Download Engine

Downloading audio files directly to servers or prompt downloads on clients is built-in.

### Server-Side Download (Node Server)
Send an HTTP request to the local local development server:
```sh
GET /audio/download?reciterId=alafasy&surah=1
```
The server downloads the recitation to `data/audio/downloads/alafasy_1.mp3` and returns:
```json
{
  "success": true,
  "url": "https://server8.mp3quran.net/afs/001.mp3",
  "fileName": "alafasy_1.mp3",
  "filePath": "/Users/taslimakhan/Documents/IslamicAPI/data/audio/downloads/alafasy_1.mp3"
}
```

### Client-Side Download (Browser)
Trigger downloads directly in the user's browser using native file dialogs:
```javascript
import { downloadToClient, getAudioUrl } from "@deen/sdk";

const url = getAudioUrl("alafasy", 1);
downloadToClient(url, "fatihah_alafasy.mp3");
```
