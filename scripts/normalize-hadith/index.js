import fs from "node:fs";
import path from "node:path";
import { dataRoot, readJson, timestamp, writeJson } from "../lib/io.js";

const manifest = readJson(path.join(dataRoot, "metadata/fetch-manifest.json"), { files: [] });
const out = { schemaVersion: 1, generatedAt: timestamp(), collections: [], hadiths: [] };

for (const file of manifest.files.filter((item) => item.ok && item.domain === "hadith")) {
  const absolute = path.join(dataRoot, file.rawPath);
  const metadata = readJson(absolute.replace(/\.[^.]+$/, ".metadata.json"), {});
  const json = JSON.parse(fs.readFileSync(absolute, "utf8"));
  if (file.sourceId === "fawazahmed0-hadith-api") normalizeFawazIndex(json, metadata);
}

writeJson(path.join(dataRoot, "hadith/normalized/hadith.json"), out);
writeJson(path.join(dataRoot, "hadith/validation-report.json"), {
  schemaVersion: 1,
  generatedAt: timestamp(),
  collectionCount: out.collections.length,
  hadithCount: out.hadiths.length,
  valid: out.hadiths.every((row) => row.provenance?.length)
});
console.log(`Normalized ${out.hadiths.length} hadith records and ${out.collections.length} collections.`);

function normalizeFawazIndex(json, metadata) {
  const editions = Array.isArray(json)
    ? json
    : Object.entries(json).flatMap(([collectionId, collection]) =>
        (collection.collection || []).map((edition) => ({
          ...edition,
          collectionId,
          collectionName: collection.name
        }))
      );
  for (const edition of editions) {
    out.collections.push({
      id: edition.name || edition.identifier || edition.collection || edition.id,
      name: edition.collectionName || edition.englishName || edition.name || edition.identifier,
      edition: edition.name,
      language: edition.language,
      downloadUrl: edition.link || edition.linkmin || null,
      sourceUrl: metadata.sourceUrl,
      license: metadata.license,
      retrievedAt: metadata.retrievedAt
    });
  }
}
