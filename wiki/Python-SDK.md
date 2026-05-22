# Python SDK

The `deensdk` package delivers fully typed, Pydantic-validated offline calculations and queries for Python developers.

---

## Installation

```sh
pip install deensdk
```

---

## Importing & Schemas

The Python package exposes strongly-typed models under `deensdk.models`:

```py
from deensdk import (
    get_surah,
    get_ayah,
    search,
    get_hadith,
    random_hadith,
    calculate_prayer_times,
    get_qibla_direction,
    get_audio_url
)
```

---

## API Reference

### 1. Quranic Queries

#### `get_surah(number: int) -> dict | None`
Loads a Surah map containing child `Ayah` model lists.

```py
surah = get_surah(1)
print(surah["name"]) # "سُورَةُ الْفَاتِحَةِ"
```

#### `get_ayah(surah_number: int, ayah_number: int) -> Ayah | None`
Retrieves a single Pydantic `Ayah` model instance.

```py
ayah = get_ayah(1, 1)
print(ayah.id) # "1:1"
print(ayah.text["simple"]) # "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
print(ayah.provenance[0].source_url)
```

#### `search(query: str, limit: int = 25) -> list[Ayah]`
Finds matching ayahs across all active Quranic text representations.

```py
results = search("الله")
print(f"Found {len(results)} matches.")
```

---

### 2. Hadith lookups

#### `get_hadith(hadith_id: str) -> Hadith | None`
Returns a typed `Hadith` model from the local corpus.

```py
hadith = get_hadith("bukhari:3722")
print(hadith.text["ar"])
print(hadith.text["en"])
```

#### `random_hadith(collection: str | None = None) -> Hadith | None`
Retrieves a random Hadith (optional filtering by collection key).

```py
hadith = random_hadith("muslim")
```

---

### 3. Calculators

#### `calculate_prayer_times(...) -> dict`
Astrological offline calculations for prayer timetables.
*   **Signature**:
    ```py
    def calculate_prayer_times(
        latitude: float,
        longitude: float,
        date_value: str | date | None = None,
        timezone: float | None = None,
        method: str = "MuslimWorldLeague",
        madhab: str = "shafi"
    ) -> dict
    ```

```py
times = calculate_prayer_times(40.7128, -74.006, timezone=-4)
print(times["fajr"]) # "04:12"
```

#### `get_qibla_direction(latitude: float, longitude: float) -> float`
Calculates true-north Qibla bearing in degrees.

```py
bearing = get_qibla_direction(40.7128, -74.006)
print(f"Qibla direction: {bearing:.2f}°")
```

#### `get_audio_url(reciter_id: str | int, surah_number: int, ayah_number: int | None = None) -> str | None`
Generates recitation endpoints. Perfectly matches both composite string IDs (`"1:1"`) and simplified numeric IDs (`1`).

```py
url = get_audio_url(1, 1, 1)
print(url) # "https://server6.mp3quran.net/akdr/001.mp3"
```
---

## Pydantic Models

```py
from deensdk.models import Ayah, Hadith, Provenance

# Models can be converted to/from JSON easily:
ayah_json = ayah.model_dump_json()
restored_ayah = Ayah.model_validate_json(ayah_json)
```
