import http from "node:http";
import {
  calculatePrayerTimes,
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
