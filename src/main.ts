import "./styles/index.css";
import { primitivesIntro, renderPrimitives } from "./pages/primitives";
import { renderTokens, tokensIntro } from "./pages/tokens";
import { renderTypography, typographyIntro } from "./pages/typography";
import {
  buttonsIntro,
  iconButtonsIntro,
  renderButtons,
  renderIconButtons,
} from "./pages/buttons";
import { iconsIntro, renderIcons } from "./pages/icons";
import { dropdownIntro, renderDropdown } from "./pages/dropdown";
import { menuIntro, renderMenu } from "./pages/menu";
import { renderSwitch, switchIntro } from "./pages/switch";
import { renderTags, tagsIntro } from "./pages/tags";
import { overviewTitle, renderOverview } from "./pages/overview";
import { elevationIntro, renderElevation } from "./pages/elevation";
import { gridIntro, renderGrid } from "./pages/grid";
import { loadIconSprite } from "./lib/icon";
import { initThemeSwitch } from "./lib/theme";
import { initAgentPanel, setAgentLinks } from "./lib/agent-links";
import { initPageIndex } from "./lib/page-index";
import { initSidebarResize } from "./lib/sidebar-resize";
import { initScrollFades } from "./lib/scroll-fade";

type Route =
  | "overview"
  | "elevation"
  | "grid"
  | "primitives" | "tokens" | "typography" | "icons" | "buttons" | "icon-buttons" | "dropdown" | "menu" | "switch" | "tags";

/** Section links that open their first page (Colors → Primitives). */
const REDIRECTS: Record<string, Route> = { colors: "primitives" };


interface Page {
  /** Where the page sits in the site, shown above the title. */
  crumb: string[];
  title: string;
  description?: string;
  /** "article": running content, blocks 24px apart (Overview, Figma 302:2166). */
  layout?: "article";
  /** Optional page body; receives the content area. */
  render?: (body: HTMLElement) => void;
}

const pages: Record<Route, Page> = {
  overview: {
    crumb: ["Overview"],
    title: overviewTitle,
    layout: "article",
    render: renderOverview,
  },
  elevation: {
    crumb: ["Foundations"],
    title: "Elevation",
    description: elevationIntro,
    render: renderElevation,
  },
  grid: {
    crumb: ["Foundations"],
    title: "Grid",
    description: gridIntro,
    render: renderGrid,
  },
  primitives: {
    crumb: ["Colors"],
    title: "Primitives",
    layout: "article",
    description: primitivesIntro,
    render: renderPrimitives,
  },
  tokens: {
    crumb: ["Colors"],
    title: "Tokens",
    layout: "article",
    description: tokensIntro,
    render: renderTokens,
  },
  typography: {
    crumb: ["Foundations"],
    title: "Typography",
    description: typographyIntro,
    render: renderTypography,
  },
  icons: {
    crumb: ["Foundations"],
    title: "Iconography",
    description: iconsIntro,
    render: renderIcons,
  },
  buttons: {
    crumb: ["Components", "Buttons"],
    title: "Buttons",
    description: buttonsIntro,
    render: renderButtons,
  },
  "icon-buttons": {
    crumb: ["Components", "Buttons"],
    title: "Icon Button",
    description: iconButtonsIntro,
    render: renderIconButtons,
  },
  dropdown: {
    crumb: ["Components"],
    title: "Dropdown",
    description: dropdownIntro,
    render: renderDropdown,
  },
  menu: {
    crumb: ["Components"],
    title: "Menu",
    description: menuIntro,
    render: renderMenu,
  },
  switch: {
    crumb: ["Components"],
    title: "Switch",
    description: switchIntro,
    render: renderSwitch,
  },
  tags: {
    crumb: ["Components"],
    title: "Tags",
    description: tagsIntro,
    render: renderTags,
  },
};

const DEFAULT_ROUTE: Route = "overview";

const crumbEl = document.querySelector<HTMLElement>("#page-crumb")!;
const titleEl = document.querySelector<HTMLElement>("#page-title")!;
const headerEl = document.querySelector<HTMLElement>(".page__header")!;
const pageEl = document.querySelector<HTMLElement>(".page")!;
const descriptionEl = document.querySelector<HTMLElement>("#page-description")!;
const bodyEl = document.querySelector<HTMLElement>("#page-body")!;
const navItems = document.querySelectorAll<HTMLElement>(".nav__item[data-route]");
const pageIndex = initPageIndex(document.querySelector<HTMLElement>(".panel")!, bodyEl, headerEl);

