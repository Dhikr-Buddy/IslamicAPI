import fs from "node:fs";
import path from "node:path";
import { dataRoot, readJson, timestamp, writeJson } from "../lib/io.js";

const manifest = readJson(path.join(dataRoot, "metadata/fetch-manifest.json"), { files: [] });
const out = { schemaVersion: 1, generatedAt: timestamp(), surahs: [], ayahs: [] };
const warnings = [];
const SURAH_AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118,
  64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18,
  45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40,
  31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3,
  9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
];

for (const file of manifest.files.filter((item) => item.ok && item.domain === "quran")) {
  const absolute = path.join(dataRoot, file.rawPath);
  const metadata = readJson(absolute.replace(/\.[^.]+$/, ".metadata.json"), {});
  const text = fs.readFileSync(absolute, "utf8");
  if (file.sourceId === "fawazahmed0-quran-api") normalizeFawaz(JSON.parse(text), metadata);
  if (file.sourceId === "ar-tanzil-quran-simple-npm") normalizeTanzilJson(JSON.parse(text), metadata);
  if (file.sourceId === "tanzil-quran-text") normalizeTanzil(text, metadata);
  if (file.sourceId === "alquran-cloud-api") normalizeAlQuranCloud(JSON.parse(text), metadata);
}

out.surahs.sort((a, b) => a.number - b.number);
out.ayahs.sort((a, b) => a.surahNumber - b.surahNumber || a.ayahNumber - b.ayahNumber);
writeJson(path.join(dataRoot, "quran/normalized/quran.json"), out);
writeJson(path.join(dataRoot, "quran/validation-report.json"), {
  schemaVersion: 1,
  generatedAt: timestamp(),
  surahCount: out.surahs.length,
  ayahCount: out.ayahs.length,
  valid: out.ayahs.length === 0 || (out.ayahs.length === 6236 && out.ayahs.every((ayah) => ayah.provenance?.length)),
  warnings
});
console.log(`Normalized ${out.ayahs.length} Quran ayah records.`);

function upsertSurah(number, fields = {}) {
  let row = out.surahs.find((surah) => surah.number === number);
  if (!row) {
    row = { number };
    out.surahs.push(row);
  }
  Object.assign(row, fields);
}

function upsertAyah(surahNumber, ayahNumber, textKey, value, metadata) {
  if (!value) return;
  let row = out.ayahs.find((ayah) => ayah.surahNumber === surahNumber && ayah.ayahNumber === ayahNumber);
  if (!row) {
    row = { id: `${surahNumber}:${ayahNumber}`, surahNumber, ayahNumber, text: {}, provenance: [] };
    out.ayahs.push(row);
  }
  row.text[textKey] = value;
  row.provenance.push({
    sourceUrl: metadata.sourceUrl,
    license: metadata.license,
    retrievedAt: metadata.retrievedAt
  });
}

function normalizeFawaz(json, metadata) {
  const chapters = json.quran || json.chapters || [];
  for (const chapter of chapters) {
    const number = Number(chapter.chapter || chapter.id || chapter.number);
    upsertSurah(number, { number, ayahCount: chapter.verses?.length });
    for (const verse of chapter.verses || []) {
      upsertAyah(number, Number(verse.verse || verse.id || verse.number), "uthmani", verse.text, metadata);
    }
  }
}

function normalizeTanzilJson(json, metadata) {
  const rows = Array.isArray(json) ? json : json.verses || json.ayahs || json.data || [];
  if (rows.length !== 6236) {
    warnings.push({
      sourceUrl: metadata.sourceUrl,
      message: `Rejected Tanzil JSON payload because it contained ${rows.length} rows, expected 6236.`
    });
    return;
  }
  if (typeof rows[0] === "string") {
    let index = 0;
    for (let surahIndex = 0; surahIndex < SURAH_AYAH_COUNTS.length; surahIndex += 1) {
      const surahNumber = surahIndex + 1;
      const ayahCount = SURAH_AYAH_COUNTS[surahIndex];
      upsertSurah(surahNumber, { number: surahNumber, ayahCount });
      for (let ayahNumber = 1; ayahNumber <= ayahCount; ayahNumber += 1) {
        upsertAyah(surahNumber, ayahNumber, "simple", rows[index], metadata);
        index += 1;
      }
    }
    return;
  }
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const surahNumber = Number(row.surah || row.surahNumber || row.chapter || row[0]);
    const ayahNumber = Number(row.ayah || row.ayahNumber || row.verse || row[1]);
    const value = row.text || row.content || row.uthmani || row.simple || row[2];
    upsertAyah(surahNumber, ayahNumber, "simple", value, metadata);
  }
}

function normalizeTanzil(text, metadata) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    const parts = line.split("|");
    if (parts.length < 3) continue;
    const surahNumber = Number(parts[0]);
    const ayahNumber = Number(parts[1]);
    if (!Number.isInteger(surahNumber) || !Number.isInteger(ayahNumber)) continue;
    rows.push([surahNumber, ayahNumber, parts.slice(2).join("|")]);
  }
  if (rows.length !== 6236) {
    warnings.push({
      sourceUrl: metadata.sourceUrl,
      message: `Rejected Tanzil payload because it contained ${rows.length} parseable rows, expected 6236.`
    });
    return;
  }
  for (const [surahNumber, ayahNumber, value] of rows) {
    upsertAyah(surahNumber, ayahNumber, "uthmani", value, metadata);
  }
}

function normalizeAlQuranCloud(json, metadata) {
  for (const surah of json.data?.surahs || []) {
    upsertSurah(Number(surah.number), { number: Number(surah.number), name: surah.name, ayahCount: surah.ayahs?.length });
    for (const ayah of surah.ayahs || []) {
      upsertAyah(Number(surah.number), Number(ayah.numberInSurah), "uthmani", ayah.text, metadata);
    }
  }
}
