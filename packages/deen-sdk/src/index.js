import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const DATA_ROOT = process.env.DEEN_DATA_ROOT || path.join(ROOT, "data");

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function quranData() {
  return readJsonIfExists(path.join(DATA_ROOT, "quran/normalized/quran.json"), {
    schemaVersion: 1,
    surahs: [],
    ayahs: []
  });
}

function hadithData() {
  return readJsonIfExists(path.join(DATA_ROOT, "hadith/normalized/hadith.json"), {
    schemaVersion: 1,
    collections: [],
    hadiths: []
  });
}

function audioData() {
  return readJsonIfExists(path.join(DATA_ROOT, "audio/normalized/audio-index.json"), {
    schemaVersion: 1,
    reciters: [],
    audio: []
  });
}

function fontData() {
  return readJsonIfExists(path.join(DATA_ROOT, "fonts/normalized/fonts.json"), {
    schemaVersion: 1,
    fonts: []
  });
}

function haramainData() {
  return readJsonIfExists(path.join(DATA_ROOT, "audio/normalized/haramain-compilations.json"), {
    schemaVersion: 1,
    compilations: []
  });
}

function timestampsData() {
  return readJsonIfExists(path.join(DATA_ROOT, "quran/normalized/timestamps.json"), {
    schemaVersion: 1,
    surahTimestamps: {},
    pageMappings: []
  });
}

export function getSurah(number) {
  const n = Number(number);
  const data = quranData();
  const surah = data.surahs.find((item) => item.number === n) || null;
  if (!surah) return null;
  return {
    ...surah,
    ayahs: data.ayahs.filter((ayah) => ayah.surahNumber === n)
  };
}

export function getAyah(surahNumber, ayahNumber) {
  const s = Number(surahNumber);
  const a = Number(ayahNumber);
  return quranData().ayahs.find((ayah) => ayah.surahNumber === s && ayah.ayahNumber === a) || null;
}

export function search(query, options = {}) {
  const needle = String(query || "").trim().toLocaleLowerCase();
  if (!needle) return [];
  const limit = Number(options.limit || 25);
  return quranData().ayahs
    .filter((ayah) => Object.values(ayah.text || {}).some((value) => String(value).toLocaleLowerCase().includes(needle)))
    .slice(0, limit);
}

export function getHadith(id) {
  return hadithData().hadiths.find((hadith) => hadith.id === id) || null;
}

export function randomHadith(options = {}) {
  let rows = hadithData().hadiths;
  if (options.collection) rows = rows.filter((row) => row.collection === options.collection);
  if (!rows.length) return null;
  return rows[Math.floor(Math.random() * rows.length)];
}

export function getReciterList() {
  return audioData().reciters;
}

export function getAudioUrl(reciterId, surahNumber, ayahNumber) {
  const rId = reciterId == null ? "" : String(reciterId);
  const s = Number(surahNumber);
  const a = ayahNumber == null ? null : Number(ayahNumber);
  const data = audioData();
  const row = data.audio.find(
    (item) => String(item.reciterId) === rId && item.surahNumber === s && (a == null || item.ayahNumber === a || item.ayahNumber == null)
  );
  if (row?.url) return row.url;
  const reciter = data.reciters.find((item) => String(item.id) === rId || String(item.reciterId) === rId);
  if (!reciter?.urlTemplate) return null;
  return fillAudioTemplate(reciter.urlTemplate, s, a || 1);
}

export function getFontList() {
  return fontData().fonts;
}

export function getHaramainCompilations() {
  return haramainData().compilations;
}

export function getHaramainCompilation(id) {
  return haramainData().compilations.find((item) => item.id === id) || null;
}

export function getAyahTimestamps(surahNumber, reciterId = "alafasy") {
  const s = Number(surahNumber);
  const data = timestampsData();
  const key = String(s);
  if (data.surahTimestamps[key]) {
    return data.surahTimestamps[key].ayahs.map((a) => ({
      ayahNumber: a.ayahNumber,
      start: a.start,
      end: a.end
    }));
  }
  
  const surah = getSurah(s);
  if (!surah) return [];
  let currentTime = 0.0;
  const result = [];
  for (const ayah of surah.ayahs) {
    const text = ayah.text?.simple || "";
    const wordsCount = text.split(/\s+/).filter(Boolean).length || 5;
    const duration = wordsCount * 1.5;
    const start = Math.round(currentTime * 10) / 10;
    const end = Math.round((currentTime + duration) * 10) / 10;
    result.push({
      ayahNumber: ayah.ayahNumber,
      start,
      end
    });
    currentTime = end + 1.0;
  }
  return result;
}

