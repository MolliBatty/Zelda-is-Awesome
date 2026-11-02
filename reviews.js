// reviews.js
// Review storage (localStorage) and form validation rules.

const REVIEWS_KEY = "zelda-reviews";

function readAll() {
    try {
        const parsed = JSON.parse(localStorage.getItem(REVIEWS_KEY));
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
        return {};
    }
}

function writeAll(all) {
    try {
        localStorage.setItem(REVIEWS_KEY, JSON.stringify(all));
        return true;
    } catch {
        return false;
    }
}

export function getReviews(gameId) {
    return readAll()[gameId] ?? [];
}

export function addReview(gameId, review) {
    const all = readAll();
    const entry = {
        id: crypto.randomUUID?.() ?? String(Date.now()),
        createdAt: new Date().toISOString(),
        ...review,
    };
    all[gameId] = [entry, ...(all[gameId] ?? [])];
    return writeAll(all) ? entry : null;
}

export function deleteReview(gameId, reviewId) {
    const all = readAll();
    all[gameId] = (all[gameId] ?? []).filter((r) => r.id !== reviewId);
    writeAll(all);
}

export function todayISO() {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/** Returns an object of { fieldName: "error message" }. Empty object = valid. */
export function validateReview({ name, rating, played, text }) {
    const errors = {};
    const cleanName = (name ?? "").trim();
    const cleanText = (text ?? "").trim();

    if (!cleanName) errors.name = "Please tell us your name.";
    else if (cleanName.length < 2) errors.name = "Your name must be at least 2 characters.";
    else if (cleanName.length > 30) errors.name = "Your name must be 30 characters or fewer.";
    else if (!/^[\p{L}\p{N} '.-]+$/u.test(cleanName)) {
        errors.name = "Use only letters, numbers, spaces, apostrophes, periods or hyphens.";
    }

    const ratingNum = Number(rating);
    if (!rating) errors.rating = "Please choose a rating.";
    else if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        errors.rating = "Rating must be between 1 and 5.";
    }

    if (!played) errors.played = "Please pick the date you played.";
    else if (Number.isNaN(Date.parse(played))) errors.played = "That date doesn't look right.";
    else if (played > todayISO()) errors.played = "The date can't be in the future.";

    if (!cleanText) errors.text = "Please write a short review.";
    else if (cleanText.length < 20) {
        errors.text = `Add a little more detail (${cleanText.length}/20 characters minimum).`;
    } else if (cleanText.length > 500) {
        errors.text = "Keep your review to 500 characters or fewer.";
    }

    return errors;
}