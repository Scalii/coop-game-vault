const ITAD_BASE = "https://api.isthereanydeal.com";
const CACHE_TTL_MS = 10 * 60 * 1000;

globalThis.__priceCache = globalThis.__priceCache || new Map();

function send(res, status, data) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1800");
  res.status(status).json(data);
}

function normalizeCountry(country) {
  const value = String(country || "DE").toUpperCase();
  return /^[A-Z]{2}$/.test(value) ? value : "DE";
}

async function itadFetch(path, { apiKey, country, body }) {
  const url = new URL(`${ITAD_BASE}${path}`);
  if (country) url.searchParams.set("country", country);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ITAD-API-Key": apiKey
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`ITAD ${response.status}: ${text || response.statusText}`);
  }

  return response.json();
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return send(res, 200, { ok: true });
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

  const apiKey = process.env.ITAD_API_KEY;
  if (!apiKey) {
    return send(res, 500, {
      error: "Missing ITAD_API_KEY environment variable. Add it in Vercel project settings."
    });
  }

  try {
    const titles = Array.isArray(req.body?.titles) ? req.body.titles : [];
    const country = normalizeCountry(req.body?.country);
    const cleanTitles = [...new Set(titles.map((title) => String(title || "").trim()).filter(Boolean))].slice(0, 200);

    if (!cleanTitles.length) return send(res, 400, { error: "No titles provided" });

    const cacheKey = `${country}:${cleanTitles.join("|")}`;
    const cached = globalThis.__priceCache.get(cacheKey);
    if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
      return send(res, 200, { ...cached.data, cached: true });
    }

    const lookup = await itadFetch("/lookup/id/title/v1", {
      apiKey,
      body: cleanTitles
    });

    const titleById = new Map();
    for (const [title, id] of Object.entries(lookup || {})) {
      if (id) titleById.set(id, title);
    }

    const ids = [...titleById.keys()];
    if (!ids.length) {
      const empty = { country, prices: {}, missing: cleanTitles };
      globalThis.__priceCache.set(cacheKey, { time: Date.now(), data: empty });
      return send(res, 200, empty);
    }

    const overview = await itadFetch("/games/overview/v2", {
      apiKey,
      country,
      body: ids
    });

    const prices = {};
    for (const item of overview?.prices || []) {
      const title = titleById.get(item.id);
      if (!title) continue;
      const current = item.current || null;
      const historical = item.lowest || null;
      prices[title] = {
        itadId: item.id,
        shop: current?.shop?.name || null,
        price: current?.price?.amount ?? null,
        regular: current?.regular?.amount ?? null,
        currency: current?.price?.currency || null,
        cut: typeof current?.cut === "number" ? current.cut : null,
        url: current?.url || item.urls?.game || null,
        historicalLow: historical?.price?.amount ?? null,
        historicalLowShop: historical?.shop?.name || null,
        itadUrl: item.urls?.game || null
      };
    }

    const missing = cleanTitles.filter((title) => !prices[title]);
    const data = { country, prices, missing, cached: false };
    globalThis.__priceCache.set(cacheKey, { time: Date.now(), data });
    return send(res, 200, data);
  } catch (error) {
    return send(res, 500, {
      error: "Could not load price data",
      detail: error.message
    });
  }
}
