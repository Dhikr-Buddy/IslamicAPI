import fs from "node:fs";
import path from "node:path";
import { fetchText } from "../lib/fetch.js";
import { dataRoot, ensureDir, readJson, slug, timestamp, writeJson } from "../lib/io.js";

const registry = readJson(path.join(dataRoot, "metadata/source-registry.json"));
if (!registry) throw new Error("Missing data/metadata/source-registry.json. Run pnpm discover:sources first.");

const runId = timestamp().replace(/[:.]/g, "-");
const manifest = { schemaVersion: 1, runId, generatedAt: timestamp(), files: [] };

for (const source of registry.sources.filter((item) => item.directDownloadUrl && !item.rejected)) {
  const rawDir = path.join(dataRoot, source.domain, "raw", runId);
  ensureDir(rawDir);
  const ext = source.directDownloadUrl.includes(".json") || source.directDownloadUrl.includes("/api/") ? "json" : "txt";
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
  } catch (error) {
    manifest.files.push({ sourceId: source.id, domain: source.domain, ok: false, error: error.message });
  }
}

writeJson(path.join(dataRoot, "metadata/fetch-manifest.json"), manifest);
console.log(`Fetched ${manifest.files.filter((file) => file.ok).length} datasets.`);
