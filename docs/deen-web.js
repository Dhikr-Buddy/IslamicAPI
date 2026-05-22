const DEFAULTS = {
  owner: "Dhikr-Buddy",
  repo: "IslamicAPI",
  ref: "master"
};

export function rawUrl(path, options = {}) {
  const config = { ...DEFAULTS, ...options };
  return `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.ref}/${String(path).replace(/^\/+/, "")}`;
}

export function createDeenRawClient(options = {}) {
  const indexUrl = rawUrl("data/api/index.json", options);
  async function json(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failed ${response.status}: ${url}`);
    return response.json();
  }
  async function load(key) {
    const index = await json(indexUrl);
    const file = index.files[key];
    if (!file) throw new Error(`Unknown Deen raw API key: ${key}`);
    return json(file.url);
  }
  return {
    indexUrl,
    loadIndex: () => json(indexUrl),
    loadQuran: () => load("quran"),
    loadHadith: () => load("hadith"),
    loadAudio: () => load("audio"),
    loadFonts: () => load("fonts"),
    rawUrl: (path) => rawUrl(path, options)
  };
}
