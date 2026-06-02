function appendNewGenres() {
  if (typeof genreFilter === "undefined" || !genreFilter) return;
  const existingGenres = new Set([...genreFilter.options].map((option) => option.value));
  const newGenres = [...new Set(games.map((item) => item.genre))].sort();
  for (const genre of newGenres) {
    if (existingGenres.has(genre)) continue;
    const option = document.createElement("option");
    option.value = genre;
    option.textContent = genre;
    genreFilter.append(option);
  }
}

function refreshCatalogueViews() {
  appendNewGenres();
  if (typeof renderGames === "function") renderGames();
  if (typeof renderShortlist === "function") renderShortlist();
  if (typeof loadLivePrices === "function") loadLivePrices();
}

async function loadScriptOnce(src, marker) {
  if (document.querySelector(`script[data-loader-marker="${marker}"]`)) return false;
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.dataset.loaderMarker = marker;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
  return true;
}

async function loadStaticExpansion() {
  try {
    const before = games.length;
    await loadScriptOnce("extra-games-2.js?v=2026-06-02-6", "extra-games-2");
    if (games.length > before) refreshCatalogueViews();
  } catch (error) {
    console.warn("Static co-op expansion unavailable", error);
  }
}

async function loadSteamCoopCatalogue() {
  await loadStaticExpansion();

  try {
    const response = await fetch("/api/steam-coop?limit=180");
    if (!response.ok) throw new Error(`Steam co-op API failed: ${response.status}`);

    const data = await response.json();
    const importedGames = Array.isArray(data.games) ? data.games : [];
    if (!importedGames.length) return;

    const existingKeys = new Set(games.map((item) => `${item.appId || ""}:${item.title.toLowerCase()}`));
    let added = 0;

    for (const item of importedGames) {
      const key = `${item.appId || ""}:${item.title.toLowerCase()}`;
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);
      games.push(game(item));
      added += 1;
    }

    if (!added) return;
    document.body.dataset.steamCoopLoaded = String(added);
    refreshCatalogueViews();
  } catch (error) {
    console.warn("Dynamic Steam co-op catalogue unavailable", error);
  }
}

loadSteamCoopCatalogue();
