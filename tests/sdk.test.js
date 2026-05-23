import assert from "node:assert/strict";
import test from "node:test";
import {
  calculatePrayerTimes,
  getAudioUrl,
  getAyah,
  getFontList,
  getQiblaDirection,
  getReciterList,
  getSurah,
  githubRawUrl,
  randomHadith,
  search,
  getHaramainCompilations,
  getHaramainCompilation,
  getAyahTimestamps,
  getWordTimestamps,
  getPageTimestamps
} from "../packages/deen-sdk/src/index.js";

test("local Quran records expose provenance when synced", () => {
  const surah = getSurah(1);
  const ayah = getAyah(1, 1);
  assert.equal(surah?.number, 1);
  assert.equal(Array.isArray(surah?.ayahs), true);
  assert.equal(ayah?.surahNumber, 1);
  assert.equal(ayah?.ayahNumber, 1);
  assert.ok(ayah?.provenance?.[0]?.sourceUrl);
  assert.deepEqual(search("anything"), []);
});

test("qibla direction returns a compass bearing", () => {
  const direction = getQiblaDirection(40.7128, -74.006);
  assert.equal(typeof direction, "number");
  assert.ok(direction >= 0);
  assert.ok(direction < 360);
});

test("offline prayer calculator returns named times", () => {
  const times = calculatePrayerTimes({
    latitude: 40.7128,
    longitude: -74.006,
    date: "2026-05-22",
    timezone: -4
  });
  for (const key of ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]) {
    assert.match(times[key], /^\d{2}:\d{2}$/);
  }
});

test("full data indexes are available offline", () => {
  assert.ok(randomHadith());
  assert.ok(getReciterList().length > 0);
  assert.ok(getFontList().length > 0);
});

test("audio and raw GitHub helpers build URLs", () => {
  const reciter = getReciterList()[0];
  assert.match(getAudioUrl(reciter.id, 1, 1), /^https?:\/\//);
  assert.match(getAudioUrl(1, 1, 1), /^https?:\/\//); // Test for integer reciter id fix
  assert.equal(
    githubRawUrl("data/api/index.json"),
    "https://raw.githubusercontent.com/Dhikr-Buddy/IslamicAPI/master/data/api/index.json"
  );
});

test("new famous reciters are loaded and have correct details", () => {
  const reciters = getReciterList();
  const alafasy = reciters.find((r) => r.id === "alafasy");
  const sudais = reciters.find((r) => r.id === "sudais");
  
  assert.ok(alafasy);
  assert.equal(alafasy.name, "Mishary Rashid Alafasy");
  assert.ok(sudais);
  assert.equal(sudais.name, "Abdul Rahman Al-Sudais");
  
  const url = getAudioUrl("alafasy", 1, null);
  assert.match(url, /^https:\/\/server8\.mp3quran\.net\/afs\/001\.mp3/);
});

test("haramain compilations are available", () => {
  const compilations = getHaramainCompilations();
  assert.ok(compilations.length > 0);
  const comp = getHaramainCompilation("haramain_makkah_taraweeh_2026");
  assert.ok(comp);
  assert.equal(comp.location, "Makkah");
  assert.equal(comp.type, "taraweeh");
});

test("calculatePrayerTimes supports flexible names and ISNA", () => {
  const isnaTimes = calculatePrayerTimes({
    latitude: 40.7128,
    longitude: -74.006,
    date: "2026-05-22",
    timezone: -4,
    method: "isna"
  });
  assert.equal(isnaTimes.method, "ISNA");
  
  const ummAlQuraTimes = calculatePrayerTimes({
    latitude: 40.7128,
    longitude: -74.006,
    date: "2026-05-22",
    timezone: -4,
    method: "umm ul qura"
  });
  assert.equal(ummAlQuraTimes.method, "UmmAlQura");
});

test("timestamp APIs return correct structures for pages, ayahs, and words", () => {
  const ayahs = getAyahTimestamps(1, "alafasy");
  assert.ok(ayahs.length > 0);
  assert.equal(ayahs[0].ayahNumber, 1);
  assert.equal(typeof ayahs[0].start, "number");
  
  const words = getWordTimestamps(1, 1, "alafasy");
  assert.ok(words.length > 0);
  assert.equal(words[0].word, "بِسْمِ");
  
  const page = getPageTimestamps(1, "alafasy");
  assert.equal(page.page, 1);
  assert.ok(page.surahs.length > 0);
  assert.equal(page.surahs[0].surahNumber, 1);
});
