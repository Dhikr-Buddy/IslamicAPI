import fs from "node:fs";
import path from "node:path";
import { dataRoot, readJson, timestamp, writeJson } from "../lib/io.js";

const manifest = readJson(path.join(dataRoot, "metadata/fetch-manifest.json"), { files: [] });
const out = { schemaVersion: 1, generatedAt: timestamp(), reciters: [], audio: [] };

for (const file of manifest.files.filter((item) => item.ok && item.domain === "audio")) {
  const absolute = path.join(dataRoot, file.rawPath);
  const metadata = readJson(absolute.replace(/\.[^.]+$/, ".metadata.json"), {});
  const json = JSON.parse(fs.readFileSync(absolute, "utf8"));
  if (file.sourceId === "mp3quran-api") normalizeMp3Quran(json, metadata);
}

writeJson(path.join(dataRoot, "audio/normalized/audio-index.json"), out);
writeJson(path.join(dataRoot, "audio/validation-report.json"), {
  schemaVersion: 1,
  generatedAt: timestamp(),
  reciterCount: out.reciters.length,
  audioCount: out.audio.length,
  valid: out.reciters.every((row) => row.provenance?.length)
});
console.log(`Normalized ${out.reciters.length} reciters and ${out.audio.length} audio URLs.`);

function normalizeMp3Quran(json, metadata) {
  for (const reciter of json.reciters || []) {
    for (const mushaf of reciter.moshaf || reciter.mushaf || []) {
      const reciterId = `${reciter.id}:${mushaf.id}`;
      out.reciters.push({
        id: reciterId,
        reciterId: String(reciter.id),
        mushafId: String(mushaf.id),
        name: reciter.name,
        server: mushaf.server,
        riwaya: mushaf.name,
        provenance: [{ sourceUrl: metadata.sourceUrl, license: metadata.license, retrievedAt: metadata.retrievedAt }]
      });
      const surahList = String(mushaf.surah_list || "")
        .split(",")
        .map((value) => Number(value))
        .filter(Boolean);
      for (const surahNumber of surahList) {
        out.audio.push({
          reciterId,
          surahNumber,
          ayahNumber: null,
          url: `${String(mushaf.server).replace(/\/$/, "")}/${String(surahNumber).padStart(3, "0")}.mp3`,
          granularity: "surah",
          provenance: [{ sourceUrl: metadata.sourceUrl, license: metadata.license, retrievedAt: metadata.retrievedAt }]
        });
      }
    }
  }
}
