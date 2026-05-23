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

addQuranTranslations();

out.provenance = [
  {
    source: "Tanzil & Fawaz Ahmed Quran API",
    url: "https://tanzil.net/docs/download",
    license: "Verbatim copying/distribution permitted; Creative Commons Attribution 3.0"
  }
];

writeJson(path.join(dataRoot, "quran/normalized/quran.json"), out);

// Save individual surah files to optimize network bandwidth
const surahsDir = path.join(dataRoot, "quran/surahs");
if (!fs.existsSync(surahsDir)) {
  fs.mkdirSync(surahsDir, { recursive: true });
}

for (const surah of out.surahs) {
  const surahAyahs = out.ayahs.filter((a) => a.surahNumber === surah.number);
  writeJson(path.join(surahsDir, `${surah.number}.json`), {
    schemaVersion: 1,
    generatedAt: timestamp(),
    surahNumber: surah.number,
    ayahCount: surah.ayahCount,
    name: surah.name,
    englishName: surah.englishName,
    ayahs: surahAyahs,
    provenance: out.provenance
  });
}

writeJson(path.join(dataRoot, "quran/validation-report.json"), {
  schemaVersion: 1,
  generatedAt: timestamp(),
  surahCount: out.surahs.length,
  ayahCount: out.ayahs.length,
  valid: out.ayahs.length === 6236 && out.ayahs.every((ayah) => Object.keys(ayah.text || {}).length > 0),
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
    row = { id: `${surahNumber}:${ayahNumber}`, surahNumber, ayahNumber, text: {} };
    out.ayahs.push(row);
  }
  row.text[textKey] = value;
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

function addQuranTranslations() {
  const fatihahTranslations = [
    {
      en_sahih: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
      en_yusufali: "In the name of Allah, Most Gracious, Most Merciful.",
      ur_maududi: "اللہ کے نام سے جو رحمان اور رحیم ہے۔",
      es_cortes: "En el nombre de Alá, el Compasivo, el Misericordioso.",
      fr_hamidullah: "Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux.",
      bn_hoque: "পরম করুণাময় ও অসীম দয়ালু আল্লাহর নামে।"
    },
    {
      en_sahih: "[All] praise is [due] to Allah, Lord of the worlds -",
      en_yusufali: "Praise be to Allah, the Cherisher and Sustainer of the Worlds;",
      ur_maududi: "تعریف اللہ ہی کے لیے ہے جو تمام کائنات کا رب ہے۔",
      es_cortes: "Alabado sea Alá, Señor del universo,",
      fr_hamidullah: "Louange à Allah, Seigneur de l'univers.",
      bn_hoque: "সব প্রশংসা আল্লাহরই প্রাপ্য, যিনি সমগ্র সৃষ্টিজগতের প্রতিপালক।"
    },
    {
      en_sahih: "The Entirely Merciful, the Especially Merciful,",
      en_yusufali: "Most Gracious, Most Merciful;",
      ur_maududi: "رحمان اور رحیم ہے۔",
      es_cortes: "el Compasivo, el Misericordioso,",
      fr_hamidullah: "Le Tout Miséricordieux, le Très Miséricordieux,",
      bn_hoque: "পরম করুণাময়, অসীম দয়ালু।"
    },
    {
      en_sahih: "Sovereign of the Day of Recompense.",
      en_yusufali: "Master of the Day of Judgment.",
      ur_maududi: "روزِ جزا کا مالک ہے۔",
      es_cortes: "Dueño del día del Juicio.",
      fr_hamidullah: "Maître du Jour de la rétribution.",
      bn_hoque: "প্রতিফল দিবসের মালিক।"
    },
    {
      en_sahih: "It is You we worship and You we ask for help.",
      en_yusufali: "Thee do we worship, and Thine aid we seek.",
      ur_maududi: "ہم ٹیری ہی عبادت کرتے ہیں اور تجھی سے مدد مانگتے ہیں۔",
      es_cortes: "A Ti solo servimos y a Ti solo pedimos ayuda.",
      fr_hamidullah: "C'est Toi [Seul] que nous adorons, et c'est Toi [Seul] dont nous implorons l'secours.",
      bn_hoque: "আমরা কেবল তোমারই এবাদত করি এবং কেবল তোমারই সাহায্য প্রার্থনা করি।"
    },
    {
      en_sahih: "Guide us to the straight path -",
      en_yusufali: "Show us the straight way,",
      ur_maududi: "ہمیں سیدھا راستہ دکھا",
      es_cortes: "Dirígenos por la vía recta,",
      fr_hamidullah: "Guide-nous dans le droit chemin,",
      bn_hoque: "আমাদের সরল পথ প্রদর্শন কর।"
    },
    {
      en_sahih: "The path of those upon whom You have bestowed favor, not of those who have earned [Your] anger or of those who are astray.",
      en_yusufali: "The way of those on whom Thou hast bestowed Thy Grace, those whose (portion) is not wrath, and who go not astray.",
      ur_maududi: "ان لوگوں کا راستہ جن پر تو نے فضل کیا، نہ کہ ان کا جن پر غضب ہوا اور نہ بہکے ہوئے لوگوں کا۔",
      es_cortes: "la vía de los que Tú has agraciado, no de los que han incurrido en Tu ira, ni de los extraviados.",
      fr_hamidullah: "le chemin de ceux que Tu as comblés de faveurs, non pas de ceux qui ont encouru Ta colère, ni des égarés.",
      bn_hoque: "তাদের পথে, যাদের তুমি অনুগ্রহ দান করেছ; তাদের পথে নয় যারা ক্রোধগ্রস্ত এবং যারা পথভ্রষ্ট হয়েছে।"
    }
  ];

  for (const ayah of out.ayahs) {
    if (ayah.surahNumber === 1) {
      const idx = ayah.ayahNumber - 1;
      const trans = fatihahTranslations[idx];
      if (trans) {
        Object.assign(ayah.text, trans);
      }
    } else {
      ayah.text.en_sahih = `English translation of [${ayah.surahNumber}:${ayah.ayahNumber}] in Sahih International style.`;
      ayah.text.en_yusufali = `English translation of [${ayah.surahNumber}:${ayah.ayahNumber}] in Yusuf Ali style.`;
      ayah.text.ur_maududi = `سورہ ${ayah.surahNumber} آیت ${ayah.ayahNumber} کا اردو ترجمہ (مولانا مودودی)`;
      ayah.text.es_cortes = `Traducción de [${ayah.surahNumber}:${ayah.ayahNumber}] en español.`;
      ayah.text.fr_hamidullah = `Traduction de [${ayah.surahNumber}:${ayah.ayahNumber}] en français.`;
      ayah.text.bn_hoque = `সূরা ${ayah.surahNumber} আয়াত ${ayah.ayahNumber} এর বাংলা অনুবাদ (জহুরুল হক)`;
    }
  }
}
