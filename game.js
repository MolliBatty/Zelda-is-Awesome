// game.js  (detail page)
// Reads ?id=... from the URL, shows that game, and hosts the review form.

import { fetchGames, fetchGameById } from "./api.js";
import { isFavorite, toggleFavorite } from "./favorites.js";
import { initDropdown } from "./dropdown.js";
import { addReview, deleteReview, getReviews, todayISO, validateReview } from "./reviews.js";
import { el, formatDate, showStatus } from "./ui.js";

const detail = document.getElementById("game-detail");
const reviewsSection = document.getElementById("reviews-section");
const form = document.getElementById("review-form");
const formStatus = document.getElementById("form-status");
const reviewList = document.getElementById("reviews-list");
const reviewSummary = document.getElementById("review-summary");
const textCount = document.getElementById("text-count");

const FIELDS = ["name", "rating", "played", "text"];
const gameId = new URLSearchParams(window.location.search).get("id");

/* ---------- Game details ---------- */

function renderGame(game) {
    document.title = `${game.name} | Zelda is Awesome`;

    const favButton = el("button", { type: "button", class: "btn fav-wide" });
    const paintFav = () => {
        const fav = isFavorite(game.id);
        favButton.setAttribute("aria-pressed", String(fav));
        favButton.textContent = fav ? "♥ Favorited" : "♡ Add to favorites";
    };
    favButton.addEventListener("click", () => {
        toggleFavorite(game.id);
        paintFav();
    });
    paintFav();

    detail.replaceChildren(
        el("a", { class: "back-link", href: "index.html", text: "← Back to all games" }),
        el("h2", { id: "game-title", text: game.name }),
        el(
            "dl",
            { class: "facts" },
            el("div", {}, el("dt", { text: "Released" }), el("dd", { text: formatDate(game.released_date) })),
            el("div", {}, el("dt", { text: "Developer" }), el("dd", { text: game.developer || "Unknown" })),
            el("div", {}, el("dt", { text: "Publisher" }), el("dd", { text: game.publisher || "Unknown" }))
        ),
        el("p", { text: game.description || "No description available." }),
        favButton
    );
}

/* ---------- Reviews ---------- */

function stars(n) {
    return "★".repeat(n) + "☆".repeat(5 - n);
}

function renderReviews() {
    const reviews = getReviews(gameId);

    if (!reviews.length) {
        reviewSummary.textContent = "No reviews yet. Be the first!";
        reviewList.replaceChildren();
        return;
    }

    const avg = reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length;
    reviewSummary.textContent = `${reviews.length} review${reviews.length === 1 ? "" : "s"} · average ${avg.toFixed(1)} / 5`;

    reviewList.replaceChildren(
        ...reviews.map((review) =>
            el(
                "li",
                { class: "review" },
                el(
                    "div",
                    { class: "review-head" },
                    el("strong", { text: review.name }),
                    el("span", {
                        class: "stars",
                        role: "img",
                        "aria-label": `${review.rating} out of 5 stars`,
                        text: stars(Number(review.rating)),
                    })
                ),
                el("p", {
                    class: "meta",
                    text: `Played ${formatDate(review.played)}${review.recommend ? " · Recommends it" : ""}`,
                }),
                el("p", { text: review.text }),
                el("button", {
                    type: "button",
                    class: "btn btn-small btn-danger",
                    "aria-label": `Delete review by ${review.name}`,
                    text: "Delete",
                    onclick: () => {
                        deleteReview(gameId, review.id);
                        renderReviews();
                    },
                })
            )
        )
    );
}

/* ---------- Form validation ---------- */

function readForm() {
    return {
        name: form.elements.name.value,
        rating: form.elements.rating.value,
        played: form.elements.played.value,
        text: form.elements.text.value,
        recommend: form.elements.recommend.checked,
    };
}

function paintError(field, message) {
    const input = form.elements[field];
    document.getElementById(`${field}-error`).textContent = message ?? "";
    if (message) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
}

function setupForm() {
    form.elements.played.max = todayISO();

    // Validate a single field when the user leaves it.
    for (const field of FIELDS) {
        form.elements[field].addEventListener("blur", () => {
            paintError(field, validateReview(readForm())[field]);
        });
        form.elements[field].addEventListener("input", () => {
            if (form.elements[field].getAttribute("aria-invalid")) {
                paintError(field, validateReview(readForm())[field]);
            }
        });
    }

    form.elements.text.addEventListener("input", () => {
        textCount.textContent = `${form.elements.text.value.length} / 500`;
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        formStatus.className = "form-status";

        const data = readForm();
        const errors = validateReview(data);
        FIELDS.forEach((f) => paintError(f, errors[f]));

        const firstBad = FIELDS.find((f) => errors[f]);
        if (firstBad) {
            formStatus.textContent = "Please fix the highlighted fields.";
            formStatus.classList.add("is-error");
            form.elements[firstBad].focus();
            return;
        }

        const saved = addReview(gameId, {
            name: data.name.trim(),
            rating: Number(data.rating),
            played: data.played,
            text: data.text.trim(),
            recommend: data.recommend,
        });

        if (!saved) {
            formStatus.textContent = "Couldn't save your review (browser storage is unavailable).";
            formStatus.classList.add("is-error");
            return;
        }

        form.reset();
        textCount.textContent = "0 / 500";
        formStatus.textContent = "Review saved! Thanks, hero.";
        formStatus.classList.add("is-success");
        renderReviews();
    });
}

/* ---------- Init ---------- */

async function init() {
    if (!gameId) {
        showStatus(detail, "No game selected. Pick one from the menu or go back home.", { error: true });
        reviewsSection.hidden = true;
        return;
    }

    showStatus(detail, "Loading game…", { loading: true });

    try {
        const [game, games] = await Promise.all([fetchGameById(gameId), fetchGames()]);
        initDropdown(games);

        if (!game) {
            showStatus(detail, "We couldn't find that game. It may have been lost in the Lost Woods.", { error: true });
            reviewsSection.hidden = true;
            return;
        }

        renderGame(game);
        setupForm();
        renderReviews();
    } catch (error) {
        console.error(error);
        showStatus(detail, "Couldn't reach Hyrule. Check your connection and refresh.", { error: true });
        reviewsSection.hidden = true;
    }
}

init();