function currentRoute(): Route {
  const hash = window.location.hash.slice(1);
  if (hash in pages) return hash as Route;
  // Unknown or section hashes: show the right page and fix the URL without
  // adding a history entry.
  const route = REDIRECTS[hash] ?? DEFAULT_ROUTE;
  history.replaceState(null, "", `#${route}`);
  return route;
}

/**
 * Fades the new page in: the header, then the first rows of the
 * page's list, 30ms apart (styles/motion.css caps the stagger at 6 steps,
 * so long lists like Tokens don't keep the page waiting).
 */
function playEnter() {
  const [list, ...rest] = Array.from(bodyEl.children) as HTMLElement[];
  const items = [
    headerEl,
    ...(list?.children.length ? (Array.from(list.children) as HTMLElement[]) : list ? [list] : []),
    ...rest,
  ];
  items.forEach((item, i) => {
    item.classList.remove("motion-enter");
    item.style.setProperty("--i", String(i));
  });
  void bodyEl.offsetWidth; // restart the animation on reused elements
  items.forEach((item) => item.classList.add("motion-enter"));
}

function render() {
  const route = currentRoute();
  const page = pages[route];

  // The label above the title is where the page sits: its sidebar group or
  // section (the last crumb).
  crumbEl.textContent = page.crumb[page.crumb.length - 1];
  titleEl.textContent = page.title;
  descriptionEl.textContent = page.description ?? "";
  if (page.layout) pageEl.dataset.layout = page.layout;
  else delete pageEl.dataset.layout;
  document.title = `${page.title} – Design System A/W`;

  bodyEl.replaceChildren();
  setAgentLinks([]); // pages with their own files set them in render()
  page.render?.(bodyEl);
  document.querySelector(".panel")?.scrollTo(0, 0);
  pageIndex.setup();
  playEnter();

  navItems.forEach((item) => {
    const isActive = item.dataset.route === route;
    item.classList.toggle("is-active", isActive);
    const link = item.matches("a") ? item : item.querySelector("a");
    if (isActive) link?.setAttribute("aria-current", "page");
    else link?.removeAttribute("aria-current");
  });
}

/* Nav sections (Foundation, Components) and groups (Colors, Buttons) ------- */

const nav = document.querySelector<HTMLElement>(".nav")!;

function setExpanded(container: HTMLElement, expanded: boolean) {
  container.dataset.expanded = String(expanded);
  container
    .querySelector(":scope > .nav__section-toggle, :scope > .nav__item--parent > .nav__toggle")
    ?.setAttribute("aria-expanded", String(expanded));
}

nav.querySelectorAll<HTMLButtonElement>(".nav__toggle, .nav__section-toggle").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const container = toggle.closest<HTMLElement>("[data-expanded]");
    if (container) setExpanded(container, container.dataset.expanded !== "true");
  });
});

// Clicking a group's name (e.g. Colors) opens its first page and the group.
nav.querySelectorAll<HTMLElement>(".nav__group").forEach((group) => {
  group.querySelector(".nav__item--parent .nav__link")?.addEventListener("click", () => setExpanded(group, true));
});

/** Open every section and group around the current page's link. */
function revealActive() {
  let node = nav.querySelector<HTMLElement>(".nav__item.is-active")?.parentElement?.closest<HTMLElement>("[data-expanded]");
  while (node) {
    setExpanded(node, true);
    node = node.parentElement?.closest<HTMLElement>("[data-expanded]");
  }
}

loadIconSprite();
initThemeSwitch(document.querySelector<HTMLButtonElement>("#theme-switch")!);
initAgentPanel(document.querySelector<HTMLButtonElement>("#agent-toggle")!, document.querySelector<HTMLElement>("#corner")!);
initSidebarResize(document.querySelector<HTMLElement>("#sidebar-resizer")!);
initScrollFades(document.querySelector<HTMLElement>(".panel")!);
window.addEventListener("hashchange", () => {
  render();
  revealActive();
});
// First paint: open the current page's section without animating it.
nav.dataset.instant = "";
render();
revealActive();
requestAnimationFrame(() => requestAnimationFrame(() => delete nav.dataset.instant));
