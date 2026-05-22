import fs from "node:fs";
import path from "node:path";
import { dataRoot, readJson, timestamp, writeJson } from "../lib/io.js";

const manifest = readJson(path.join(dataRoot, "metadata/fetch-manifest.json"), { files: [] });
const report = { schemaVersion: 1, generatedAt: timestamp(), files: [] };

for (const file of manifest.files.filter((item) => item.ok)) {
  const absolute = path.join(dataRoot, file.rawPath);
  const text = fs.readFileSync(absolute, "utf8");
  const row = { ...file, bytes: Buffer.byteLength(text), valid: true, warnings: [] };
  if (absolute.endsWith(".json")) {
    try {
      const json = JSON.parse(text);
      row.shape = Array.isArray(json) ? "array" : typeof json;
      row.topLevelKeys = Array.isArray(json) ? [] : Object.keys(json).slice(0, 25);
    } catch (error) {
      row.valid = false;
      row.error = error.message;
    }
  } else if (!text.trim()) {
    row.valid = false;
    row.error = "Empty text file";
  } else if ((/<html[\s>]/i.test(text) || /<!doctype html/i.test(text)) && file.sourceId !== "everyayah-recitations-page") {
    row.valid = false;
    row.error = "Expected dataset text but received HTML.";
  }
  report.files.push(row);
}

writeJson(path.join(dataRoot, "metadata/validation-report.json"), report);
console.log(`Validated ${report.files.length} fetched files.`);
