/**
 * Icons page — Figma "Foundation – UI 2":
 * - Icon Shell (node 28:1006): one icon slot in five sizes, shown in a
 *   preview panel, then when to use each size.
 * - Iconography (node 12:3948): every icon by category and group, each on a
 *   grey card with its name above, three per row in the shared content
 *   column (Figma's frame fits four); search filters it.
 *
 * Icons come from Iconoir via the sprite that `npm run tokens` builds from
 * tokens/icons.json (also the source of the Icons section in llms.txt).
 */
import catalog from "../../tokens/icons.json";
import { agentLinks } from "../lib/agent-links";
import { copyToClipboard, createStatusRegion, flashLabel } from "../lib/copy";
import { codeBlock, el, ruleList, section } from "../lib/docs";
import { icon, iconMarkup, ICON_SPRITE, type IconSize } from "../lib/icon";
import "../styles/pages/icons.css";

export const iconsIntro = catalog.intro;

/** The icon Figma shows in the Icon Shell set. */
const SHELL_ICON = "app-notification";

const ICON_COUNT = new Set(catalog.categories.flatMap((c) => c.groups.flatMap((g) => g.icons))).size;

/** Figma layer names that differ from the Iconoir name, searchable too. */
const FIGMA_NAMES = catalog.figmaNames as Record<string, string>;

function shellPreview() {
  const panel = el("div", "doc-preview");
  const row = el("div", "icon-shell-preview");
  row.setAttribute("role", "img");
  row.setAttribute("aria-label", `Icon Shell sizes: ${catalog.sizes.map((s) => `${s.size}px`).join(", ")}`);
  // Two-row grid: icons share one center line, sizes sit underneath.
  for (const { size } of catalog.sizes) {
    row.append(icon(SHELL_ICON, size as IconSize), el("span", "icon-shell-preview__size text-body-medium", String(size)));
  }
  panel.append(row);
  return panel;
}

function sizeRow({ size, usage }: (typeof catalog.sizes)[number]) {
  const row = el("li", "doc-option");
  const sample = el("div", "doc-option__sample icon-size-sample");
  sample.append(icon(SHELL_ICON, size as IconSize));
  const text = el("div");
  text.append(
    el("p", "doc-option__name text-body-large-strong", `${size}px${size === 24 ? " (default)" : ""}`),
    el("p", "doc-option__usage text-body-large", usage),
    el("code", "doc-option__class", `.icon--${size}`),
  );
  row.append(sample, text);
  return row;
}

function librarySection() {
  const link = el("a", undefined, catalog.library.name);
  link.href = catalog.library.url;
  link.target = "_blank";
  link.rel = "noopener";
  return section("Library", [
    "Our icons come from ",
    link,
    ` (${catalog.library.license}), in its ${catalog.library.style} style. The ${ICON_COUNT} icons below are bundled into one sprite, ${ICON_SPRITE}, by npm run tokens. Inline it once per page and point icons at #icon-<name>.`,
  ]);
}

interface Card {
  item: HTMLElement;
  terms: string;
}

function card(name: string, status: HTMLElement): Card {
  const item = el("li");
  const btn = el("button", "icon-card");
  btn.type = "button";
  btn.setAttribute("aria-label", `${name}. Copy markup`);
  const label = el("span", "icon-card__name text-body-large", name);
  const preview = el("span", "icon-card__preview");
  preview.append(icon(name));
  btn.append(label, preview);
  btn.addEventListener("click", async () => {
    if (await copyToClipboard(iconMarkup(name), status)) flashLabel(label, "Copied markup", name);
  });
  item.append(btn);
  const figma = FIGMA_NAMES[name];
  return { item, terms: `${name} ${figma ?? ""}`.toLowerCase() };
}

function catalogSection(status: HTMLElement) {
  const wrap = el("div", "icon-catalog");

  // Search ------------------------------------------------------------------
  const toolbar = el("div", "icon-toolbar");
  const field = el("label", "icon-search");
  const input = el("input", "icon-search__input text-body-medium");
  input.type = "search";
  input.placeholder = `Search ${ICON_COUNT} icons`;
  input.setAttribute("aria-label", "Search icons");
  input.autocomplete = "off";
  field.append(icon("search", 16), input);
  const count = el("p", "icon-toolbar__count text-body-medium");
  count.setAttribute("aria-live", "polite");
  toolbar.append(field, count);

  const hint = el("p", "icon-catalog__hint text-body-medium", "Click an icon to copy its markup.");
  const empty = el("p", "icon-catalog__empty text-body-large");
  empty.hidden = true;

  // Categories > groups > cards ------------------------------------------------
  const categories = catalog.categories.map((category) => {
    const sec = section(category.name);
    sec.classList.add("icon-category");
    const groups = category.groups.map((group) => {
      const groupEl = el("section", "icon-group");
      const heading = el("h3", "icon-group__title text-heading-small", group.name);
      const grid = el("ul", "icon-grid");
      const cards = group.icons.map((name) => card(name, status));
      grid.append(...cards.map((c) => c.item));
      groupEl.append(heading, grid);
      sec.append(groupEl);
      return { groupEl, cards };
    });
    return { sec, groups };
  });

  const filter = () => {
    const query = input.value.trim().toLowerCase().replace(/\s+/g, "-");
    let shown = 0;
    for (const { sec, groups } of categories) {
      let inCategory = 0;
      for (const { groupEl, cards } of groups) {
        let inGroup = 0;
        for (const c of cards) {
          const match = !query || c.terms.includes(query);
          c.item.hidden = !match;
          if (match) inGroup++;
        }
        groupEl.hidden = inGroup === 0;
        inCategory += inGroup;
      }
      sec.hidden = inCategory === 0;
      shown += inCategory;
    }
    count.textContent = query ? `${shown} matching` : `${ICON_COUNT} icons`;
    empty.hidden = shown > 0;
    empty.textContent = `No icons match “${input.value.trim()}”.`;
  };
  input.addEventListener("input", filter);
  filter();

  wrap.append(toolbar, hint, ...categories.map((c) => c.sec), empty);
  return wrap;
}

export function renderIcons(body: HTMLElement) {
  const status = createStatusRegion();

  const shell = section("Icon Shell", "Every icon sits in an Icon Shell, which sets its size. Swap the icon by name; the shell stays the same.");
  const sizes = el("ul", "doc-options");
  sizes.append(...catalog.sizes.map(sizeRow));
  shell.append(shellPreview(), sizes, codeBlock(`${iconMarkup("bell")}\n${iconMarkup("bell", 16)}`));

  const usage = section("Usage");
  usage.append(ruleList(catalog.rules));

  body.append(
    shell,
    librarySection(),
    usage,
    catalogSection(status),
    agentLinks([{ label: "iconoir.svg", href: ICON_SPRITE, note: "sprite of every icon" }]),
    status,
  );
}
