/**
 * Elevation page — listed under Foundation in the sidebar (Figma "Design
 * System - Web", node 302:2196). Figma has no elevation variables, so the
 * scale is a site constant set (src/styles/elevation.css, --elevation-*),
 * like motion. This page shows each level in both themes side by side and
 * explains how the shadows are built and when to use them.
 */
import { agentLinks } from "../lib/agent-links";
import { codeBlock, code, el, ruleList, section, staticPreview, table } from "../lib/docs";
import "../styles/pages/elevation.css";

export const elevationIntro =
  "Elevation tells layers apart: the page, things resting on it, and things floating above. Three levels of soft, layered shadow, tuned to read in both light and dark mode.";
interface Level {
  name: string;
  token: string | null;
  use: string;
}

const LEVELS: Level[] = [
  { name: "Flat", token: null, use: "The page, panels, cards and anything sitting in the layout. Set apart by color and a border, not a shadow." },
  { name: "Raised", token: "--elevation-raised", use: "A card or control that sits just above its surface: the Theme switch and globe button in the corner and their panel, draggable items, a selected card." },
  { name: "Floating", token: "--elevation-floating", use: "Layers over content that are tied to a trigger: dropdown lists, menus, submenus." },
  { name: "Overlay", token: "--elevation-overlay", use: "Layers over the whole page: modals, sheets, toasts. Nothing uses it yet." },
];

const fragment = (...nodes: (Node | string)[]) => {
  const f = document.createDocumentFragment();
  f.append(...nodes);
  return f;
};

/** One row of tiles, one per level, rendered in the given theme. */
function levelRow(theme: "light" | "dark") {
  const row = el("div", "elevation-demo");
  row.dataset.theme = theme;
  row.append(el("span", "elevation-demo__theme text-body-medium", theme === "light" ? "Light" : "Dark"));
  const tiles = el("div", "elevation-demo__tiles");
  for (const level of LEVELS) {
    const tile = el("div", "elevation-demo__tile");
    if (level.token) tile.style.boxShadow = `var(${level.token})`;
    else tile.classList.add("elevation-demo__tile--flat");
    tile.append(el("span", "text-body-medium-strong", level.name));
    tiles.append(tile);
  }
  row.append(tiles);
  return row;
}

export function renderElevation(body: HTMLElement) {
  const levels = section("Levels", "From the page up. Each level is the same shape in both themes; only its strength changes.");
  levels.append(
    staticPreview([levelRow("light"), levelRow("dark")]),
    table(
      "Elevation levels",
      ["Level", "Use for", "Token"],
      LEVELS.map((l) => [l.name, l.use, l.token ? code(l.token) : fragment("None — ", code("--color-border-default"))]),
    ),
  );

  const built = section("How it's built", "Every level stacks the same parts, so they stay consistent and soft.");
  built.append(
    ruleList([
      "Smooth shadow: three or four layers whose offset and blur double each step while their opacity stays low, so the shadow fades out softly instead of ending in one hard blur.",
      "Edge: a 1px ring around the layer. Where the shadow can't show — a dark layer on a dark page — the edge still outlines it.",
      "Highlight (dark only): a faint 1px line along the top inside, as if lit from above. In light mode the shadow does that job.",
      "Tint (dark only): the surface gets 2% lighter per level — raised, floating, overlay — because shadows barely show on a near-black page. It's drawn inside the shadow, so the layer keeps --color-bg-default.",
      "Theme strength: dark mode multiplies the shadow's opacity by 3 and swaps the dark edge for a light one. Light mode stays barely there: a raised card peaks at 3% black.",
    ]),
  );

  const usage = section("Using it");
  usage.append(
    ruleList([
      "Pick the level by what the layer does, not how much shadow you'd like: a menu is floating whether it's small or large.",
      "Use one level per layer, on a surface with --color-bg-default. Don't stack shadows or add your own.",
      "The edge outlines the layer, so a floating or overlay layer doesn't need its own border.",
      "Changing level (a card lifting on hover) is a paint-heavy shadow change: fade in a pseudo-element carrying the higher level with opacity instead, under 200ms, inside @media (hover: hover) and (pointer: fine).",
      "Dark mode needs nothing extra: the levels follow [data-theme], including a nested one.",
    ]),
    codeBlock(`.menu--floating {
  background: var(--color-bg-default);
  border-radius: var(--radius-l);
  box-shadow: var(--elevation-floating);
}`),
  );

  body.append(levels, built, usage, agentLinks([]));
}
