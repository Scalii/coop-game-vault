const grid = document.querySelector("#gameGrid");
const searchInput = document.querySelector("#searchInput");
const genreFilter = document.querySelector("#genreFilter");
const playerFilter = document.querySelector("#playerFilter");
const emptyState = document.querySelector("#emptyState");
const resetFilters = document.querySelector("#resetFilters");
const gameCount = document.querySelector("#gameCount");
const shortlistButtons = document.querySelector("#shortlistButtons");
const shortlistDetail = document.querySelector("#shortlistDetail");
const quizForm = document.querySelector("#quizForm");
const quizResults = document.querySelector("#quizResults");
const showResults = document.querySelector("#showResults");
const resetQuiz = document.querySelector("#resetQuiz");
const modal = document.querySelector("#gameModal");
const modalClose = document.querySelector("#modalClose");
const modalContent = document.querySelector("#modalContent");
const currencyButtons = document.querySelectorAll(".currency-button");
const navTabs = document.querySelectorAll(".nav-tab");
const viewPanels = document.querySelectorAll("[data-view-panel]");

let activeCurrency = "eur";
let livePrices = {};
let priceState = "idle";
let lastRecommended = [];

const quizQuestions = [
  { id: "players", question: "How many people will usually play?", options: [{ label: "Duo campaign", value: "2" }, { label: "Three-player squad", value: "3" }, { label: "Full squad / 4+", value: "4" }] },
  { id: "pace", question: "What kind of session do you want?", options: [{ label: "Fast combat and constant action", value: "fast" }, { label: "Balanced story and combat", value: "balanced" }, { label: "Careful tactical teamwork", value: "tactical" }, { label: "Open-world freedom", value: "open" }] },
  { id: "intensity", question: "How intense should it be?", options: [{ label: "Chill and easy to start", value: "light" }, { label: "Medium challenge", value: "medium" }, { label: "High-pressure action", value: "high" }, { label: "Hard bosses / punishment", value: "hard" }] },
  { id: "mood", question: "Pick the vibe", options: [{ label: "Fantasy / RPG", value: "fantasy" }, { label: "Sci-fi / looter shooter", value: "sci-fi" }, { label: "Military / tactical", value: "military" }, { label: "Horror / zombies", value: "monster" }, { label: "Arcade / comedy", value: "comedy" }] },
  { id: "teamwork", question: "How coordinated is your group?", options: [{ label: "We coordinate everything", value: "high" }, { label: "Some teamwork, mostly fun", value: "medium" }, { label: "Just let us vibe", value: "low" }] }
];

function showView(viewName) {
  viewPanels.forEach((panel) => panel.classList.toggle("active", panel.dataset.viewPanel === viewName));
  navTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === viewName));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function countryForCurrency() { return activeCurrency === "gbp" ? "GB" : "DE"; }
