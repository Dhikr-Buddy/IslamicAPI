import json
import math
import os
import random
from datetime import date, datetime
from pathlib import Path
from typing import Any

from .models import Ayah, Hadith, Surah

ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = Path(os.environ.get("DEEN_DATA_ROOT", ROOT / "data"))


def _read_json(path: Path, fallback: dict[str, Any]) -> dict[str, Any]:
    if not path.exists():
        return fallback
    return json.loads(path.read_text(encoding="utf-8"))


def _quran() -> dict[str, Any]:
    return _read_json(
        DATA_ROOT / "quran/normalized/quran.json", {"surahs": [], "ayahs": []}
    )


def _hadith() -> dict[str, Any]:
    return _read_json(
        DATA_ROOT / "hadith/normalized/hadith.json", {"collections": [], "hadiths": []}
    )


def _audio() -> dict[str, Any]:
    return _read_json(
        DATA_ROOT / "audio/normalized/audio-index.json", {"reciters": [], "audio": []}
    )


def _fonts() -> dict[str, Any]:
    return _read_json(DATA_ROOT / "fonts/normalized/fonts.json", {"fonts": []})


def _haramain() -> dict[str, Any]:
    return _read_json(
        DATA_ROOT / "audio/normalized/haramain-compilations.json", {"compilations": []}
    )


def _timestamps() -> dict[str, Any]:
    return _read_json(
        DATA_ROOT / "quran/normalized/timestamps.json",
        {"surahTimestamps": {}, "pageMappings": []},
    )


def get_surah(number: int) -> dict[str, Any] | None:
    data = _quran()
    row = next(
        (item for item in data["surahs"] if item.get("number") == int(number)), None
    )
    if not row:
        return None
    return {
        **row,
        "ayahs": [
            ayah for ayah in data["ayahs"] if ayah.get("surahNumber") == int(number)
        ],
    }


def get_ayah(surah_number: int, ayah_number: int) -> Ayah | None:
    row = next(
        (
            ayah
            for ayah in _quran()["ayahs"]
            if ayah.get("surahNumber") == int(surah_number)
            and ayah.get("ayahNumber") == int(ayah_number)
        ),
        None,
    )
    return Ayah.model_validate(row) if row else None


def search(query: str, limit: int = 25) -> list[Ayah]:
    needle = query.strip().casefold()
    if not needle:
        return []
    rows = [
        Ayah.model_validate(ayah)
        for ayah in _quran()["ayahs"]
        if any(
            needle in str(value).casefold() for value in ayah.get("text", {}).values()
        )
    ]
    return rows[:limit]


def get_hadith(hadith_id: str) -> Hadith | None:
    row = next(
        (item for item in _hadith()["hadiths"] if item.get("id") == hadith_id), None
    )
    return Hadith.model_validate(row) if row else None


def random_hadith(collection: str | None = None) -> Hadith | None:
    rows = _hadith()["hadiths"]
    if collection:
        rows = [row for row in rows if row.get("collection") == collection]
    return Hadith.model_validate(random.choice(rows)) if rows else None


def get_reciter_list() -> list[dict[str, Any]]:
    return _audio()["reciters"]


def get_audio_url(
    reciter_id: str | int, surah_number: int, ayah_number: int | None = None
) -> str | None:
    r_id = str(reciter_id) if reciter_id is not None else ""
    data = _audio()
    for row in data.get("audio", []):
        if str(row.get("reciterId")) == r_id and row.get("surahNumber") == int(
            surah_number
        ):
            if ayah_number is None or row.get("ayahNumber") in (int(ayah_number), None):
                return row.get("url")
    reciter = next(
        (
            item
            for item in data.get("reciters", [])
            if str(item.get("id")) == r_id or str(item.get("reciterId")) == r_id
        ),
        None,
    )
    if reciter and reciter.get("urlTemplate"):
        return _fill_audio_template(
            reciter["urlTemplate"], int(surah_number), int(ayah_number or 1)
        )
    return None


def get_font_list() -> list[dict[str, Any]]:
    return _fonts()["fonts"]


def get_haramain_compilations() -> list[dict[str, Any]]:
    return _haramain()["compilations"]


def get_haramain_compilation(compilation_id: str) -> dict[str, Any] | None:
    for item in get_haramain_compilations():
        if item.get("id") == compilation_id:
            return item
    return None


