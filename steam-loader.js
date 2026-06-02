async function loadSteamCoopCatalogue() {
  const statusKey = "steam-coop-loaded";

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

    if (typeof genreFilter !== "undefined" && genreFilter) {
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

    document.body.dataset[statusKey] = String(added);

    if (typeof renderGames === "function") renderGames();
    if (typeof renderShortlist === "function") renderShortlist();
    if (typeof loadLivePrices === "function") loadLivePrices();
  } catch (error) {
    console.warn("Dynamic Steam co-op catalogue unavailable", error);
  }
}

loadSteamCoopCatalogue();