function staticPrice(game) { const v = game.price?.[activeCurrency]; const s = activeCurrency === "eur" ? "€" : "£"; return typeof v === "number" ? `${s}${v.toFixed(2)}` : "TBA"; }
function formatLiveMoney(value, currency) { if (typeof value !== "number") return null; try { return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || (activeCurrency === "eur" ? "EUR" : "GBP") }).format(value); } catch { const s = activeCurrency === "eur" ? "€" : "£"; return `${s}${value.toFixed(2)}`; } }
function getDeal(game) { return livePrices[game.title] || null; }
function formatPrice(game) { const deal = getDeal(game); const live = formatLiveMoney(deal?.price, deal?.currency); if (live) return live; if (priceState === "loading") return "Loading…"; return staticPrice(game); }
function priceSubline(game) { const deal = getDeal(game); if (deal?.shop) return `${deal.shop}${typeof deal.cut === "number" && deal.cut > 0 ? ` · -${deal.cut}%` : ""}`; if (priceState === "loading") return "checking deals"; return "estimated price"; }
function dealUrl(game) { const deal = getDeal(game); return deal?.url || deal?.itadUrl || game.storeUrl; }
function youtubeSearchUrl(query) { return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`; }
function gamePassBadge(game) { return game.gamePassPc === "included" ? `<span class="gamepass-badge">PC Game Pass</span>` : ""; }

async function loadLivePrices() {
  priceState = "loading";
  renderAllPriceSensitiveViews();
  try {
    const response = await fetch("/api/prices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titles: games.map((game) => game.title), country: countryForCurrency() }) });
    if (!response.ok) throw new Error(`Price API failed: ${response.status}`);
    const data = await response.json();
    livePrices = data.prices || {};
    priceState = "ready";
  } catch (error) {
    console.warn(error);
    livePrices = {};
    priceState = "error";
  }
  renderAllPriceSensitiveViews();
}

async function loadMedia(game, mountId) {
  const mount = document.getElementById(mountId);
  if (!mount || !game.appId) return;
  mount.innerHTML = `<article class="video-loading">Loading trailers…</article>`;
  try {
    const response = await fetch(`/api/media?appId=${encodeURIComponent(game.appId)}`);
    if (!response.ok) throw new Error("No Steam media");
    const data = await response.json();
    const media = data.media || [];
    if (!media.length) throw new Error("No playable media");
    mount.innerHTML = media.slice(0, 2).map((item, index) => `
      <article class="video-card">
        <h4>${index === 0 ? "Trailer" : "Gameplay / Feature video"}</h4>
        <video controls preload="metadata" poster="${item.thumbnail || game.cover}">
          ${item.webm ? `<source src="${item.webm}" type="video/webm" />` : ""}
          ${item.mp4 ? `<source src="${item.mp4}" type="video/mp4" />` : ""}
        </video>
      </article>`).join("");
  } catch (error) {
    const trailerQuery = game.trailerQuery || `${game.title} official trailer`;
    const gameplayQuery = game.gameplayQuery || `${game.title} co-op gameplay`;
    mount.innerHTML = `
      <a class="watch-card" href="${youtubeSearchUrl(trailerQuery)}" target="_blank" rel="noreferrer"><span>Official trailer</span><strong>${game.title}</strong><small>Open YouTube trailer results</small></a>
      <a class="watch-card" href="${youtubeSearchUrl(gameplayQuery)}" target="_blank" rel="noreferrer"><span>Co-op gameplay</span><strong>${game.title}</strong><small>Open gameplay results</small></a>`;
  }
}

function uniqueGenres() { return [...new Set(games.map((game) => game.genre))].sort(); }
function fillGenreFilter() { for (const genre of uniqueGenres()) { const option = document.createElement("option"); option.value = genre; option.textContent = genre; genreFilter.append(option); } }
function stars(rating) { const fullStars = Math.round(rating); return "★".repeat(fullStars) + "☆".repeat(5 - fullStars); }

function cardTemplate(game) {
  const deal = getDeal(game);
  return `
    <article class="game-card" data-title="${game.title}">
      <button class="card-hitbox" type="button" data-title="${game.title}" aria-label="Open details for ${game.title}"></button>
      <div class="card-cover" style="background-image:linear-gradient(180deg,rgba(4,6,18,.02),rgba(4,6,18,.88)),url('${game.cover}')">
        <span class="price-pill"><em>Best deal</em><strong>${formatPrice(game)}</strong><small>${priceSubline(game)}</small></span>
        <span class="genre-pill">${game.genre}</span>
        ${gamePassBadge(game)}
      </div>
      <div class="card-body">
        <div class="card-title-row"><h3>${game.title}</h3><span class="rating">${stars(game.rating)} ${game.rating}</span></div>
        <p class="description">${game.description}</p>
        <div class="quick-meta"><span>${game.players} players</span><span>${game.intensity}</span><span>${game.pace}</span>${deal?.cut ? `<span>-${deal.cut}%</span>` : ""}</div>
        <div class="tags">${game.tags.slice(0, 4).map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
      </div>
    </article>`;
}

function matchesPlayerFilter(game, filter) { if (filter === "all") return true; return Number(game.players) >= Number(filter); }
function renderGames() {
  const query = searchInput.value.trim().toLowerCase(); const genre = genreFilter.value; const players = playerFilter.value;
  const filteredGames = games.filter((game) => { const haystack = [game.title, game.genre, game.platforms, game.vibe, game.description, ...game.tags].join(" ").toLowerCase(); return haystack.includes(query) && (genre === "all" || game.genre === genre) && matchesPlayerFilter(game, players); });
  grid.innerHTML = filteredGames.map(cardTemplate).join(""); gameCount.textContent = games.length; emptyState.classList.toggle("hidden", filteredGames.length > 0); grid.querySelectorAll(".card-hitbox").forEach((button) => button.addEventListener("click", () => openGameModal(button.dataset.title)));
}
function resetAllFilters() { searchInput.value = ""; genreFilter.value = "all"; playerFilter.value = "all"; renderGames(); }

function openGameModal(title) {
  const game = games.find((item) => item.title === title); if (!game) return;
  const deal = getDeal(game); const trailerQuery = game.trailerQuery || `${game.title} official trailer`; const mediaId = `media-${Math.random().toString(36).slice(2)}`;
  modalContent.innerHTML = `
    <div class="modal-scroll">
      <div class="modal-hero" style="background-image:linear-gradient(90deg,rgba(5,7,18,.98),rgba(5,7,18,.72),rgba(5,7,18,.16)),url('${game.cover}')">
        <div><p class="eyebrow">${game.genre}</p><h2>${game.title}</h2><p>${game.whyPlay}</p><div class="modal-actions"><a class="button primary" href="${dealUrl(game)}" target="_blank" rel="noreferrer">Buy best deal</a><a class="button secondary" href="${youtubeSearchUrl(trailerQuery)}" target="_blank" rel="noreferrer">More videos</a></div></div>
        <div class="modal-price"><span>${deal?.shop ? deal.shop : "Best deal"}</span><strong>${formatPrice(game)}</strong><small>${priceSubline(game)}</small>${deal?.regular ? `<del>${formatLiveMoney(deal.regular, deal.currency)}</del>` : ""}${gamePassBadge(game)}</div>
      </div>
      <div class="modal-grid"><section><h3>What you get</h3><ul class="detail-list">${game.details.map((detail) => `<li>${detail}</li>`).join("")}</ul></section><section><h3>Session info</h3><div class="info-grid"><span><strong>Players</strong>${game.players}</span><span><strong>Platforms</strong>${game.platforms}</span><span><strong>Difficulty</strong>${game.intensity}</span><span><strong>Pace</strong>${game.pace}</span><span><strong>Story</strong>${game.story}</span><span><strong>Teamwork</strong>${game.teamwork}</span></div></section></div>
      <section class="video-section"><div class="video-head"><div><p class="eyebrow">Watch directly</p><h3>Trailer and gameplay</h3></div><p>Steam videos play directly when available. If Steam does not expose a playable trailer, the card opens YouTube results.</p></div><div class="video-grid" id="${mediaId}"></div></section>
    </div>`;
  modal.showModal();
  loadMedia(game, mediaId);
}

function renderShortlist(selectedTitle = (typeof featuredShortlist !== "undefined" ? featuredShortlist : shortlistGames)[0]) {
  const source = typeof featuredShortlist !== "undefined" ? featuredShortlist : shortlistGames;
  const shortlist = source.map((title) => games.find((game) => game.title === title)).filter(Boolean); const selected = shortlist.find((game) => game.title === selectedTitle) || shortlist[0];
  shortlistButtons.innerHTML = shortlist.map((game, index) => `<button class="shortlist-button ${game.title === selected.title ? "active" : ""}" data-title="${game.title}"><span>0${index + 1}</span><strong>${game.title}</strong><small>${game.genre} · ${formatPrice(game)} · ${priceSubline(game)}</small></button>`).join("");
  shortlistDetail.innerHTML = `<div class="spotlight-art" style="background-image:linear-gradient(180deg,rgba(8,10,24,.02),rgba(8,10,24,.92)),url('${selected.cover}')"></div><div class="spotlight-content"><p class="eyebrow">Current pick</p><h3>${selected.title}</h3><p>${selected.whyPlay}</p><div class="spotlight-meta"><span><strong>Best for:</strong> ${selected.players} players</span><span><strong>Price:</strong> ${formatPrice(selected)} · ${priceSubline(selected)}</span><span><strong>Style:</strong> ${selected.vibe}</span>${selected.gamePassPc === "included" ? `<span><strong>PC Game Pass:</strong> Included</span>` : ""}</div><button class="button primary" type="button" id="openSpotlight">Open details</button></div>`;
  shortlistButtons.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => renderShortlist(button.dataset.title))); document.querySelector("#openSpotlight").addEventListener("click", () => openGameModal(selected.title));
}

function renderQuiz() { quizForm.innerHTML = quizQuestions.map((question, index) => `<fieldset class="quiz-card"><legend><span>Step ${index + 1} of ${quizQuestions.length}</span>${question.question}</legend><div class="option-grid">${question.options.map((option) => `<label class="quiz-option"><input type="radio" name="${question.id}" value="${option.value}" /><span>${option.label}</span></label>`).join("")}</div></fieldset>`).join(""); }
function getQuizAnswers() { return Object.fromEntries(quizQuestions.map((question) => { const checked = quizForm.querySelector(`input[name="${question.id}"]:checked`); return [question.id, checked ? checked.value : null]; })); }
function scoreGame(game, answers) { let score = 0; if (answers.players && Number(game.players) >= Number(answers.players)) score += 3; if (answers.pace && game.pace === answers.pace) score += 3; if (answers.intensity && game.intensity === answers.intensity) score += 3; if (answers.mood && (game.mood === answers.mood || (answers.mood === "monster" && ["monster", "pulp", "adventure", "horror", "zombie"].includes(game.mood)) || (answers.mood === "comedy" && ["comedy", "arcade", "chaotic"].includes(game.mood)))) score += 3; if (answers.teamwork && game.teamwork === answers.teamwork) score += 2; if (game.gamePassPc === "included") score += .75; return score + game.rating / 2; }
function renderRecommendations() { const answers = getQuizAnswers(); const answeredCount = Object.values(answers).filter(Boolean).length; if (answeredCount < 3) { quizResults.innerHTML = `<article class="result-note"><h3>Answer at least 3 questions.</h3><p>The recommendations get better when you give the quiz a little more information.</p></article>`; return; } lastRecommended = [...games].map((game) => ({ game, score: scoreGame(game, answers) })).sort((a, b) => b.score - a.score).slice(0, 3).map(({ game }) => game); quizResults.innerHTML = lastRecommended.map((game, index) => `<article class="recommendation-card" style="background-image:linear-gradient(180deg,rgba(7,9,22,.1),rgba(7,9,22,.96)),url('${game.cover}')"><span class="rank">#${index + 1}</span>${gamePassBadge(game)}<h3>${game.title}</h3><p>${game.description}</p><div class="meta"><span><strong>Players:</strong> ${game.players}</span><span><strong>Price:</strong> ${formatPrice(game)}</span><span><strong>Deal:</strong> ${priceSubline(game)}</span></div><button class="button secondary recommendation-open" data-title="${game.title}" type="button">Open details</button></article>`).join(""); quizResults.querySelectorAll(".recommendation-open").forEach((button) => button.addEventListener("click", () => openGameModal(button.dataset.title))); }
function resetQuizForm() { quizForm.reset(); quizResults.innerHTML = ""; lastRecommended = []; }
function renderAllPriceSensitiveViews() { renderGames(); renderShortlist(); if (lastRecommended.length) renderRecommendations(); }
function setCurrency(currency) { activeCurrency = currency; currencyButtons.forEach((button) => button.classList.toggle("active", button.dataset.currency === currency)); loadLivePrices(); }

fillGenreFilter(); renderGames(); renderShortlist(); renderQuiz(); loadLivePrices();
navTabs.forEach((tab) => tab.addEventListener("click", () => showView(tab.dataset.view)));
searchInput.addEventListener("input", renderGames); genreFilter.addEventListener("change", renderGames); playerFilter.addEventListener("change", renderGames); resetFilters.addEventListener("click", resetAllFilters); showResults.addEventListener("click", renderRecommendations); resetQuiz.addEventListener("click", resetQuizForm); currencyButtons.forEach((button) => button.addEventListener("click", () => setCurrency(button.dataset.currency))); modalClose.addEventListener("click", () => modal.close()); modal.addEventListener("click", (event) => { if (event.target === modal) modal.close(); });
