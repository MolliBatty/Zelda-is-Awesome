// favorites.js
// Persists the player's favorite games in localStorage.

const FAV_KEY = "zelda-favorites";

export function getFavorites() {
    try {
        const parsed = JSON.parse(localStorage.getItem(FAV_KEY));
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveFavorites(favs) {
    try {
        localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    } catch {
        // Storage can be full or blocked (private mode). Fail quietly.
    }
}

export function isFavorite(id) {
    return getFavorites().includes(id);
}

/** Adds or removes a favorite. Returns true if the game is now a favorite. */
export function toggleFavorite(id) {
    const favs = getFavorites();
    const updated = favs.includes(id)
        ? favs.filter((f) => f !== id)
        : [...favs, id];
    saveFavorites(updated);
    return updated.includes(id);
}