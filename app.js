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
let lastRecommended = [];

const quizQuestions = [
  { id: "players", question: "How many people will usually play?", options: [{ label: "Mostly 2 players", value: "2" }, { label: "Usually 3 players", value: "3" }, { label: "Full squad of 4", value: "4" }] },
  { id: "pace", question: "What kind of pacing do you prefer?", options: [{ label: "Fast and aggressive", value: "fast" }, { label: "Balanced adventure pace", value: "balanced" }, { label: "Slow, tactical, and careful", value: "tactical" }, { label: "Open-ended sandbox freedom", value: "open" }] },
  { id: "intensity", question: "How hard should the game be?", options: [{ label: "Chill or easy to pick up", value: "light" }, { label: "Medium challenge", value: "medium" }, { label: "High action pressure", value: "high" }, { label: "Hard bosses and punishment", value: "hard" }] },
  { id: "mood", question: "Which setting sounds best tonight?", options: [{ label: "Fantasy or mythic worlds", value: "fantasy" }, { label: "Sci-fi or cyberpunk", value: "sci-fi" }, { label: "Military/tactical realism", value: "military" }, { label: "Horror, zombies, or monsters", value: "monster" }, { label: "Arcade or comedy", value: "comedy" }] },
  { id: "teamwork", question: "How much teamwork do you want?", options: [{ label: "A lot — coordination matters", value: "high" }, { label: "Some teamwork, but not too strict", value: "medium" }, { label: "Mostly just vibe and play", value: "low" }] }
];

function showView(viewName) {
  viewPanels.forEach((panel) => panel.classList.toggle("active", panel.dataset.viewPanel === viewName));
  navTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === viewName));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatPrice(game) {
  const value = game.price?.[activeCurrency];
  const symbol = activeCurrency === "eur" ? "€" : "£";
  return typeof value === "number" ? `${symbol}${value.toFixed(2)}` : "TBA";
}

function youtubeEmbedUrl(query) {
  return `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}`;
}

function youtubeSearchUrl(query) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function uniqueGenres() {
  return [...new Set(games.map((game) => game.genre))].sort();
}

function fillGenreFilter() {
  for (const genre of uniqueGenres()) {
    const option = document.createElement("option");
    option.value = genre;
    option.textContent = genre;
    genreFilter.append(option);
  }
}

function stars(rating) {
  const fullStars = Math.round(rating);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
}

function cardTemplate(game) {
  return `
    <article class="game-card" data-title="${game.title}">
      <button class="card-hitbox" type="button" data-title="${game.title}" aria-label="Open details for ${game.title}"></button>
      <div class="card-cover" style="background-image:linear-gradient(180deg,rgba(4,6,18,.02),rgba(4,6,18,.88)),url('${game.cover}')">
        <span class="price-pill">${formatPrice(game)}</span>
        <span class="genre-pill">${game.genre}</span>
      </div>
      <div class="card-body">
        <div class="card-title-row"><h3>${game.title}</h3><span class="rating">${stars(game.rating)} ${game.rating}</span></div>
        <p class="description">${game.description}</p>
        <div class="quick-meta"><span>${game.players} players</span><span>${game.intensity}</span><span>${game.pace}</span></div>
        <div class="tags">${game.tags.slice(0, 4).map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
      </div>
    </article>`;
}

function matchesPlayerFilter(game, filter) {
  if (filter === "all") return true;
  return Number(game.players) >= Number(filter);
}

function renderGames() {
  const query = searchInput.value.trim().toLowerCase();
  const genre = genreFilter.value;
  const players = playerFilter.value;
  const filteredGames = games.filter((game) => {
    const haystack = [game.title, game.genre, game.platforms, game.vibe, game.description, ...game.tags].join(" ").toLowerCase();
    return haystack.includes(query) && (genre === "all" || game.genre === genre) && matchesPlayerFilter(game, players);
  });
  grid.innerHTML = filteredGames.map(cardTemplate).join("");
  gameCount.textContent = games.length;
  emptyState.classList.toggle("hidden", filteredGames.length > 0);
  grid.querySelectorAll(".card-hitbox").forEach((button) => button.addEventListener("click", () => openGameModal(button.dataset.title)));
}

