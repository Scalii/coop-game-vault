const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
globalThis.__steamCoopCache = globalThis.__steamCoopCache || new Map();

const TAGS = [
  { id: 1685, label: "Co-op" },
  { id: 3843, label: "Online Co-op" },
  { id: 3841, label: "Local Co-op" },
  { id: 10816, label: "Shared/Split Screen Co-op" }
];

function send(res, status, data) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=86400");
  res.status(status).json(data);
}

function stripHtml(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function extractAppsFromHtml(html, sourceTag) {
  const apps = [];
  const regex = /data-ds-appid="(\d+)"[\s\S]*?class="title">([\s\S]*?)<\/span>/g;
  const seen = new Set();
  let match;

  while ((match = regex.exec(html))) {
    const appId = match[1];
    if (seen.has(appId)) continue;
    seen.add(appId);
    const title = stripHtml(match[2]);
    if (!title) continue;

    apps.push({
      title,
      appId,
      sourceTag,
      genre: "Steam Co-op",
      players: "4",
      platforms: "PC",
      rating: 4,
      story: "medium",
      intensity: "medium",
      pace: "balanced",
      mood: "action",
      teamwork: "medium",
      price: { eur: null, gbp: null },
      cover: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_hero.jpg`,
      storeUrl: `https://store.steampowered.com/app/${appId}/`,
      trailerQuery: `${title} official trailer`,
      gameplayQuery: `${title} co-op gameplay`,
      vibe: `${sourceTag} Steam co-op title`,
      description: `A Steam-listed ${sourceTag.toLowerCase()} game pulled automatically into the co-op catalogue. Open the game page for prices, trailers, and store details.`,
      whyPlay: `This game was imported from Steam's ${sourceTag} discovery results and may be worth checking for your next co-op session.`,
      details: ["Imported from Steam co-op discovery", "Live deal price checked when available", "Open details for trailers and store links"],
      tags: [sourceTag, "Steam", "co-op", "PC"]
    });
  }

  return apps;
}

async function fetchTag(tag, count) {
  const url = new URL("https://store.steampowered.com/search/results/");
  url.searchParams.set("query", "");
  url.searchParams.set("start", "0");
  url.searchParams.set("count", String(count));
  url.searchParams.set("dynamic_data", "");
  url.searchParams.set("force_infinite", "1");
  url.searchParams.set("tags", String(tag.id));
  url.searchParams.set("supportedlang", "english");
  url.searchParams.set("ndl", "1");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "coop-game-vault/1.0",
      "Accept": "application/json,text/html;q=0.9,*/*;q=0.8"
    }
  });
  if (!response.ok) throw new Error(`Steam search ${response.status}`);

  const data = await response.json().catch(async () => ({ results_html: await response.text() }));
  return extractAppsFromHtml(data.results_html || "", tag.label);
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return send(res, 200, { ok: true });
  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });

  const limit = Math.max(20, Math.min(Number(req.query?.limit || 120), 240));
  const cacheKey = `steam-coop:${limit}`;
  const cached = globalThis.__steamCoopCache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL_MS) return send(res, 200, { ...cached.data, cached: true });

  try {
    const perTag = Math.ceil(limit / TAGS.length) + 20;
    const groups = await Promise.allSettled(TAGS.map((tag) => fetchTag(tag, perTag)));
    const byAppId = new Map();

    for (const group of groups) {
      if (group.status !== "fulfilled") continue;
      for (const game of group.value) {
        if (!byAppId.has(game.appId)) byAppId.set(game.appId, game);
      }
    }

    const games = [...byAppId.values()].slice(0, limit);
    const data = { games, count: games.length, cached: false };
    globalThis.__steamCoopCache.set(cacheKey, { time: Date.now(), data });
    return send(res, 200, data);
  } catch (error) {
    return send(res, 500, { error: "Could not load Steam co-op catalogue", detail: error.message });
  }
}
