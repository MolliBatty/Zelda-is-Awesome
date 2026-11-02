// api.js
// Fetches Zelda game data and caches it in localStorage so pages load fast.

const BASE_URL = "https://zelda.fanapis.com/api";
const CACHE_KEY = "zelda-games-cache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function readCache() {
    try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
        if (cached && Date.now() - cached.savedAt < CACHE_TTL_MS && cached.games?.length) {
            return cached.games;
        }
    } catch {
        // ignore bad cache
    }
    return null;
}

function writeCache(games) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), games }));
    } catch {
        // ignore storage errors
    }
}

/** The API lists a few games twice, so keep the first of each name. */
function dedupeByName(games) {
    const seen = new Set();
    return games.filter((g) => {
        const key = g.name.trim().toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function sortByRelease(games) {
    const time = (g) => {
        const t = Date.parse(g.released_date);
        return Number.isNaN(t) ? Infinity : t;
    };
    return [...games].sort((a, b) => time(a) - time(b) || a.name.localeCompare(b.name));
}

export async function fetchGames() {
    const cached = readCache();
    if (cached) return cached;

    const response = await fetch(`${BASE_URL}/games?limit=100`);
    if (!response.ok) {
        throw new Error(`The Zelda API responded with status ${response.status}.`);
    }
    const json = await response.json();
    const games = sortByRelease(dedupeByName(json.data ?? []));
    writeCache(games);
    return games;
}

export async function fetchGameById(id) {
    const games = await fetchGames();
    return games.find((g) => g.id === id) ?? null;
}