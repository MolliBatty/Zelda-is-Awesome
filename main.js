// main.js  (home page)
// Loads games from the Zelda API, builds the drop-down, a featured game,
// and a searchable/filterable grid. Filters live in the URL (?q=...&fav=1).

import { fetchGames } from "./api.js";
import { getFavorites, toggleFavorite } from "./favorites.js";
import { initDropdown } from "./dropdown.js";
import { el, formatDate, gameUrl, showStatus } from "./ui.js";

const grid = document.getElementById("game-grid");
const featured = document.getElementById("featured-body");
const searchInput = document.getElementById("search");
const favOnly = document.getElementById("fav-only");
const resultCount = document.getElementById("result-count");

let games = [];

function readUrlFilters() {
    const params = new URLSearchParams(window.location.search);
    searchInput.value = params.get("q") ?? "";
    favOnly.checked = params.get("fav") === "1";
}

function syncUrl() {
    const params = new URLSearchParams();
    if (searchInput.value.trim()) params.set("q", searchInput.value.trim());
    if (favOnly.checked) params.set("fav", "1");
    const query = params.toString();
    history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
}

function renderFeatured() {
    if (!games.length) return;
    const game = games[Math.floor(Math.random() * games.length)];
    featured.replaceChildren(
        el("h3", { text: game.name }),
        el("p", { class: "clamp", text: game.description || "No description available." }),
        el("a", { class: "btn btn-dark", href: gameUrl(game.id), text: "View More!" })
    );
}

function buildCard(game, index) {
    const favs = getFavorites();
    const isFav = favs.includes(game.id);

    const favButton = el("button", {
        type: "button",
        class: "fav-btn",
        "aria-pressed": String(isFav),
        "aria-label": `${isFav ? "Remove" : "Add"} ${game.name} ${isFav ? "from" : "to"} favorites`,
        text: isFav ? "♥" : "♡",
    });

    favButton.addEventListener("click", () => {
        const nowFav = toggleFavorite(game.id);
        favButton.setAttribute("aria-pressed", String(nowFav));
        favButton.setAttribute(
            "aria-label",
            `${nowFav ? "Remove" : "Add"} ${game.name} ${nowFav ? "from" : "to"} favorites`
        );
        favButton.textContent = nowFav ? "♥" : "♡";
        if (favOnly.checked) render();
    });

    return el(
        "article",
        { class: "card", style: `--i:${Math.min(index, 15)}` },
        el("div", { class: "card-top" }, el("h3", { text: game.name }), favButton),
        el("p", { class: "meta", text: `Released: ${formatDate(game.released_date)}` }),
        el("p", { class: "clamp", text: game.description || "No description available." }),
        el("a", { class: "btn", href: gameUrl(game.id), text: "View details" })
    );
}

function render() {
    const query = searchInput.value.trim().toLowerCase();
    const favs = getFavorites();

    const list = games.filter((game) => {
        if (favOnly.checked && !favs.includes(game.id)) return false;
        if (!query) return true;
        return (
            game.name.toLowerCase().includes(query) ||
            (game.description ?? "").toLowerCase().includes(query)
        );
    });

    resultCount.textContent = `Showing ${list.length} of ${games.length} games`;

    if (!list.length) {
        grid.replaceChildren(
            el("p", {
                class: "status",
                text: favOnly.checked && !favs.length
                    ? "You haven't favorited anything yet. Tap the heart on a game!"
                    : "No games match your search.",
            })
        );
    } else {
        grid.replaceChildren(...list.map(buildCard));
    }
    syncUrl();
}

async function init() {
    readUrlFilters();
    showStatus(grid, "Summoning games from Hyrule…", { loading: true });
    showStatus(featured, "Loading…", { loading: true });

    try {
        games = await fetchGames();
    } catch (error) {
        console.error(error);
        showStatus(grid, "Couldn't reach Hyrule. Check your connection and refresh.", { error: true });
        showStatus(featured, "Featured game unavailable.", { error: true });
        return;
    }

    initDropdown(games);
    renderFeatured();
    render();

    searchInput.addEventListener("input", render);
    favOnly.addEventListener("change", render);
    document.getElementById("filters").addEventListener("submit", (e) => e.preventDefault());
}

init();