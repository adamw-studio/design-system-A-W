import "./styles/index.css";
import { renderPrimitives } from "./pages/primitives";
import { renderTokens } from "./pages/tokens";
import { renderTypography, typographyIntro } from "./pages/typography";

type Route = "primitives" | "tokens" | "typography" | "buttons";

/** Section links that open their first page (Colors → Primitives). */
const REDIRECTS: Record<string, Route> = { colors: "primitives" };

interface Page {
  title: string;
  description: string;
  /** Optional page body; receives the content area and the header actions slot. */
  render?: (body: HTMLElement, actions: HTMLElement) => void;
}

const pages: Record<Route, Page> = {
  primitives: {
    title: "Primitives",
    description:
      "The raw color palette. Components should use semantic tokens, which point to these values. Click a swatch to copy its CSS variable.",
    render: renderPrimitives,
  },
  tokens: {
    title: "Tokens",
    description:
      "Semantic color tokens give each primitive a purpose, with a value for light and dark mode. Use these in components. Click a row to copy its CSS variable.",
    render: renderTokens,
  },
  typography: {
    title: "Typography",
    description: typographyIntro,
    render: renderTypography,
  },
  buttons: { title: "Buttons", description: "Add a short description..." },
};

const DEFAULT_ROUTE: Route = "primitives";

const titleEl = document.querySelector<HTMLElement>("#page-title")!;
const descriptionEl = document.querySelector<HTMLElement>("#page-description")!;
const bodyEl = document.querySelector<HTMLElement>("#page-body")!;
const actionsEl = document.querySelector<HTMLElement>("#page-actions")!;
const navItems = document.querySelectorAll<HTMLElement>(".nav__item[data-route]");

function currentRoute(): Route {
  const hash = window.location.hash.slice(1);
  if (hash in pages) return hash as Route;
  // Unknown or section hashes: show the right page and fix the URL without
  // adding a history entry.
  const route = REDIRECTS[hash] ?? DEFAULT_ROUTE;
  history.replaceState(null, "", `#${route}`);
  return route;
}

function render() {
  const route = currentRoute();
  const page = pages[route];

  titleEl.textContent = page.title;
  descriptionEl.textContent = page.description;
  document.title = `${page.title} – Design System A/W`;

  bodyEl.replaceChildren();
  actionsEl.replaceChildren();
  page.render?.(bodyEl, actionsEl);
  document.querySelector(".panel")?.scrollTo(0, 0);

  navItems.forEach((item) => {
    const isActive = item.dataset.route === route;
    item.classList.toggle("is-active", isActive);
    const link = item.matches("a") ? item : item.querySelector("a");
    if (isActive) link?.setAttribute("aria-current", "page");
    else link?.removeAttribute("aria-current");
  });
}

// Clicking a section (e.g. Colors) opens its first page; make sure the
// section is expanded so the highlighted page is visible.
document.querySelectorAll<HTMLElement>(".nav__group").forEach((group) => {
  group.querySelector(".nav__item--parent .nav__link")?.addEventListener("click", () => {
    group.dataset.expanded = "true";
    group.querySelector(".nav__toggle")?.setAttribute("aria-expanded", "true");
  });
});

document.querySelectorAll<HTMLButtonElement>(".nav__toggle").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const group = toggle.closest<HTMLElement>(".nav__group");
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    if (group) group.dataset.expanded = String(!expanded);
  });
});

window.addEventListener("hashchange", render);
render();
