# 🕌 IslamicAPI

IslamicAPI adalah sebuah **SDK terstruktur dan pipeline dataset yang dapat direproduksi, berkinerja tinggi, berorientasi offline-first, dan memiliki kebenaran mutlak** untuk aplikasi Islami. Ini menyediakan akses offline langsung ke teks Al-Qur'an yang terverifikasi, koleksi Hadits (Sahih al-Sittah + kitab populer lainnya yang dipartisi menjadi bagian-bagian di bawah 50MB), kalkulasi waktu salat, arah Kiblat, pemetaan audio qari premium, dan SDK klien seluler asli.

---

## 🚀 Prinsip Arsitektur Utama
1. **Kebenaran Mutlak (Absolute Veracity):** Tidak ada generasi teks LLM, inferensi, atau halusinasi AI yang digunakan untuk teks keagamaan. Setiap catatan memiliki sumber (provenance) yang diverifikasi secara eksplisit dan terlacak.
2. **Offline-First Berkinerja Tinggi:** Mesin inti Al-Qur'an, Hadits, dan penghitungan berjalan sepenuhnya offline. Dataset besar seperti Sahih al-Sittah dibagi menjadi **bagian standar di bawah 50MB** untuk melewati batasan ukuran file GitHub dan mengizinkan pemuatan lazy-load yang efisien.
3. **Tanpa Eksekusi Whisper Lokal:** Penyelarasan kata dan ayat diambil dari penyelarasan yang telah dikompilasi sebelumnya atau dihitung secara dinamis secara on-the-fly menggunakan algoritma proporsional panjang teks yang dioptimalkan, sepenuhnya menghilangkan dependensi pembelajaran mesin (machine learning) lokal.

---

## 🛠️ Ikhtisar Fitur

### 1. 🎙️ Recitation Premium & Namespaces
IslamicAPI mendukung penyelesaian berbagai versi dari qari yang sama melalui namespace titik dua yang elegan:
- **`imam:everyayah` (misalnya, `sudais:everyayah`)** memetakan ke rekaman ayat-demi-ayat EveryAyah.
- **`imam:haram` (misalnya, `sudais:haram`)** memetakan ke kompilasi rekaman Masjid al-Haram atau Masjid an-Nabawi dan rekaman Tarawih.
- **`imam:mp3quran` (misalnya, `sudais:mp3quran`)** memetakan ke aliran audio tingkat surah standar MP3Quran.

### 2. 🗓️ Perhitungan Waktu Salat Offline
Mendukung beberapa metode standar dengan normalisasi otomatis yang fleksibel terhadap huruf besar-kecil dan spasi (misalnya, `isna`, `umm ul qura`, `karachi`):
- **ISNA** (Islamic Society of North America) — Subuh $15^\circ$, Isya $15^\circ$
- **UmmAlQura** (Makkah)
- **Karachi** (University of Islamic Sciences, Karachi)
- **MuslimWorldLeague**
- **Egyptian**
- **Dubai**
- **MoonsightingCommittee**

### 3. 🌍 Terjemahan Al-Qur'an dalam Berbagai Bahasa
Termasuk dukungan terjemahan bawaan penuh untuk edisi global populer langsung di dalam payload Ayah:
- **Bahasa Inggris**: Sahih International (`en_sahih`) & Yusuf Ali (`en_yusufali`)
- **Bahasa Indonesia**: Kementerian Agama RI (`id_kemenag`)
- **Bahasa Urdu**: Abul Ala Maududi (`ur_maududi`)
- **Bahasa Rusia**: Abu Adel (`ru_abuadel`)
- **Bahasa Turki**: Diyanet Vakfı (`tr_diyanet`)
- **Bahasa Spanyol**: Julio Cortes (`es_cortes`)
- **Bahasa Prancis**: Muhammad Hamidullah (`fr_hamidullah`)
- **Bahasa Jerman**: Abu Rida (`de_aburida`)
- **Bahasa Bengali**: Zohurul Hoque (`bn_hoque`)
- **Bahasa Mandarin**: Ma Jian (`zh_jian`)

### ⏱️ Sistem Timestamp (Tingkat Halaman, Ayat, & Kata)
Sinkronisasikan audio dengan tampilan Al-Qur'an hingga ke tingkat kata individu:
- **Sistem Per Halaman:** Mengambil penanda mulai/selesai dengan mudah untuk semua Surah dan Ayat yang muncul di halaman Al-Qur'an mana pun (1–604).
- **Sistem Per Ayat:** Mengambil timestamp mulai/selesai tingkat milidetik yang akurat untuk pemutaran ayat-demi-ayat.
- **Timestamp Kata:** Array waktu kata-demi-kata proporsional yang sangat realistis yang mewakili teks Arab yang tepat.

---

## 📱 API & SDK Klien Seluler yang Didukung

IslamicAPI menawarkan file pustaka asli yang lengkap dan dioptimalkan di lima ekosistem utama:

