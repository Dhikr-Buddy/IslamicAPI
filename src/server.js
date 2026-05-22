import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {
  calculatePrayerTimes,
  getFontCss,
  getFontList,
  getAudioUrl,
  getAyah,
  getHadith,
  getQiblaDirection,
  getReciterList,
  getSurah,
  randomHadith,
  search
} from "../packages/deen-sdk/src/index.js";

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";
const root = path.resolve(new URL("..", import.meta.url).pathname);
const dataRoot = process.env.DEEN_DATA_ROOT || path.join(root, "data");

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname === "/health") return json(res, { ok: true });
    if (url.pathname.match(/^\/quran\/surah\/\d+$/)) return json(res, getSurah(url.pathname.split("/").pop()));
    if (url.pathname.match(/^\/quran\/ayah\/\d+\/\d+$/)) {
      const [, , , surah, ayah] = url.pathname.split("/");
      return json(res, getAyah(surah, ayah));
    }
    if (url.pathname === "/quran/search") return json(res, search(url.searchParams.get("q") || ""));
    if (url.pathname.match(/^\/hadith\/[^/]+$/)) return json(res, getHadith(decodeURIComponent(url.pathname.split("/").pop())));
    if (url.pathname === "/hadith/random") return json(res, randomHadith({ collection: url.searchParams.get("collection") }));
    if (url.pathname === "/prayer/times") {
      return json(res, calculatePrayerTimes(Object.fromEntries(url.searchParams.entries())));
    }
    if (url.pathname === "/qibla") {
      return json(res, {
        direction: getQiblaDirection(url.searchParams.get("latitude"), url.searchParams.get("longitude"))
      });
    }
    if (url.pathname === "/audio/reciters") return json(res, getReciterList());
    if (url.pathname === "/audio/url") {
      return json(
        res,
        { url: getAudioUrl(url.searchParams.get("reciterId"), url.searchParams.get("surah"), url.searchParams.get("ayah")) }
      );
    }
    if (url.pathname === "/fonts") return json(res, getFontList());
    if (url.pathname === "/fonts.css") return text(res, getFontCss(), "text/css; charset=utf-8");
    if (url.pathname.startsWith("/fonts/files/")) return fontFile(res, url.pathname.replace("/fonts/files/", ""));
    if (url.pathname === "/raw-api") {
      return json(res, readJson(path.join(dataRoot, "api/index.json"), { error: "Run pnpm build:api-index first." }));
    }
    return json(res, { error: "Not found" }, 404);
  } catch (error) {
    return json(res, { error: error.message }, 400);
  }
});

server.listen(port, host, () => {
  console.log(`IslamicAPI offline server listening on http://${host}:${port}`);
});

function json(res, body, status = 200) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body, null, 2));
}

function text(res, body, contentType, status = 200) {
  res.writeHead(status, { "content-type": contentType });
  res.end(body);
}

function fontFile(res, fileName) {
  const safeName = path.basename(fileName);
  const filePath = path.join(dataRoot, "fonts/files", safeName);
  if (!fs.existsSync(filePath)) return json(res, { error: "Font not found" }, 404);
  res.writeHead(200, { "content-type": "font/woff2", "cache-control": "public, max-age=31536000, immutable" });
  fs.createReadStream(filePath).pipe(res);
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}
