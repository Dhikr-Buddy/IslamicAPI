import path from "node:path";
import { dataRoot, readJson, timestamp, writeJson } from "../lib/io.js";

const owner = process.env.DEEN_GITHUB_OWNER || "Dhikr-Buddy";
const repo = process.env.DEEN_GITHUB_REPO || "IslamicAPI";
const ref = process.env.DEEN_GITHUB_REF || "master";
const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}`;

const files = {
  quran: "data/quran/normalized/quran.json",
  hadith: "data/hadith/normalized/hadith.json",
  audio: "data/audio/normalized/audio-index.json",
  fonts: "data/fonts/normalized/fonts.json",
  fontCss: "data/fonts/css/deen-fonts.css",
  prayerMethods: "data/prayer/calculation-methods.json",
  sourceRegistry: "data/metadata/source-registry.json"
};

const index = {
  schemaVersion: 1,
  generatedAt: timestamp(),
  repository: `${owner}/${repo}`,
  ref,
  rawBase,
  files: Object.fromEntries(
    Object.entries(files).map(([key, file]) => [
      key,
      {
        path: file,
        url: `${rawBase}/${file}`
      }
    ])
  ),
  counts: {
    quranAyahs: readJson(path.join(dataRoot, "quran/normalized/quran.json"), { ayahs: [] }).ayahs.length,
    hadiths: readJson(path.join(dataRoot, "hadith/normalized/hadith.json"), { hadiths: [] }).hadiths.length,
    reciters: readJson(path.join(dataRoot, "audio/normalized/audio-index.json"), { reciters: [] }).reciters.length,
    fonts: readJson(path.join(dataRoot, "fonts/normalized/fonts.json"), { fonts: [] }).fonts.length
  }
};

writeJson(path.join(dataRoot, "api/index.json"), index);
console.log(`Built raw GitHub API index for ${index.repository}@${ref}.`);
