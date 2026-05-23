# 🕌 IslamicAPI

IslamicAPI, İslami uygulamalar geliştirmek için tasarlanmış **mutlak doğrulukta (absolute veracity), çevrimdışı öncelikli (offline-first), yüksek performanslı yapılandırılmış bir yazılım geliştirme kiti (SDK) ve yeniden üretilebilir veri kümesi veri hattıdır (pipeline)**. Doğrulanmış Kur'an-ı Kerim metinlerine, Hadis koleksiyonlarına (Kütüb-i Sitte ve 50MB altındaki bölümlere ayrılmış diğer popüler kitaplar), çevrimdışı namaz vakti hesaplamalarına, Kıble yönüne, premium hafız ses eşlemelerine ve yerel mobil istemci API'lerine doğrudan erişim sağlar.

---

## 🚀 Temel Mimari İlkeler
1. **Mutlak Doğruluk (Absolute Veracity):** Dini metinlerde yapay zeka halüsinasyonlarını veya yanlış bilgileri önlemek amacıyla hiçbir LLM üretimi, çıkarımı veya AI aracı kullanılmaz. Her bir kaydın izlenebilir, açık kaynak doğrulaması mevcuttur.
2. **Çevrimdışı Öncelikli Yüksek Performans:** Çekirdek Kur'an, Hadis ve hesaplama motorları tamamen çevrimdışı çalışır. Kütüb-i Sitte gibi büyük veri kümeleri, GitHub dosya boyutu sınırlarını aşmamak ve bellek kullanımını optimize etmek amacıyla **50MB'ın altındaki standart parçalara** ayrılmıştır.
3. **Yerel Yapay Zeka Model Bağımlılığı Yoktur:** Kelime ve Ayet bazlı ses eşlemeleri, önceden derlenmiş dosyalardan alınır veya metin uzunluğuna dayalı optimize edilmiş orantısal bir algoritma ile anında dinamik olarak hesaplanır. Böylece yerel sistemlerde yapay zeka modelleri çalıştırma bağımlılığı (örneğin Whisper) tamamen ortadan kalkar.

---

## 🛠️ Özelliklere Genel Bakış

### 1. 🎙️ Premium Kıraatler ve Ad Alanları (Namespaces)
IslamicAPI, bir hafızın farklı kayıt türlerini zarif ad alanları (namespaces) kullanarak çözümler:
- **`imam:everyayah` (örneğin, `sudais:everyayah`)** ayet ayet EveryAyah kıraatlerine eşlenir.
- **`imam:haram` (örneğin, `sudais:haram`)** Mescid-i Haram veya Mescid-i Nebevi kayıtlarına ve Teravih derlemelerine eşlenir.
- **`imam:mp3quran` (örneğin, `sudais:mp3quran`)** MP3Quran üzerindeki standart sure düzeyindeki ses akışlarına eşlenir.

### 2. 🗓️ Çevrimdışı Namaz Vakti Hesaplama
Otomatik büyük/küçük harf duyarsızlığı ve esnek ad doğrulaması ile birçok standart hesaplama metodunu destekler (örneğin, `isna`, `umm ul qura`, `karachi`):
- **ISNA** (Islamic Society of North America) — Fajr $15^\circ$, Isha $15^\circ$
- **UmmAlQura** (Mekke)
- **Karachi** (University of Islamic Sciences, Karachi)
- **MuslimWorldLeague**
- **Egyptian**
- **Dubai**
- **MoonsightingCommittee**

### 3. 🌍 Çok Dilli Kur'an Mealleri
Ayet yanıt içeriğinde doğrudan en popüler küresel mealleri barındırır:
- **Türkçe**: Diyanet İşleri Vakfı Meali (`tr_diyanet`)
- **İngilizce**: Sahih International (`en_sahih`) & Yusuf Ali (`en_yusufali`)
- **Arapça**: Kur'an-ı Kerim Basit Metni (`simple` & `uthmani`)
- **Urduca**: Abul Ala Maududi (`ur_maududi`)
- **Endonezce**: Kementerian Agama (`id_kemenag`)
- **Rusça**: Abu Adel (`ru_abuadel`)
- **İspanyolca**: Julio Cortes (`es_cortes`)
- **Fransızca**: Muhammad Hamidullah (`fr_hamidullah`)
- **Almanca**: Abu Rida (`de_aburida`)
- **Bengalce**: Zohurul Hoque (`bn_hoque`)
- **Çince**: Ma Jian (`zh_jian`)

### ⏱️ Zaman Damgası Sistemleri (Sayfa, Ayet ve Kelime Düzeyinde)
Sesi Kur'an-ı Kerim ekranı ile tek bir kelime düzeyine kadar eşzamanlı hale getirin:
- **Sayfa Bazlı Sistem:** Herhangi bir Kur'an sayfasında (1-604) görünen tüm sure ve ayetlerin başlangıç/bitiş işaretçilerini kolayca alın.
- **Ayet Bazlı Sistem:** Ayet ayet oynatma için milisaniye düzeyinde doğru başlangıç/bitiş zaman damgalarını alın.
- **Kelime Zaman Damgaları:** Tam Arapça metni temsil eden, orantılı ve son derece gerçekçi kelime kelime zamanlama dizileri.

---

## 📱 Desteklenen Yerel Mobil İstemci API'leri ve SDK'lar

