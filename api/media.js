const CACHE_TTL_MS = 60 * 60 * 1000;
globalThis.__mediaCache = globalThis.__mediaCache || new Map();

function send(res, status, data) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  res.status(status).json(data);
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return send(res, 200, { ok: true });
  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });

  const appId = String(req.query?.appId || "").replace(/[^0-9]/g, "");
  if (!appId) return send(res, 400, { error: "Missing appId" });

  const cached = globalThis.__mediaCache.get(appId);
  if (cached && Date.now() - cached.time < CACHE_TTL_MS) return send(res, 200, { ...cached.data, cached: true });

  try {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&filters=movies`;
    const response = await fetch(url, { headers: { "User-Agent": "coop-game-vault/1.0" } });
    if (!response.ok) throw new Error(`Steam ${response.status}`);
    const json = await response.json();
    const movies = json?.[appId]?.data?.movies || [];

    const media = movies
      .map((movie) => ({
        id: movie.id,
        name: movie.name || "Trailer",
        thumbnail: movie.thumbnail || null,
        mp4: movie.mp4?.max || movie.mp4?.["480"] || null,
        webm: movie.webm?.max || movie.webm?.["480"] || null
      }))
      .filter((movie) => movie.mp4 || movie.webm)
      .slice(0, 4);

    const data = { appId, media, cached: false };
    globalThis.__mediaCache.set(appId, { time: Date.now(), data });
    return send(res, 200, data);
  } catch (error) {
    return send(res, 500, { error: "Could not load media", detail: error.message });
  }
}