function resetAllFilters() {
  searchInput.value = "";
  genreFilter.value = "all";
  playerFilter.value = "all";
  renderGames();
}

function openGameModal(title) {
  const game = games.find((item) => item.title === title);
  if (!game) return;
  const trailerQuery = game.trailerQuery || `${game.title} official trailer`;
  const gameplayQuery = game.gameplayQuery || `${game.title} co-op gameplay`;
  modalContent.innerHTML = `
    <div class="modal-scroll">
      <div class="modal-hero" style="background-image:linear-gradient(90deg,rgba(5,7,18,.98),rgba(5,7,18,.72),rgba(5,7,18,.16)),url('${game.cover}')">
        <div>
          <p class="eyebrow">${game.genre}</p>
          <h2>${game.title}</h2>
          <p>${game.whyPlay}</p>
          <div class="modal-actions">
            <a class="button primary" href="${game.storeUrl}" target="_blank" rel="noreferrer">Store page</a>
            <a class="button secondary" href="${youtubeSearchUrl(trailerQuery)}" target="_blank" rel="noreferrer">Open trailer on YouTube</a>
          </div>
        </div>
        <div class="modal-price"><span>Guide price</span><strong>${formatPrice(game)}</strong></div>
      </div>

      <div class="modal-grid">
        <section><h3>What you get</h3><ul class="detail-list">${game.details.map((detail) => `<li>${detail}</li>`).join("")}</ul></section>
        <section><h3>Session info</h3><div class="info-grid"><span><strong>Players</strong>${game.players}</span><span><strong>Platforms</strong>${game.platforms}</span><span><strong>Difficulty</strong>${game.intensity}</span><span><strong>Pace</strong>${game.pace}</span><span><strong>Story</strong>${game.story}</span><span><strong>Teamwork</strong>${game.teamwork}</span></div></section>
      </div>

      <section class="video-section">
        <div class="video-head"><div><p class="eyebrow">Watch directly</p><h3>Trailer and gameplay</h3></div><p>Embedded YouTube search panels are used so each game can show relevant videos without a backend.</p></div>
        <div class="video-grid">
          <article class="video-card"><h4>Official trailer</h4><iframe title="${game.title} trailer" src="${youtubeEmbedUrl(trailerQuery)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></article>
          <article class="video-card"><h4>Co-op gameplay</h4><iframe title="${game.title} gameplay" src="${youtubeEmbedUrl(gameplayQuery)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></article>
        </div>
      </section>
    </div>`;
  modal.showModal();
}

function renderShortlist(selectedTitle = shortlistGames[0]) {
  const shortlist = shortlistGames.map((title) => games.find((game) => game.title === title)).filter(Boolean);
  const selected = shortlist.find((game) => game.title === selectedTitle) || shortlist[0];
  shortlistButtons.innerHTML = shortlist.map((game, index) => `<button class="shortlist-button ${game.title === selected.title ? "active" : ""}" data-title="${game.title}"><span>0${index + 1}</span><strong>${game.title}</strong><small>${game.genre} · ${formatPrice(game)}</small></button>`).join("");
  shortlistDetail.innerHTML = `<div class="spotlight-art" style="background-image:linear-gradient(180deg,rgba(8,10,24,.02),rgba(8,10,24,.92)),url('${selected.cover}')"></div><div class="spotlight-content"><p class="eyebrow">Current pick</p><h3>${selected.title}</h3><p>${selected.whyPlay}</p><div class="spotlight-meta"><span><strong>Best for:</strong> ${selected.players} players</span><span><strong>Price:</strong> ${formatPrice(selected)}</span><span><strong>Style:</strong> ${selected.vibe}</span></div><button class="button primary" type="button" id="openSpotlight">Open details</button></div>`;
  shortlistButtons.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => renderShortlist(button.dataset.title)));
  document.querySelector("#openSpotlight").addEventListener("click", () => openGameModal(selected.title));
}