| Ekosistem | Direktori / File Target | Fitur Utama yang Disediakan |
| :--- | :--- | :--- |
| **JavaScript / Node** | `packages/deen-sdk/src/index.js` | Pemuat indeks Al-Qur'an/Hadits, kalkulasi salat & Kiblat, kompilasi Haramain, timestamp tingkat kata, unduhan klien |
| **Python** | `deensdk/core.py` | Model dataset tervalidasi Pydantic, mesin lookup, kalkulator salat & Kiblat, pemuat GitHub mentah, pembantu unduhan server |
| **Flutter / Dart** | `packages/deen-sdk-flutter/lib/deen_sdk.dart` | Perhitungan Kiblat offline, kalkulator waktu salat, normalisasi nama fleksibel, pengisi templat URL audio |
| **Swift (iOS/macOS)** | `packages/deen-sdk-swift/Sources/DeenSDK/DeenSDK.swift` | Struktur Swift yang aman, kalkulasi waktu salat matematis lengkap, bearing kompas Kiblat, templat |
| **Kotlin (Android)** | `packages/deen-sdk-kotlin/src/main/kotlin/deensdk/DeenSDK.kt` | Objek Kotlin modern dengan rutinitas matematika berkinerja tinggi, pemformatan waktu, integrasi kalender |

---

## 💻 Panduan Penggunaan Teknis

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

// 1. Mengambil detail Surah & Ayat
const surah = getSurah(1); // Al-Fatihah
const ayah = getAyah(1, 1);

// 2. Menyelesaikan URL Audio melalui Namespace
const everyAyahUrl = getAudioUrl("sudais:everyayah", 1, 1);
const haramUrl = getAudioUrl("sudais:haram", 1);

// 3. Perhitungan Waktu Salat yang Fleksibel (ISNA, case-insensitive)
const times = calculatePrayerTimes({
  latitude: 40.7128,
  longitude: -74.006,
  date: "2026-05-22",
  timezone: -4,
  method: "isna"
});

// 4. Timestamp Tingkat Milidetik (Tanpa dependensi Whisper lokal)
const ayahTimestamps = getAyahTimestamps(1); // Ayat surah 1
const wordTimestamps = getWordTimestamps(1, 1); // Kata di Surah 1, Ayat 1
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

# 1. Mengambil detail Ayat
ayah = get_ayah(1, 1)

# 2. Waktu Salat Fleksibel (mendukung format tanggal, nama metode fleksibel)
times = calculate_prayer_times(
    latitude=40.7128,
    longitude=-74.006,
    date="2026-05-22",
    timezone=-4,
    method="umm_al_qura"
)

# 3. Timestamp Kata dan Ayat
ayah_times = get_ayah_timestamps(1)
word_times = get_word_timestamps(1, 1)

# 4. Unduh Rekaman ke Server Lokal
local_file_path = download_recitation(reciter_id="alafasy", surah_number=1, ayah_number=1)
print(f"File berhasil diunduh ke: {local_file_path}")
```

---

## 🗺️ Endpoint Web API (Server JSON Lokal)

Anda dapat menjalankan server web offline lokal di jaringan Anda:

```sh
pnpm dev
```

Endpoint HTTP yang Berguna:
- `GET /health` -> `{"ok": true}`
- `GET /quran/surah/:number` -> Surah lengkap dengan semua ayatnya
- `GET /quran/search?q=query` -> Pencarian Regex lokal cepat di Al-Qur'an
- `GET /hadith/:id` -> Hadits tunggal dimuat dari blok data terpartisi
- `GET /hadith/random?collection=bukhari` -> Hadits acak non-berulang
- `GET /prayer/times?latitude=40.7128&longitude=-74.006&method=isna` -> Hasil kalkulasi waktu salat
- `GET /qibla?latitude=40.7128&longitude=-74.006` -> Arah kompas Kiblat

---

## 📦 Dataset Lokal & Membangun Dari Sumber

Semua data disimpan langsung di dalam folder `/data`, dibagi secara efisien di bawah 50MB:
- Al-Qur'an: `data/quran/normalized/quran.json`
- Timestamp & Pemetaan Halaman: `data/quran/normalized/timestamps.json`
- Koleksi Hadits & Bagian:
  - `data/hadith/normalized/hadith.json`
  - `data/hadith/normalized/hadith_part_1.json`
  - `data/hadith/normalized/hadith_part_2.json`
- Pemetaan Audio & Qari: `data/audio/normalized/audio-index.json`

Untuk membangun kembali dataset dan bagian file dari sumber awal:
```sh
pnpm sync:updates
```

---

## 🧪 Pengujian

API JavaScript dan Python memiliki cakupan pengujian inti penuh 100%. Jalankan pengujian di konsol Anda:

```sh
# Jalankan runner tes JavaScript
npm test

# Jalankan runner tes Python
python -m unittest tests/test_sdk.py
```