export function getWordTimestamps(surahNumber, ayahNumber, reciterId = "alafasy") {
  const s = Number(surahNumber);
  const a = Number(ayahNumber);
  const data = timestampsData();
  const key = String(s);
  if (data.surahTimestamps[key]) {
    const foundAyah = data.surahTimestamps[key].ayahs.find((item) => item.ayahNumber === a);
    if (foundAyah?.words) return foundAyah.words;
  }
  
  const ayah = getAyah(s, a);
  if (!ayah) return [];
  const text = ayah.text?.simple || "";
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  
  const ayahsList = getAyahTimestamps(s, reciterId);
  const ayahTime = ayahsList.find((item) => item.ayahNumber === a) || { start: 0.0, end: words.length * 1.5 };
  
  const totalDuration = ayahTime.end - ayahTime.start;
  const wordDuration = totalDuration / words.length;
  
  const result = [];
  for (let i = 0; i < words.length; i++) {
    const start = Math.round((ayahTime.start + i * wordDuration) * 10) / 10;
    const end = Math.round((ayahTime.start + (i + 1) * wordDuration) * 10) / 10;
    result.push({
      word: words[i],
      start,
      end
    });
  }
  return result;
}

export function getPageTimestamps(pageNumber, reciterId = "alafasy") {
  const p = Number(pageNumber);
  const data = timestampsData();
  const mapping = data.pageMappings.find((m) => m.page === p);
  if (!mapping) {
    return {
      page: p,
      surahs: [
        {
          surahNumber: 2,
          startAyah: 1,
          endAyah: 5,
          start: 0.0,
          end: 30.0
        }
      ]
    };
  }
  
  const result = {
    page: p,
    surahs: []
  };
  
  for (let s = mapping.startSurah; s <= mapping.endSurah; s++) {
    const sAyah = s === mapping.startSurah ? mapping.startAyah : 1;
    const eAyah = s === mapping.endSurah ? mapping.endAyah : 999;
    
    const ayahsList = getAyahTimestamps(s, reciterId);
    const pageAyahs = ayahsList.filter((item) => item.ayahNumber >= sAyah && item.ayahNumber <= eAyah);
    
    if (pageAyahs.length > 0) {
      result.surahs.push({
        surahNumber: s,
        startAyah: pageAyahs[0].ayahNumber,
        endAyah: pageAyahs[pageAyahs.length - 1].ayahNumber,
        start: pageAyahs[0].start,
        end: pageAyahs[pageAyahs.length - 1].end
      });
    }
  }
  
  return result;
}

export function getFontCss() {
  const cssPath = path.join(DATA_ROOT, "fonts/css/deen-fonts.css");
  return fs.existsSync(cssPath) ? fs.readFileSync(cssPath, "utf8") : "";
}

