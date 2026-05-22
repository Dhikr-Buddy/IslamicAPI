import fs from "node:fs";
import path from "node:path";
import { fetchBytes, fetchText } from "../lib/fetch.js";
import { dataRoot, ensureDir, readJson, slug, timestamp, writeJson } from "../lib/io.js";

const registry = readJson(path.join(dataRoot, "metadata/source-registry.json"));
if (!registry) throw new Error("Missing data/metadata/source-registry.json. Run pnpm discover:sources first.");

const runId = timestamp().replace(/[:.]/g, "-");
const manifest = { schemaVersion: 1, runId, generatedAt: timestamp(), files: [] };
const sixBooks = new Set(["bukhari", "muslim", "abudawud", "tirmidhi", "nasai", "ibnmajah"]);

for (const source of registry.sources.filter((item) => item.directDownloadUrl && !item.rejected)) {
  const rawDir = path.join(dataRoot, source.domain, "raw", runId);
  ensureDir(rawDir);
  const ext = extensionFor(source);
  const filePath = path.join(rawDir, `${slug(source.id)}.${ext}`);
  try {
    const body = await fetchText(source.directDownloadUrl);
    fs.writeFileSync(filePath, body);
    const metadataPath = filePath.replace(/\.[^.]+$/, ".metadata.json");
    writeJson(metadataPath, {
      sourceUrl: source.sourceUrl,
      directDownloadUrl: source.directDownloadUrl,
      license: source.license,
      retrievedAt: timestamp(),
      bytes: Buffer.byteLength(body)
    });
    manifest.files.push({ sourceId: source.id, domain: source.domain, rawPath: path.relative(dataRoot, filePath), ok: true });
    if (source.id === "fawazahmed0-hadith-api") await fetchSahihSittahEditions(JSON.parse(body), source);
    if (source.id === "fawazahmed0-quran-fonts") await fetchMushafFonts(JSON.parse(body), source);
  } catch (error) {
    manifest.files.push({ sourceId: source.id, domain: source.domain, ok: false, error: error.message });
  }
}

writeJson(path.join(dataRoot, "metadata/fetch-manifest.json"), manifest);
console.log(`Fetched ${manifest.files.filter((file) => file.ok).length} datasets.`);

function extensionFor(source) {
  if (source.directDownloadUrl.endsWith(".html")) return "html";
  if (source.directDownloadUrl.includes(".json") || source.directDownloadUrl.includes("/api/")) return "json";
  return "txt";
}

async function fetchSahihSittahEditions(index, source) {
  const editions = Object.entries(index).flatMap(([collectionId, collection]) =>
    (collection.collection || [])
      .filter((edition) => sixBooks.has(collectionId) && ["Arabic", "English"].includes(edition.language))
      .filter((edition) => /^(ara|eng)-/.test(edition.name))
      .map((edition) => ({ ...edition, collectionId, collectionName: collection.name }))
  );
  for (const edition of editions) {
    const editionUrl = edition.link || edition.linkmin;
    if (!editionUrl) continue;
    const rawDir = path.join(dataRoot, "hadith", "raw", runId);
    const filePath = path.join(rawDir, `${slug(edition.name)}.json`);
    try {
      const body = await fetchText(editionUrl);
      fs.writeFileSync(filePath, body);
      writeJson(filePath.replace(/\.json$/, ".metadata.json"), {
        sourceUrl: source.sourceUrl,
        directDownloadUrl: editionUrl,
        license: source.license,
        retrievedAt: timestamp(),
        bytes: Buffer.byteLength(body),
        collection: edition.collectionId,
        collectionName: edition.collectionName,
        edition: edition.name,
        language: edition.language
      });
      manifest.files.push({
        sourceId: `fawazahmed0-hadith-edition:${edition.name}`,
        domain: "hadith",
        rawPath: path.relative(dataRoot, filePath),
        ok: true
      });
    } catch (error) {
      manifest.files.push({
        sourceId: `fawazahmed0-hadith-edition:${edition.name}`,
        domain: "hadith",
        ok: false,
        error: error.message
      });
    }
  }
}

async function fetchMushafFonts(fontIndex, source) {
  const fontDir = path.join(dataRoot, "fonts", "files");
  ensureDir(fontDir);
  const entries = Object.entries(fontIndex)
    .map(([id, font]) => ({ id, ...font }))
    .filter((font) => isMushafFont(font) && font.woff2);
  for (const font of entries) {
    const fileName = `${slug(font.name || font.id)}.woff2`;
    const filePath = path.join(fontDir, fileName);
    try {
      const bytes = await fetchBytes(font.woff2);
      fs.writeFileSync(filePath, bytes);
      writeJson(filePath.replace(/\.woff2$/, ".metadata.json"), {
        sourceUrl: source.sourceUrl,
        directDownloadUrl: font.woff2,
        license: inferFontLicense(font),
        retrievedAt: timestamp(),
        bytes: bytes.length,
        fontId: font.id,
        fontName: font.font,
        designer: font.designer
      });
      manifest.files.push({
        sourceId: `quran-font:${font.id}`,
        domain: "fonts",
        rawPath: path.relative(dataRoot, filePath),
        ok: true
      });
    } catch (error) {
      manifest.files.push({
        sourceId: `quran-font:${font.id}`,
        domain: "fonts",
        ok: false,
        error: error.message
      });
    }
  }
}

function isMushafFont(font) {
  const text = `${font.id} ${font.name} ${font.font} ${font.designer}`.toLowerCase();
  return (
    text.includes("hafs") ||
    text.includes("uthmanic") ||
    text.includes("uthmani") ||
    text.includes("nastaleeq") ||
    text.includes("indopak") ||
    text.includes("harmattan")
  );
}

function inferFontLicense(font) {
  const text = `${font.font} ${font.designer}`.toLowerCase();
  if (text.includes("king fahd") || text.includes("kfgqpc")) {
    return "KFGQPC EULA: free use/copy/distribution; no sale, modification, reverse engineering, or alteration";
  }
  return "Upstream font license retained; see source metadata";
}