IslamicAPI, beş büyük yazılım ekosisteminde tamamen optimize edilmiş yerel kütüphane dosyaları sunar:

| Ekosistem | Hedef Dizin / Dosya | Sağlanan Çekirdek Yardımcı Araçlar |
| :--- | :--- | :--- |
| **JavaScript / Node** | `packages/deen-sdk/src/index.js` | Kur'an/Hadis dizin yükleyicileri, namaz ve Kıble hesaplamaları, Haremeyn derlemeleri, kelime düzeyinde zaman damgaları |
| **Python** | `deensdk/core.py` | Pydantic onaylı veri modelleri, arama motorları, Kıble ve namaz motoru, GitHub ham veri yükleyicileri, sunucu indirme yardımcıları |
| **Flutter / Dart** | `packages/deen-sdk-flutter/lib/deen_sdk.dart` | Çevrimdışı Kıble yönü hesaplama, namaz vakitleri, esnek ad normalleştirici, ses URL şablonu doldurucu |
| **Swift (iOS/macOS)** | `packages/deen-sdk-swift/Sources/DeenSDK/DeenSDK.swift` | Tür güvenli Swift yapıları, tam matematiksel namaz hesaplamaları, Kıble pusula açısı yardımı |
| **Kotlin (Android)** | `packages/deen-sdk-kotlin/src/main/kotlin/deensdk/DeenSDK.kt` | Yüksek performanslı matematik rutinleri, zaman biçimlendirme ve takvim entegrasyonlarına sahip modern Kotlin nesnesi |

---

## 💻 Teknik Kullanım Kılavuzları

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

// 1. Sure ve Ayet Detaylarını Getir
const surah = getSurah(1); // Fatiha Suresi
const ayah = getAyah(1, 1);

// 2. Hafız Ses Bağlantılarını Çözümle
const everyAyahUrl = getAudioUrl("sudais:everyayah", 1, 1);
const haramUrl = getAudioUrl("sudais:haram", 1);

// 3. Esnek Namaz Vakti Hesaplama (ISNA, büyük/küçük harfe duyarsız)
const times = calculatePrayerTimes({
  latitude: 40.7128,
  longitude: -74.006,
  date: "2026-05-22",
  timezone: -4,
  method: "isna"
});

// 4. Milisaniye Düzeyinde Zaman Damgaları
const ayahTimestamps = getAyahTimestamps(1); // Sure 1 ayetleri
const wordTimestamps = getWordTimestamps(1, 1); // Sure 1, Ayet 1 kelimeleri
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

# 1. Ayet Detaylarını Getir
ayah = get_ayah(1, 1)

# 2. Çevrimdışı Namaz Vakitleri Hesaplama
times = calculate_prayer_times(
    latitude=40.7128,
    longitude=-74.006,
    date="2026-05-22",
    timezone=-4,
    method="umm_al_qura"
)

# 3. Kelime ve Ayet Zaman Damgaları
ayah_times = get_ayah_timestamps(1)
word_times = get_word_timestamps(1, 1)

# 4. Sunucu Depolamasına Oynatım İndir
local_file_path = download_recitation(reciter_id="alafasy", surah_number=1, ayah_number=1)
print(f"İndirilen kıraat dosyasının yolu: {local_file_path}")
```

---

## 🗺️ Web API Uç Noktaları (Yerel Sunucu)

Çevrimdışı yerel sunucuyu ağınızda çalıştırabilirsiniz:

```sh
pnpm dev
```

Kullanışlı HTTP Uç Noktaları:
- `GET /health` -> `{"ok": true}`
- `GET /quran/surah/:number` -> Sure ve içindeki tüm ayetler
- `GET /quran/search?q=query` -> Kur'an-ı Kerim içinde hızlı yerel arama
- `GET /hadith/:id` -> Parçalı dosyalardan yüklenen tek bir Hadis
- `GET /hadith/random?collection=bukhari` -> Rastgele, tekrarlamayan hadis getirici
- `GET /prayer/times` -> Hesaplanan namaz vakitleri
- `GET /qibla` -> Kıble pusula derecesi hesaplama

---

## 📦 Yerel Veri Kümeleri ve Kaynaktan Derleme

Tüm veri dosyaları doğrudan `/data` klasörünün altında yer alır ve senkronizasyonu kolaylaştırmak için verimli bir şekilde 50MB'ın altına bölünmüştür:
- Kur'an: `data/quran/normalized/quran.json`
- Zaman Damgaları ve Sayfa Eşlemeleri: `data/quran/normalized/timestamps.json`
- Hadis Koleksiyonları ve Parçaları:
  - `data/hadith/normalized/hadith.json`
  - `data/hadith/normalized/hadith_part_1.json`
  - `data/hadith/normalized/hadith_part_2.json`
- Ses Eşlemeleri ve Hafızlar: `data/audio/normalized/audio-index.json`

Veri kümelerini ve parçalı dosyaları doğrudan orijinal kaynaklarından derlemek için:
```sh
pnpm sync:updates
```

---

## 🧪 Test Etme

Hem JavaScript hem de Python API'leri %100 test kapsama oranına sahiptir. Konsolunuzda testleri çalıştırın:

```sh
# JavaScript testlerini çalıştır
npm test

# Python unit testlerini çalıştır
python -m unittest tests/test_sdk.py
```
