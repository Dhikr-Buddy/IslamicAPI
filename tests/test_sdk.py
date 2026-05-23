import unittest
from datetime import date
from deensdk import (
    calculate_prayer_times,
    get_audio_url,
    get_reciter_list,
    get_haramain_compilations,
    get_haramain_compilation,
    get_qibla_direction,
    get_ayah_timestamps,
    get_word_timestamps,
    get_page_timestamps,
)


class TestDeenSDK(unittest.TestCase):
    def test_qibla_direction(self):
        direction = get_qibla_direction(40.7128, -74.006)
        self.assertGreaterEqual(direction, 0)
        self.assertLess(direction, 360)

    def test_prayer_times(self):
        times = calculate_prayer_times(
            latitude=40.7128,
            longitude=-74.006,
            date="2026-05-22",
            timezone=-4,
            method="isna",
        )
        self.assertEqual(times["method"], "ISNA")
        for key in ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]:
            self.assertTrue(key in times)

        # test flexible names
        times_flex = calculate_prayer_times(
            latitude=40.7128,
            longitude=-74.006,
            date="2026-05-22",
            timezone=-4,
            method="umm ul qura",
        )
        self.assertEqual(times_flex["method"], "UmmAlQura")

    def test_famous_reciters(self):
        reciters = get_reciter_list()
        alafasy = next((r for r in reciters if r["id"] == "alafasy"), None)
        self.assertIsNotNone(alafasy)
        self.assertEqual(alafasy["name"], "Mishary Rashid Alafasy")

    def test_haramain_compilations(self):
        compilations = get_haramain_compilations()
        self.assertTrue(len(compilations) > 0)
        comp = get_haramain_compilation("haramain_makkah_taraweeh_2026")
        self.assertIsNotNone(comp)
        self.assertEqual(comp["location"], "Makkah")

    def test_timestamps(self):
        ayahs = get_ayah_timestamps(1, "alafasy")
        self.assertTrue(len(ayahs) > 0)
        self.assertEqual(ayahs[0]["ayahNumber"], 1)
        self.assertIsInstance(ayahs[0]["start"], float)

        words = get_word_timestamps(1, 1, "alafasy")
        self.assertTrue(len(words) > 0)
        self.assertEqual(words[0]["word"], "بِسْمِ")

        page = get_page_timestamps(1, "alafasy")
        self.assertEqual(page["page"], 1)
        self.assertTrue(len(page["surahs"]) > 0)
        self.assertEqual(page["surahs"][0]["surahNumber"], 1)

        # test fallback calculations
        fallback_ayahs = get_ayah_timestamps(2, "alafasy")
        self.assertTrue(len(fallback_ayahs) > 0)
        self.assertEqual(fallback_ayahs[0]["ayahNumber"], 1)

        fallback_words = get_word_timestamps(2, 1, "alafasy")
        self.assertTrue(len(fallback_words) > 0)


if __name__ == "__main__":
    unittest.main()
