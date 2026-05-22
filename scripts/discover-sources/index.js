import path from "node:path";
import { fetchJson } from "../lib/fetch.js";
import { dataRoot, readJson, timestamp, writeJson } from "../lib/io.js";

const SEARCH_QUERIES = [
  "Quran API open source",
  "Quran dataset JSON",
  "Tanzil dataset download",
  "Hadith dataset JSON GitHub",
  "Sunnah.com data export",
  "MP3Quran API",
  "EveryAyah audio dataset",
  "prayer times calculation methods dataset",
  "adhan calculation library data"
];

const seededSources = [
  {
    id: "tanzil-quran-text",
    domain: "quran",
    sourceUrl: "https://tanzil.net/docs/download",
    directDownloadUrl: "https://tanzil.net/pub/download/index.php?type=quran-uthmani&format=text",
    license: "Tanzil terms: verbatim copying/distribution permitted; text changes are not permitted",
    kind: "quran-text",
    openPublic: true
  },
  {
    id: "fawazahmed0-quran-api",
    domain: "quran",
    sourceUrl: "https://github.com/fawazahmed0/quran-api",
    directDownloadUrl: "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-quranuthmani.json",
    license: "Unlicense",
    kind: "quran-json",
    openPublic: true
  },
  {
    id: "fawazahmed0-quran-fonts",
    domain: "fonts",
    sourceUrl: "https://github.com/fawazahmed0/quran-api",
    directDownloadUrl: "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/fonts.json",
    license: "Unlicense for repository metadata; embedded KFGQPC font records retain their upstream EULA",
    kind: "font-index",
    openPublic: true
  },
  {
    id: "ar-tanzil-quran-simple-npm",
    domain: "quran",
    sourceUrl: "https://cdn.jsdelivr.net/npm/ar.tanzil.quran-simple.txt/",
    directDownloadUrl: "https://cdn.jsdelivr.net/npm/ar.tanzil.quran-simple.txt@1.0.0/content.json",
    license: "Tanzil text: Creative Commons Attribution 3.0 with verbatim/no-change terms; npm package metadata lists ISC",
    kind: "quran-json",
    openPublic: true
  },
  {
    id: "quran-foundation-api",
    domain: "quran",
    sourceUrl: "https://github.com/quran/quran.com-api",
    directDownloadUrl: null,
    license: "MIT",
    kind: "quran-api-reference",
    openPublic: true
  },
  {
    id: "alquran-cloud-api",
    domain: "quran",
    sourceUrl: "https://alquran.cloud/api",
    directDownloadUrl: "https://api.alquran.cloud/v1/quran/quran-uthmani",
    license: "License not clearly declared on API docs; retain provenance and review before redistribution",
    kind: "quran-api",
    openPublic: true
  },
  {
    id: "fawazahmed0-hadith-api",
    domain: "hadith",
    sourceUrl: "https://github.com/fawazahmed0/hadith-api",
    directDownloadUrl: "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions.json",
    license: "Unlicense",
    kind: "hadith-index",
    openPublic: true
  },
  {
    id: "mhashim6-open-hadith-data",
    domain: "hadith",
    sourceUrl: "https://github.com/mhashim6/Open-Hadith-Data",
    directDownloadUrl: null,
    license: "Custom/other license; requires review before redistribution",
    kind: "hadith-database",
    openPublic: true
  },
  {
    id: "mp3quran-api",
    domain: "audio",
    sourceUrl: "https://www.mp3quran.net/api",
    directDownloadUrl: "https://www.mp3quran.net/api/v3/reciters?language=eng",
    license: "Public download/index API; per-reciter rights retained by reciters/publishers where applicable",
    kind: "audio-index",
    openPublic: true
  },
  {
    id: "everyayah-recitations-page",
    domain: "audio",
    sourceUrl: "https://everyayah.com/recitations_ayat.html",
    directDownloadUrl: "https://everyayah.com/recitations_ayat.html",
    license: "Public download page with GO/ZIP/MD5 links; per-reciter rights retained by reciters/publishers where applicable",
    kind: "audio-recitation-index",
    openPublic: true
  },
  {
    id: "batoulapps-adhan-js",
    domain: "prayer",
    sourceUrl: "https://github.com/batoulapps/adhan-js",
    directDownloadUrl: null,
    license: "MIT",
    kind: "calculation-reference",
    openPublic: true
  }
];

async function githubSearch(query) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=5`;
  try {
    const json = await fetchJson(url);
    return (json.items || []).map((repo) => ({
      id: `github-${repo.full_name.replace("/", "-")}`,
      domain: inferDomain(`${repo.full_name} ${repo.description || ""}`),
      sourceUrl: repo.html_url,
      directDownloadUrl: null,
      license: repo.license?.spdx_id || "License not detected by GitHub API",
      kind: "discovered-github-repository",
      openPublic: !repo.private,
      stars: repo.stargazers_count,
      discoveredBy: query
    }));
  } catch (error) {
    return [{ query, error: error.message }];
  }
}

function inferDomain(text) {
  const lower = text.toLowerCase();
  if (lower.includes("hadith")) return "hadith";
  if (lower.includes("audio") || lower.includes("recitation") || lower.includes("mp3")) return "audio";
  if (lower.includes("adhan") || lower.includes("prayer")) return "prayer";
  return "quran";
}

const discovered = [];
for (const query of SEARCH_QUERIES) {
  const rows = await githubSearch(query);
  discovered.push(...rows.filter((row) => row.sourceUrl));
}

const byUrl = new Map();
for (const source of [...seededSources, ...discovered]) {
  byUrl.set(source.sourceUrl, {
    ...source,
    retrievalTimestamp: timestamp(),
    rejected: !source.openPublic || /not clearly|custom\/other/i.test(source.license || "")
  });
}

const registry = {
  schemaVersion: 1,
  generatedAt: timestamp(),
  searchQueries: SEARCH_QUERIES,
  sources: [...byUrl.values()]
};

writeJson(path.join(dataRoot, "metadata/source-registry.json"), registry);
writeJson(path.join(dataRoot, "metadata/discovery-report.json"), {
  schemaVersion: 1,
  generatedAt: registry.generatedAt,
  accepted: registry.sources.filter((source) => !source.rejected).map((source) => source.id),
  requiresReview: registry.sources.filter((source) => source.rejected).map((source) => source.id),
  previousRegistryPresent: Boolean(readJson(path.join(dataRoot, "metadata/source-registry.json"), null))
});

console.log(`Discovered ${registry.sources.length} public source candidates.`);