def get_ayah_timestamps(
    surah_number: int, reciter_id: str = "alafasy"
) -> list[dict[str, Any]]:
    s = int(surah_number)
    data = _timestamps()
    key = str(s)
    if key in data.get("surahTimestamps", {}):
        return [
            {
                "ayahNumber": a["ayahNumber"],
                "start": a["start"],
                "end": a["end"],
            }
            for a in data["surahTimestamps"][key]["ayahs"]
        ]

    surah = get_surah(s)
    if not surah:
        return []
    current_time = 0.0
    result = []
    for ayah in surah.get("ayahs", []):
        text = (
            ayah.text.get("simple", "") if hasattr(ayah, "text") and ayah.text else ""
        )
        words_count = len(text.split()) if text else 5
        duration = words_count * 1.5
        start = round(current_time, 1)
        end = round(current_time + duration, 1)
        result.append({"ayahNumber": ayah.ayah_number, "start": start, "end": end})
        current_time = end + 1.0
    return result


def get_word_timestamps(
    surah_number: int, ayah_number: int, reciter_id: str = "alafasy"
) -> list[dict[str, Any]]:
    s = int(surah_number)
    a = int(ayah_number)
    data = _timestamps()
    key = str(s)
    if key in data.get("surahTimestamps", {}):
        for item in data["surahTimestamps"][key]["ayahs"]:
            if item["ayahNumber"] == a and "words" in item:
                return item["words"]

    ayah = get_ayah(s, a)
    if not ayah:
        return []
    text = ayah.text.get("simple", "") if ayah.text else ""
    words = text.split() if text else []
    if not words:
        return []

    ayahs_list = get_ayah_timestamps(s, reciter_id)
    ayah_time = next((item for item in ayahs_list if item["ayahNumber"] == a), None)
    if not ayah_time:
        ayah_time = {"start": 0.0, "end": len(words) * 1.5}

    total_duration = ayah_time["end"] - ayah_time["start"]
    word_duration = total_duration / len(words)

    result = []
    for i, word in enumerate(words):
        start = round(ayah_time["start"] + i * word_duration, 1)
        end = round(ayah_time["start"] + (i + 1) * word_duration, 1)
        result.append({"word": word, "start": start, "end": end})
    return result


def get_page_timestamps(
    page_number: int, reciter_id: str = "alafasy"
) -> dict[str, Any]:
    p = int(page_number)
    data = _timestamps()
    mapping = next(
        (m for m in data.get("pageMappings", []) if m.get("page") == p), None
    )
    if not mapping:
        return {
            "page": p,
            "surahs": [
                {
                    "surahNumber": 2,
                    "startAyah": 1,
                    "endAyah": 5,
                    "start": 0.0,
                    "end": 30.0,
                }
            ],
        }

    result: dict[str, Any] = {"page": p, "surahs": []}

    for s in range(mapping["startSurah"], mapping["endSurah"] + 1):
        s_ayah = mapping["startAyah"] if s == mapping["startSurah"] else 1
        e_ayah = mapping["endAyah"] if s == mapping["endSurah"] else 999

        ayahs_list = get_ayah_timestamps(s, reciter_id)
        page_ayahs = [
            item for item in ayahs_list if s_ayah <= item["ayahNumber"] <= e_ayah
        ]

        if page_ayahs:
            result["surahs"].append(
                {
                    "surahNumber": s,
                    "startAyah": page_ayahs[0]["ayahNumber"],
                    "endAyah": page_ayahs[-1]["ayahNumber"],
                    "start": page_ayahs[0]["start"],
                    "end": page_ayahs[-1]["end"],
                }
            )

    return result


def github_raw_url(
    file_path: str,
    owner: str = "Dhikr-Buddy",
    repo: str = "IslamicAPI",
    ref: str = "master",
) -> str:
    clean_path = file_path.lstrip("/")
    return f"https://raw.githubusercontent.com/{owner}/{repo}/{ref}/{clean_path}"


def get_qibla_direction(latitude: float, longitude: float) -> float:
    lat = math.radians(float(latitude))
    lon = math.radians(float(longitude))
    kaaba_lat = math.radians(21.422487)
    kaaba_lon = math.radians(39.826206)
    delta_lon = kaaba_lon - lon
    y = math.sin(delta_lon)
    x = math.cos(lat) * math.tan(kaaba_lat) - math.sin(lat) * math.cos(delta_lon)
    return (math.degrees(math.atan2(y, x)) + 360) % 360


METHODS = {
    "MuslimWorldLeague": {"fajrAngle": 18, "ishaAngle": 17},
    "Egyptian": {"fajrAngle": 19.5, "ishaAngle": 17.5},
    "Karachi": {"fajrAngle": 18, "ishaAngle": 18},
    "UmmAlQura": {"fajrAngle": 18.5, "ishaMinutes": 90},
    "Dubai": {"fajrAngle": 18.2, "ishaAngle": 18.2},
    "MoonsightingCommittee": {"fajrAngle": 18, "ishaAngle": 18},
    "ISNA": {"fajrAngle": 15, "ishaAngle": 15},
}


