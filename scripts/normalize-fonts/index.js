import fs from "node:fs";
import path from "node:path";
import { dataRoot, readJson, timestamp, writeJson } from "../lib/io.js";

const manifest = readJson(path.join(dataRoot, "metadata/fetch-manifest.json"), { files: [] });
const out = { schemaVersion: 1, generatedAt: timestamp(), fonts: [], cssPath: "fonts/css/deen-fonts.css" };

for (const file of manifest.files.filter((item) => item.ok && item.domain === "fonts" && item.rawPath.endsWith(".woff2"))) {
  const absolute = path.join(dataRoot, file.rawPath);
  const metadata = readJson(absolute.replace(/\.woff2$/, ".metadata.json"), {});
  const family = fontFamily(metadata.fontId || metadata.fontName || path.basename(absolute, ".woff2"));
  out.fonts.push({
    id: metadata.fontId,
    family,
    file: file.rawPath.replace(/^fonts\/files\//, "files/"),
    category: fontCategory(metadata.fontId, metadata.fontName),
    sourceUrl: metadata.sourceUrl,
    directDownloadUrl: metadata.directDownloadUrl,
    license: metadata.license,
    retrievedAt: metadata.retrievedAt
  });
}

out.fonts.sort((a, b) => a.id.localeCompare(b.id));
writeJson(path.join(dataRoot, "fonts/normalized/fonts.json"), out);
writeJson(path.join(dataRoot, "fonts/validation-report.json"), {
  schemaVersion: 1,
  generatedAt: timestamp(),
  fontCount: out.fonts.length,
  valid: out.fonts.every((font) => font.sourceUrl && font.license && font.retrievedAt)
});
writeJson(path.join(dataRoot, "fonts/css/metadata.json"), {
  schemaVersion: 1,
  generatedAt: timestamp(),
  source: "Generated from data/fonts/normalized/fonts.json"
});
fs.mkdirSync(path.join(dataRoot, "fonts/css"), { recursive: true });
fs.writeFileSync(path.join(dataRoot, "fonts/css/deen-fonts.css"), css(out.fonts));
console.log(`Normalized ${out.fonts.length} Quran font assets.`);

function fontFamily(value) {
  return `Deen ${String(value).replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}`;
}

function fontCategory(id, name) {
  const text = `${id} ${name}`.toLowerCase();
  if (text.includes("nastaleeq") || text.includes("indopak")) return "naskh-indopak";
  if (text.includes("harmattan")) return "plain-arabic";
  return "uthmani";
}

function css(fonts) {
  return `${fonts
    .map(
      (font) => `@font-face {
  font-family: "${font.family}";
  src: url("../${font.file}") format("woff2");
  font-display: swap;
}

.deen-font-${font.id.replace(/[^a-z0-9_-]+/gi, "-")} {
  font-family: "${font.family}", "Amiri Quran", "Scheherazade New", serif;
}`
    )
    .join("\n\n")}\n`;
}
