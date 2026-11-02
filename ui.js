// ui.js
// Small DOM helpers shared by every page. Uses textContent (never innerHTML)
// so API data can't inject markup.

export function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
        if (value === null || value === undefined || value === false) continue;
        if (key === "class") node.className = value;
        else if (key === "text") node.textContent = value;
        else if (key === "style") node.setAttribute("style", value);
        else if (key.startsWith("on") && typeof value === "function") {
            node.addEventListener(key.slice(2), value);
        } else node.setAttribute(key, value);
    }
    node.append(...children.flat().filter((c) => c !== null && c !== undefined && c !== false));
    return node;
}

export function formatDate(value) {
    if (!value) return "Unknown";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function gameUrl(id) {
    return `game.html?id=${encodeURIComponent(id)}`;
}

export function showStatus(container, message, { loading = false, error = false } = {}) {
    container.replaceChildren(
        el(
            "p",
            { class: `status${error ? " status-error" : ""}`, role: error ? "alert" : "status" },
            loading ? el("span", { class: "spinner", "aria-hidden": "true" }) : null,
            message
        )
    );
}