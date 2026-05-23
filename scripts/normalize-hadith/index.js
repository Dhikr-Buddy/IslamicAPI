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
  if (file.sourceId.startsWith("fawazahmed0-hadith-edition:")) normalizeFawazEdition(json, metadata);
}

const indexOut = { schemaVersion: 1, generatedAt: timestamp(), collections: out.collections, hadiths: [] };
writeJson(path.join(dataRoot, "hadith/normalized/hadith.json"), indexOut);

const chunkSize = 25000;
for (let i = 0; i < out.hadiths.length; i += chunkSize) {
  const chunk = out.hadiths.slice(i, i + chunkSize);
  const partNum = Math.floor(i / chunkSize) + 1;
  const partFile = path.join(dataRoot, `hadith/normalized/hadith_part_${partNum}.json`);
  writeJson(partFile, { schemaVersion: 1, generatedAt: timestamp(), hadiths: chunk });
}

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

function normalizeFawazEdition(json, metadata) {
  const rows = Array.isArray(json) ? json : json.hadiths || json.data || [];
  const languageKey = languageCode(metadata.language);
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const number = String(row.hadithnumber ?? row.hadithNumber ?? row.number ?? row.id ?? index + 1);
    const collection = metadata.collection;
    const id = `${collection}:${number}`;
    const text = row.text || row.hadith || row.body || row.content;
    if (!text) continue;
    let hadith = out.hadiths.find((item) => item.id === id);
    if (!hadith) {
      hadith = {
        id,
        collection,
        collectionName: metadata.collectionName,
        book: bookName(row),
        number,
        text: {},
        grade: grade(row),
        provenance: []
      };
      out.hadiths.push(hadith);
    }
    hadith.text[languageKey] = text;
    hadith.provenance.push({
      sourceUrl: metadata.sourceUrl,
      directDownloadUrl: metadata.directDownloadUrl,
      license: metadata.license,
      retrievedAt: metadata.retrievedAt,
      edition: metadata.edition,
      language: metadata.language
    });
  }
}

function languageCode(language) {
  const lower = String(language || "").toLowerCase();
  if (lower.startsWith("arabic")) return "ar";
  if (lower.startsWith("english")) return "en";
  return lower.slice(0, 2) || "und";
}

function bookName(row) {
  if (typeof row.reference?.book === "string") return row.reference.book;
  if (typeof row.book === "string") return row.book;
  if (typeof row.book?.name === "string") return row.book.name;
  return null;
}

function grade(row) {
  if (typeof row.grade === "string") return row.grade;
  if (Array.isArray(row.grades)) return row.grades.map((item) => item.grade || item).filter(Boolean).join("; ") || null;
  return null;
}
