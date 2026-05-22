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
}


def calculate_prayer_times(
    latitude: float,
    longitude: float,
    date_value: str | date | None = None,
    timezone: float | None = None,
    method: str = "MuslimWorldLeague",
    madhab: str = "shafi",
) -> dict[str, Any]:
    current = (
        date.fromisoformat(date_value)
        if isinstance(date_value, str)
        else date_value or date.today()
    )
    offset = datetime.now().astimezone().utcoffset()
    tz = (
        timezone
        if timezone is not None
        else (offset.total_seconds() / 3600 if offset else 0)
    )
    params = METHODS.get(method, METHODS["MuslimWorldLeague"])
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
        "method": method,
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
