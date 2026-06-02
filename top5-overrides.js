const requestedTopFive = [
  {
    title: "Tom Clancy's The Division 2",
    alias: "Tom Clancy: The Division 2"
  },
  {
    title: "Warhammer 40,000: Space Marine 2",
    data: game({
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
    })
  },
  {
    title: "Gears 5"
  },
  {
    title: "Forza Motorsport",
    alias: "Forza 6",
    data: game({
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
    })
  },
  {
    title: "Overwatch 2",
    alias: "Overwatch (2026)",
    data: game({
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
      whyPlay: "A strong final Top 5 slot if your group wants fast competitive co-op/teamplay, hero abilities, and quick matches.",
      details: ["Free-to-play", "Team-based hero shooter", "Role and ability synergy"],
      tags: ["5 players", "free", "hero shooter", "competitive", "teamwork"]
    })
  }
];

for (const entry of requestedTopFive) {
  const title = entry.data?.title || entry.title;
  if (entry.data && !games.some((item) => item.title === title)) {
    games.unshift(entry.data);
  }
}

window.featuredShortlistOverride = requestedTopFive.map((entry) => entry.data?.title || entry.title);
window.featuredShortlistLabels = Object.fromEntries(requestedTopFive.map((entry) => [entry.data?.title || entry.title, entry.alias || entry.title]));

window.renderRequestedTopFive = function renderRequestedTopFive(selectedTitle = window.featuredShortlistOverride[0]) {
  const source = window.featuredShortlistOverride;
  const shortlist = source.map((title) => games.find((game) => game.title === title)).filter(Boolean);
  const selected = shortlist.find((game) => game.title === selectedTitle) || shortlist[0];
  if (!selected || typeof shortlistButtons === "undefined" || typeof shortlistDetail === "undefined") return;

  shortlistButtons.innerHTML = shortlist.map((game, index) => {
    const label = window.featuredShortlistLabels?.[game.title] || game.title;
    return `<button class="shortlist-button ${game.title === selected.title ? "active" : ""}" data-title="${game.title}"><span>0${index + 1}</span><strong>${label}</strong><small>${game.genre} · ${formatPrice(game)} · ${priceSubline(game)}</small></button>`;
  }).join("");

  const selectedLabel = window.featuredShortlistLabels?.[selected.title] || selected.title;
  shortlistDetail.innerHTML = `<div class="spotlight-art" style="background-image:linear-gradient(180deg,rgba(8,10,24,.02),rgba(8,10,24,.92)),url('${selected.cover}')"></div><div class="spotlight-content"><p class="eyebrow">Current pick</p><h3>${selectedLabel}</h3><p>${selected.whyPlay}</p><div class="spotlight-meta"><span><strong>Best for:</strong> ${selected.players} players</span><span><strong>Price:</strong> ${formatPrice(selected)} · ${priceSubline(selected)}</span><span><strong>Style:</strong> ${selected.vibe}</span>${selected.gamePassPc === "included" ? `<span><strong>PC Game Pass:</strong> Included</span>` : ""}</div><button class="button primary" type="button" id="openSpotlight">Open details</button></div>`;

  shortlistButtons.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => window.renderRequestedTopFive(button.dataset.title)));
  document.querySelector("#openSpotlight")?.addEventListener("click", () => openGameModal(selected.title));
};

window.renderRequestedTopFive();
if (typeof renderGames === "function") renderGames();
if (typeof loadLivePrices === "function") loadLivePrices();
