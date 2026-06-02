const hardTopFive = [
  {
    title: "Tom Clancy's The Division 2",
    label: "Tom Clancy: The Division 2"
  },
  {
    title: "Warhammer 40,000: Space Marine 2",
    label: "Warhammer 40,000: Space Marine 2",
    data: {
      title: "Warhammer 40,000: Space Marine 2",
      appId: "2183900",
      genre: "Third-Person Action Shooter",
      players: "3",
      platforms: "PC, PlayStation, Xbox",
      price: { eur: 59.99, gbp: 54.99 },
      rating: 4.4,
      intensity: "high",
      story: "medium",
      pace: "fast",
      mood: "sci-fi",
      teamwork: "high",
      vibe: "Space Marines, Tyranid hordes, brutal co-op action",
      description: "A cinematic Warhammer 40K action shooter with heavy melee, brutal gunplay, swarm battles, and co-op operations.",
      whyPlay: "A perfect top pick if your group wants heavy sci-fi action, satisfying combat, and squad-based 40K chaos.",
      details: ["Three-player co-op operations", "Heavy melee and ranged combat", "Warhammer 40K campaign atmosphere"],
      tags: ["3 players", "Warhammer", "sci-fi", "action", "horde"]
    }
  },
  {
    title: "Gears 5",
    label: "Gears 5"
  },
  {
    title: "Forza Motorsport",
    label: "Forza 6",
    data: {
      title: "Forza Motorsport",
      appId: "2440510",
      genre: "Racing",
      players: "24",
      platforms: "PC, Xbox",
      price: { eur: 69.99, gbp: 59.99 },
      rating: 4.1,
      intensity: "medium",
      story: "light",
      pace: "fast",
      mood: "racing",
      teamwork: "low",
      gamePassPc: "included",
      vibe: "Track racing, multiplayer, cars, tuning",
      description: "A modern Forza racing game with online multiplayer, cars, tuning, events, and PC Game Pass availability.",
      whyPlay: "A good pick if your group wants a break from shooters and wants competitive racing nights instead.",
      details: ["Online multiplayer racing", "Large car selection", "Included with PC Game Pass"],
      tags: ["24 players", "racing", "cars", "game pass", "multiplayer"]
    }
  },
  {
    title: "Overwatch 2",
    label: "Overwatch (2026)",
    data: {
      title: "Overwatch 2",
      appId: "2357570",
      genre: "Hero Shooter",
      players: "5",
      platforms: "PC, PlayStation, Xbox, Switch",
      price: { eur: 0, gbp: 0 },
      rating: 4.0,
      intensity: "high",
      story: "light",
      pace: "fast",
      mood: "sci-fi",
      teamwork: "high",
      vibe: "Hero shooter, roles, team fights, competitive action",
      description: "A free-to-play team hero shooter with roles, abilities, objective modes, and fast squad-based fights.",
      whyPlay: "A strong final Top 5 slot if your group wants fast competitive teamplay, hero abilities, and quick matches.",
      details: ["Free-to-play", "Team-based hero shooter", "Role and ability synergy"],
      tags: ["5 players", "free", "hero shooter", "competitive", "teamwork"]
    }
  }
];

function ensureTopFiveGamesExist() {
  for (const entry of hardTopFive) {
    if (!entry.data) continue;
    if (!games.some((item) => item.title === entry.data.title)) {
      games.unshift(game(entry.data));
    }
  }
}

renderShortlist = function renderShortlist(selectedTitle = hardTopFive[0].title) {
  ensureTopFiveGamesExist();
  const shortlist = hardTopFive
    .map((entry) => ({ entry, game: games.find((item) => item.title === entry.title) }))
    .filter((item) => item.game);
  const selected = shortlist.find((item) => item.game.title === selectedTitle) || shortlist[0];
  if (!selected) return;

  shortlistButtons.innerHTML = shortlist.map(({ entry, game }, index) => `
    <button class="shortlist-button ${game.title === selected.game.title ? "active" : ""}" data-title="${game.title}">
      <span>0${index + 1}</span>
      <strong>${entry.label}</strong>
      <small>${game.genre} · ${formatPrice(game)} · ${priceSubline(game)}</small>
    </button>`).join("");

  shortlistDetail.innerHTML = `
    <div class="spotlight-art" style="background-image:linear-gradient(180deg,rgba(8,10,24,.02),rgba(8,10,24,.92)),url('${selected.game.cover}')"></div>
    <div class="spotlight-content">
      <p class="eyebrow">Current pick</p>
      <h3>${selected.entry.label}</h3>
      <p>${selected.game.whyPlay}</p>
      <div class="spotlight-meta">
        <span><strong>Best for:</strong> ${selected.game.players} players</span>
        <span><strong>Price:</strong> ${formatPrice(selected.game)} · ${priceSubline(selected.game)}</span>
        <span><strong>Style:</strong> ${selected.game.vibe}</span>
        ${selected.game.gamePassPc === "included" ? `<span><strong>PC Game Pass:</strong> Included</span>` : ""}
      </div>
      <button class="button primary" type="button" id="openSpotlight">Open details</button>
    </div>`;

  shortlistButtons.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => renderShortlist(button.dataset.title)));
  document.querySelector("#openSpotlight")?.addEventListener("click", () => openGameModal(selected.game.title));
};

ensureTopFiveGamesExist();
renderShortlist();
if (typeof renderGames === "function") renderGames();
if (typeof loadLivePrices === "function") loadLivePrices();
