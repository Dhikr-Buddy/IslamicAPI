export async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "Dhikr-Buddy-IslamicAPI/0.1 reproducible-data-crawler" }
  });
  if (!response.ok) throw new Error(`Fetch failed ${response.status} for ${url}`);
  return response.text();
}

export async function fetchJson(url) {
  return JSON.parse(await fetchText(url));
}

export async function fetchBytes(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "Dhikr-Buddy-IslamicAPI/0.1 reproducible-data-crawler" }
  });
  if (!response.ok) throw new Error(`Fetch failed ${response.status} for ${url}`);
  return Buffer.from(await response.arrayBuffer());
}
