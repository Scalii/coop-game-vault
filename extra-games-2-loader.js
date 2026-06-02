async function loadExtraGamesTwo() {
  try {
    if (document.querySelector('script[data-extra-games-two="true"]')) return;
    const before = games.length;
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "extra-games-2.js?v=2026-06-02-5";
      script.dataset.extraGamesTwo = "true";
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });

    if (games.length === before) return;

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

    if (typeof renderGames === "function") renderGames();
    if (typeof renderShortlist === "function") renderShortlist();
    if (typeof loadLivePrices === "function") loadLivePrices();
  } catch (error) {
    console.warn("Extra static catalogue unavailable", error);
  }
}

loadExtraGamesTwo();
