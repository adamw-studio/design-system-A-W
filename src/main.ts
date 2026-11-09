import "./styles/index.css";
import { primitivesIntro, renderPrimitives } from "./pages/primitives";
import { renderTokens, tokensSubtitle } from "./pages/tokens";
import { renderTypography, typographyIntro, typographySubtitle } from "./pages/typography";
import {
  buttonsIntro,
  buttonsSubtitle,
  iconButtonsIntro,
  iconButtonsSubtitle,
  renderButtons,
  renderIconButtons,
} from "./pages/buttons";
import { iconsIntro, iconsSubtitle, renderIcons } from "./pages/icons";
import { dropdownIntro, dropdownSubtitle, renderDropdown } from "./pages/dropdown";
import { menuIntro, menuSubtitle, renderMenu } from "./pages/menu";
import { renderSwitch, switchIntro, switchSubtitle } from "./pages/switch";
import { renderTags, tagsIntro, tagsSubtitle } from "./pages/tags";
import { overviewTitle, renderOverview } from "./pages/overview";
import { elevationIntro, elevationSubtitle, renderElevation } from "./pages/elevation";
import { gridIntro, gridSubtitle, renderGrid } from "./pages/grid";
import { icon, loadIconSprite } from "./lib/icon";
import { initThemeToggle } from "./lib/theme";
import { initSidebarResize } from "./lib/sidebar-resize";
import { initScrollFades } from "./lib/scroll-fade";

type Route =
  | "overview"
  | "elevation"
  | "grid"
  | "primitives" | "tokens" | "typography" | "icons" | "buttons" | "icon-buttons" | "dropdown" | "menu" | "switch" | "tags";

/** Section links that open their first page (Colors → Primitives). */
const REDIRECTS: Record<string, Route> = { colors: "primitives" };

const FIGMA_WEB = "https://www.figma.com/design/YuW1ykk7CA0ATa8dGi5JRZ/Design-System---Web?node-id=";
const FIGMA_UI = "https://www.figma.com/design/kbpJA5WJuwYrHwFLbLKCG4/Foundation---UI-2?node-id=";

interface Page {
  /** Where the page sits in the site, shown above the title. */
  crumb: string[];
  title: string;
  /** Short facts under the title, e.g. "5 variants". */
  subtitle?: string;
  description?: string;
  /** "article": a small label and the title only (Overview, Figma 302:2166). */
  layout?: "article";
  /** The Figma frame the page implements (opened from the header), if any. */
  figma?: string;
  /** Optional page body; receives the content area and the header actions slot. */
  render?: (body: HTMLElement, actions: HTMLElement) => void;
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
    subtitle: elevationSubtitle,
    title: "Elevation",
    description: elevationIntro,
    render: renderElevation,
  },
  grid: {
    crumb: ["Foundations"],
    subtitle: gridSubtitle(),
    figma: `${FIGMA_WEB}281-279`,
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
    crumb: ["Foundations", "Colors"],
    subtitle: tokensSubtitle(),
    figma: `${FIGMA_WEB}289-1313`,
    title: "Tokens",
    description:
      "Semantic color tokens give each primitive a purpose, with a value for light and dark mode. Use these in components. Click a row to copy its CSS variable.",
    render: renderTokens,
  },
  typography: {
    crumb: ["Foundations"],
    subtitle: typographySubtitle(),
    figma: `${FIGMA_UI}6-182`,
    title: "Typography",
    description: typographyIntro,
    render: renderTypography,
  },
  icons: {
    crumb: ["Foundations"],
    subtitle: iconsSubtitle,
    figma: `${FIGMA_UI}12-3948`,
    title: "Iconography",
    description: iconsIntro,
    render: renderIcons,
  },
  buttons: {
    crumb: ["Components", "Buttons"],
    subtitle: buttonsSubtitle,
    figma: `${FIGMA_UI}18-3529`,
    title: "Buttons",
    description: buttonsIntro,
    render: renderButtons,
  },
  "icon-buttons": {
    crumb: ["Components", "Buttons"],
    subtitle: iconButtonsSubtitle,
    figma: `${FIGMA_UI}23-5380`,
    title: "Icon Button",
    description: iconButtonsIntro,
    render: renderIconButtons,
  },
  dropdown: {
    crumb: ["Components"],
    subtitle: dropdownSubtitle,
    figma: `${FIGMA_UI}45-314`,
    title: "Dropdown",
    description: dropdownIntro,
    render: renderDropdown,
  },
  menu: {
    crumb: ["Components"],
    subtitle: menuSubtitle,
    figma: `${FIGMA_UI}46-588`,
    title: "Menu",
    description: menuIntro,
    render: renderMenu,
  },
  switch: {
    crumb: ["Components"],
    subtitle: switchSubtitle,
    figma: `${FIGMA_UI}42-20`,
    title: "Switch",
    description: switchIntro,
    render: renderSwitch,
  },
  tags: {
    crumb: ["Components"],
    subtitle: tagsSubtitle,
    figma: `${FIGMA_UI}45-14`,
    title: "Tags",
    description: tagsIntro,
    render: renderTags,
  },
};

const DEFAULT_ROUTE: Route = "overview";

const crumbEl = document.querySelector<HTMLElement>("#page-crumb")!;
const titleEl = document.querySelector<HTMLElement>("#page-title")!;
const subtitleEl = document.querySelector<HTMLElement>("#page-subtitle")!;
const headerEl = document.querySelector<HTMLElement>(".page__header")!;
const pageEl = document.querySelector<HTMLElement>(".page")!;
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

/**
 * Fades the new page in: title, description, then the first rows of the
 * page's list, 30ms apart (styles/motion.css caps the stagger at 6 steps,
 * so long lists like Tokens don't keep the page waiting).
 */
function playEnter() {
  const [list, ...rest] = Array.from(bodyEl.children) as HTMLElement[];
  const items = [
    headerEl,
    descriptionEl,
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

/** Header action: an Icon Button that opens the page's Figma frame. */
function figmaLink(href: string, title: string) {
  const link = document.createElement("a");
  link.className = "icon-button";
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener";
  link.setAttribute("aria-label", `Open ${title} in Figma`);
  link.title = "Open in Figma";
  link.append(icon("open-new-window"));
  return link;
}

function render() {
  const route = currentRoute();
  const page = pages[route];

  crumbEl.textContent = page.crumb.join(" / ");
  titleEl.textContent = page.title;
  subtitleEl.textContent = page.subtitle ?? "";
  descriptionEl.textContent = page.description ?? "";
  if (page.layout) pageEl.dataset.layout = page.layout;
  else delete pageEl.dataset.layout;
  document.title = `${page.title} – Design System A/W`;

  bodyEl.replaceChildren();
  actionsEl.replaceChildren(...(page.figma ? [figmaLink(page.figma, page.title)] : []));
  page.render?.(bodyEl, actionsEl);
  document.querySelector(".panel")?.scrollTo(0, 0);
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
initThemeToggle(document.querySelector<HTMLElement>("#theme-toggle")!);
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
