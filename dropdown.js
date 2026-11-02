// dropdown.js
// Accessible drop-down menu of every game, built dynamically from API data.

import { el, gameUrl } from "./ui.js";

export function initDropdown(games) {
    const button = document.getElementById("dropbtn");
    const menu = document.getElementById("dropdown-content");
    if (!button || !menu) return;

    menu.replaceChildren(
        ...games.map((game) => el("a", { href: gameUrl(game.id), text: game.name }))
    );

    function open() {
        menu.hidden = false;
        button.setAttribute("aria-expanded", "true");
    }

    function close({ returnFocus = false } = {}) {
        menu.hidden = true;
        button.setAttribute("aria-expanded", "false");
        if (returnFocus) button.focus();
    }

    button.addEventListener("click", () => (menu.hidden ? open() : close()));

    document.addEventListener("click", (event) => {
        if (!menu.hidden && !event.target.closest(".dropdown")) close();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !menu.hidden) close({ returnFocus: true });
    });

    // Close when keyboard focus leaves the menu entirely.
    menu.addEventListener("focusout", (event) => {
        if (!event.relatedTarget || !event.relatedTarget.closest?.(".dropdown")) close();
    });
}