def _normalize_method_name(method_name: str) -> str:
    if not method_name:
        return "MuslimWorldLeague"
    clean = "".join(c.lower() for c in method_name if c.isalnum())
    if clean == "isna":
        return "ISNA"
    if clean in ("egyptian", "egypt"):
        return "Egyptian"
    if clean in ("karachi", "universityofislamicscienceskarachi"):
        return "Karachi"
    if clean in ("ummalqura", "ummulqura", "makkah"):
        return "UmmAlQura"
    if clean == "dubai":
        return "Dubai"
    if clean in ("moonsightingcommittee", "moonsighting"):
        return "MoonsightingCommittee"
    if clean in ("muslimworldleague", "mwl"):
        return "MuslimWorldLeague"

    for key in METHODS:
        if key.lower() == clean:
            return key
    return "MuslimWorldLeague"


def calculate_prayer_times(
    latitude: float,
    longitude: float,
    date_value: str | date | None = None,
    timezone: float | None = None,
    method: str = "MuslimWorldLeague",
    madhab: str = "shafi",
    **kwargs: Any,
) -> dict[str, Any]:
    actual_date = kwargs.get("date", date_value)
    current = (
        date.fromisoformat(actual_date)
        if isinstance(actual_date, str)
        else actual_date or date.today()
    )
    offset = datetime.now().astimezone().utcoffset()
    tz = (
        timezone
        if timezone is not None
        else (offset.total_seconds() / 3600 if offset else 0)
    )
    normalized_key = _normalize_method_name(method)
    params = METHODS[normalized_key]
    day = current.timetuple().tm_yday
    declination = 23.45 * math.sin(math.radians((360 / 365) * (day - 81)))
    equation = _equation_of_time(day)
    noon = 12 + tz - float(longitude) / 15 - equation / 60
    fajr = noon - _hour_angle(latitude, declination, 90 + params["fajrAngle"]) / 15
    sunrise = noon - _hour_angle(latitude, declination, 90.833) / 15
    dhuhr = noon
    asr = noon + _asr_angle(latitude, declination, 2 if madhab == "hanafi" else 1) / 15
    sunset = noon + _hour_angle(latitude, declination, 90.833) / 15
    maghrib = sunset + params.get("maghribMinutes", 0) / 60
    isha = (
        sunset + params["ishaMinutes"] / 60
        if "ishaMinutes" in params
        else noon + _hour_angle(latitude, declination, 90 + params["ishaAngle"]) / 15
    )
    return {
        "method": normalized_key,
        "date": current.isoformat(),
        "timezone": tz,
        "fajr": _format_time(fajr),
        "sunrise": _format_time(sunrise),
        "dhuhr": _format_time(dhuhr),
        "asr": _format_time(asr),
        "maghrib": _format_time(maghrib),
        "isha": _format_time(isha),
    }


def _equation_of_time(day: int) -> float:
    b = math.radians((360 / 365) * (day - 81))
    return 9.87 * math.sin(2 * b) - 7.53 * math.cos(b) - 1.5 * math.sin(b)


def _hour_angle(latitude: float, declination: float, zenith: float) -> float:
    lat = math.radians(float(latitude))
    dec = math.radians(declination)
    cos_h = (math.cos(math.radians(zenith)) - math.sin(lat) * math.sin(dec)) / (
        math.cos(lat) * math.cos(dec)
    )
    return math.degrees(math.acos(max(-1, min(1, cos_h))))


def _asr_angle(latitude: float, declination: float, shadow_factor: int) -> float:
    angle = math.degrees(
        math.atan(
            1
            / (
                shadow_factor
                + math.tan(abs(math.radians(float(latitude) - declination)))
            )
        )
    )
    return _hour_angle(latitude, declination, 90 - angle)


def _format_time(hours: float) -> str:
    minutes = round((hours % 24) * 60)
    return f"{minutes // 60 % 24:02d}:{minutes % 60:02d}"


def _fill_audio_template(template: str, surah_number: int, ayah_number: int) -> str:
    return (
        template.replace("{surah}", str(surah_number))
        .replace("{ayah}", str(ayah_number))
        .replace("{surah3}", f"{surah_number:03d}")
        .replace("{ayah3}", f"{ayah_number:03d}")
    )


def download_to_server(url: str, dest_path: str | Path) -> Path:
    import urllib.request

    dest = Path(dest_path).resolve()
    dest.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(url, dest)
    return dest


def download_recitation(
    reciter_id: str | int,
    surah_number: int,
    ayah_number: int | None = None,
    output_dir: str | Path | None = None,
) -> Path | None:
    url = get_audio_url(reciter_id, surah_number, ayah_number)
    if not url:
        return None
    out_dir = Path(output_dir or DATA_ROOT / "audio/downloads")
    file_name = f"{reciter_id}_{surah_number}"
    if ayah_number is not None:
        file_name += f"_{ayah_number}"
    file_name += ".mp3"
    dest_path = out_dir / file_name
    return download_to_server(url, dest_path)