function renderQuiz() {
  quizForm.innerHTML = quizQuestions.map((question, index) => `<fieldset class="quiz-card"><legend><span>Question ${index + 1}</span>${question.question}</legend><div class="option-grid">${question.options.map((option) => `<label class="quiz-option"><input type="radio" name="${question.id}" value="${option.value}" /><span>${option.label}</span></label>`).join("")}</div></fieldset>`).join("");
}

function getQuizAnswers() {
  return Object.fromEntries(quizQuestions.map((question) => {
    const checked = quizForm.querySelector(`input[name="${question.id}"]:checked`);
    return [question.id, checked ? checked.value : null];
  }));
}

function scoreGame(game, answers) {
  let score = 0;
  if (answers.players && Number(game.players) >= Number(answers.players)) score += 3;
  if (answers.pace && game.pace === answers.pace) score += 3;
  if (answers.intensity && game.intensity === answers.intensity) score += 3;
  if (answers.mood && (game.mood === answers.mood || (answers.mood === "monster" && ["monster", "pulp", "adventure", "horror", "zombie"].includes(game.mood)) || (answers.mood === "comedy" && ["comedy", "arcade", "chaotic"].includes(game.mood)))) score += 3;
  if (answers.teamwork && game.teamwork === answers.teamwork) score += 2;
  return score + game.rating / 2;
}

function renderRecommendations() {
  const answers = getQuizAnswers();
  const answeredCount = Object.values(answers).filter(Boolean).length;
  if (answeredCount < 3) {
    quizResults.innerHTML = `<article class="result-note"><h3>Answer at least 3 questions.</h3><p>The recommendations get better when you give the quiz a little more information.</p></article>`;
    return;
  }
  lastRecommended = [...games].map((game) => ({ game, score: scoreGame(game, answers) })).sort((a, b) => b.score - a.score).slice(0, 3).map(({ game }) => game);
  quizResults.innerHTML = lastRecommended.map((game, index) => `<article class="recommendation-card" style="background-image:linear-gradient(180deg,rgba(7,9,22,.1),rgba(7,9,22,.96)),url('${game.cover}')"><span class="rank">#${index + 1}</span><h3>${game.title}</h3><p>${game.description}</p><div class="meta"><span><strong>Players:</strong> ${game.players}</span><span><strong>Price:</strong> ${formatPrice(game)}</span><span><strong>Genre:</strong> ${game.genre}</span></div><button class="button secondary recommendation-open" data-title="${game.title}" type="button">Open details</button></article>`).join("");
  quizResults.querySelectorAll(".recommendation-open").forEach((button) => button.addEventListener("click", () => openGameModal(button.dataset.title)));
}

function resetQuizForm() {
  quizForm.reset();
  quizResults.innerHTML = "";
  lastRecommended = [];
}

function setCurrency(currency) {
  activeCurrency = currency;
  currencyButtons.forEach((button) => button.classList.toggle("active", button.dataset.currency === currency));
  renderGames();
  renderShortlist();
  if (lastRecommended.length) renderRecommendations();
}

fillGenreFilter();
renderGames();
renderShortlist();
renderQuiz();

navTabs.forEach((tab) => tab.addEventListener("click", () => showView(tab.dataset.view)));
searchInput.addEventListener("input", renderGames);
genreFilter.addEventListener("change", renderGames);
playerFilter.addEventListener("change", renderGames);
resetFilters.addEventListener("click", resetAllFilters);
showResults.addEventListener("click", renderRecommendations);
resetQuiz.addEventListener("click", resetQuizForm);
currencyButtons.forEach((button) => button.addEventListener("click", () => setCurrency(button.dataset.currency)));
modalClose.addEventListener("click", () => modal.close());
modal.addEventListener("click", (event) => { if (event.target === modal) modal.close(); });