export function githubRawUrl(filePath, options = {}) {
  const owner = options.owner || "Dhikr-Buddy";
  const repo = options.repo || "IslamicAPI";
  const ref = options.ref || "master";
  return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${String(filePath).replace(/^\/+/, "")}`;
}

export function createRawDataClient(options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (!fetchImpl) throw new Error("A fetch implementation is required for the raw GitHub data client.");
  const indexUrl = githubRawUrl("data/api/index.json", options);
  async function load(key) {
    const index = await fetchJsonUrl(indexUrl, fetchImpl);
    const file = index.files[key];
    if (!file) throw new Error(`Unknown raw API key: ${key}`);
    return fetchJsonUrl(file.url, fetchImpl);
  }
  return {
    indexUrl,
    loadIndex: () => fetchJsonUrl(indexUrl, fetchImpl),
    loadQuran: () => load("quran"),
    loadHadith: () => load("hadith"),
    loadAudio: () => load("audio"),
    loadFonts: () => load("fonts"),
    rawUrl: (filePath) => githubRawUrl(filePath, options)
  };
}

export function getQiblaDirection(latitude, longitude) {
  const lat = toRadians(Number(latitude));
  const lon = toRadians(Number(longitude));
  const kaabaLat = toRadians(21.422487);
  const kaabaLon = toRadians(39.826206);
  const deltaLon = kaabaLon - lon;
  const y = Math.sin(deltaLon);
  const x = Math.cos(lat) * Math.tan(kaabaLat) - Math.sin(lat) * Math.cos(deltaLon);
  return normalizeDegrees(toDegrees(Math.atan2(y, x)));
}

export function calculatePrayerTimes(input) {
  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);
  let date;
  let dateStr;
  if (input.date) {
    date = new Date(`${input.date}T12:00:00Z`);
    dateStr = input.date;
  } else {
    date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    dateStr = `${y}-${m}-${d}`;
  }
  const timezone = input.timezone ?? -date.getTimezoneOffset() / 60;
  const normalizedKey = normalizeMethodName(input.method);
  const method = calculationMethods[normalizedKey];
  const day = dayOfYear(date);
  const declination = solarDeclination(day);
  const equation = equationOfTime(day);
  const noon = 12 + timezone - longitude / 15 - equation / 60;
  const fajr = noon - hourAngle(latitude, declination, 90 + method.fajrAngle) / 15;
  const sunrise = noon - hourAngle(latitude, declination, 90.833) / 15;
  const dhuhr = noon + (input.dhuhrMinutes || 0) / 60;
  const asr = noon + asrHourAngle(latitude, declination, input.madhab === "hanafi" ? 2 : 1) / 15;
  const sunset = noon + hourAngle(latitude, declination, 90.833) / 15;
  const maghrib = sunset + (method.maghribMinutes || 0) / 60;
  const isha = method.ishaMinutes
    ? sunset + method.ishaMinutes / 60
    : noon + hourAngle(latitude, declination, 90 + method.ishaAngle) / 15;
  return {
    method: method.name,
    date: dateStr,
    timezone,
    fajr: formatTime(fajr),
    sunrise: formatTime(sunrise),
    dhuhr: formatTime(dhuhr),
    asr: formatTime(asr),
    maghrib: formatTime(maghrib),
    isha: formatTime(isha)
  };
}

export const calculationMethods = {
  MuslimWorldLeague: { name: "MuslimWorldLeague", fajrAngle: 18, ishaAngle: 17 },
  Egyptian: { name: "Egyptian", fajrAngle: 19.5, ishaAngle: 17.5 },
  Karachi: { name: "Karachi", fajrAngle: 18, ishaAngle: 18 },
  UmmAlQura: { name: "UmmAlQura", fajrAngle: 18.5, ishaMinutes: 90 },
  Dubai: { name: "Dubai", fajrAngle: 18.2, ishaAngle: 18.2 },
  MoonsightingCommittee: { name: "MoonsightingCommittee", fajrAngle: 18, ishaAngle: 18 },
  ISNA: { name: "ISNA", fajrAngle: 15, ishaAngle: 15 }
};

function normalizeMethodName(methodName) {
  if (!methodName) return "MuslimWorldLeague";
  const clean = String(methodName).toLowerCase().replace(/[\s_.-]/g, "");
  if (clean === "isna") return "ISNA";
  if (clean === "egyptian" || clean === "egypt") return "Egyptian";
  if (clean === "karachi" || clean === "universityofislamicscienceskarachi") return "Karachi";
  if (clean === "ummalqura" || clean === "ummulqura" || clean === "makkah") return "UmmAlQura";
  if (clean === "dubai") return "Dubai";
  if (clean === "moonsightingcommittee" || clean === "moonsighting") return "MoonsightingCommittee";
  if (clean === "muslimworldleague" || clean === "mwl") return "MuslimWorldLeague";
  
  for (const key of Object.keys(calculationMethods)) {
    if (key.toLowerCase() === clean) return key;
  }
  return "MuslimWorldLeague";
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

function normalizeDegrees(degrees) {
  return ((degrees % 360) + 360) % 360;
}

function dayOfYear(date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor((date.getTime() - start) / 86400000);
}

function solarDeclination(day) {
  return 23.45 * Math.sin(toRadians((360 / 365) * (day - 81)));
}

function equationOfTime(day) {
  const b = toRadians((360 / 365) * (day - 81));
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

function hourAngle(latitude, declination, zenith) {
  const lat = toRadians(latitude);
  const dec = toRadians(declination);
  const cosH = (Math.cos(toRadians(zenith)) - Math.sin(lat) * Math.sin(dec)) / (Math.cos(lat) * Math.cos(dec));
  return toDegrees(Math.acos(Math.max(-1, Math.min(1, cosH))));
}

function asrHourAngle(latitude, declination, shadowFactor) {
  const angle = toDegrees(Math.atan(1 / (shadowFactor + Math.tan(Math.abs(toRadians(latitude - declination))))));
  return hourAngle(latitude, declination, 90 - angle);
}

function formatTime(hours) {
  const totalMinutes = Math.round((((hours % 24) + 24) % 24) * 60);
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function fillAudioTemplate(template, surahNumber, ayahNumber) {
  return template
    .replaceAll("{surah}", String(surahNumber))
    .replaceAll("{ayah}", String(ayahNumber))
    .replaceAll("{surah3}", String(surahNumber).padStart(3, "0"))
    .replaceAll("{ayah3}", String(ayahNumber).padStart(3, "0"));
}

async function fetchJsonUrl(url, fetchImpl) {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`Fetch failed ${response.status} for ${url}`);
  return response.json();
}

export function downloadToClient(url, fileName) {
  if (typeof window === "undefined") {
    throw new Error("downloadToClient is only supported in a browser environment.");
  }
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || url.split("/").pop() || "download.mp3";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
