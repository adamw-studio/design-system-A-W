/**
 * Grid page — listed under Foundation in the sidebar (Figma "Design System
 * - Web", node 302:2196). Documents the page layout (Figma layout frame
 * 281:279, the --layout-* constants), the rhythm between blocks, and the
 * spacing and radius tokens. Values are read live from the CSS, so the page
 * can't drift from the stylesheet (the sidebar row follows a resize too).
 */
import { agentLinks } from "../lib/agent-links";
import { code, el, section, staticPreview, table } from "../lib/docs";
import "../styles/pages/grid.css";

export const gridIntro =
  "The layout every page sits on: a sidebar, a content panel, and one centered content column, spaced with the spacing scale and rounded with the radius scale.";

const SPACE = ["--space-0", "--space-1", "--space-2", "--space-3", "--space-4", "--space-5", "--space-6", "--space-7"];
const RADIUS = ["--radius-none", "--radius-small", "--radius-medium", "--radius-large", "--radius-full"];

const cssValue = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const gridSubtitle = () => `${SPACE.length} spacing steps · ${RADIUS.length} radii · ${cssValue("--layout-content-width")} column`;

function layoutSection() {
  const wrap = section("Page layout", "From the Figma layout frame. The content column is the same on every page, so margins always match.");
  const sidebar = `${cssValue("--layout-sidebar-width")} (drag between ${cssValue("--layout-sidebar-min")} and ${cssValue("--layout-sidebar-max")})`;
  wrap.append(
    table(
      "Page layout",
      ["Part", "Value", "Constant"],
      [
        ["Sidebar", sidebar, code("--layout-sidebar-width")],
        ["Gutter around the panel", cssValue("--layout-gutter"), code("--layout-gutter")],
        ["Panel corner radius", cssValue("--layout-radius-panel"), code("--layout-radius-panel")],
        ["Content column", `${cssValue("--layout-content-width")}, centered`, code("--layout-content-width")],
        ["Space above the title", cssValue("--layout-content-top"), code("--layout-content-top")],
        ["Narrow screens (≤ 768px)", "The sidebar stacks above the panel", "—"],
      ],
    ),
  );
  return wrap;
}

function rhythmSection() {
  const wrap = section("Rhythm", "The same gaps on every page, all from the spacing scale.");
  wrap.append(
    table(
      "Spacing between page parts",
      ["Between", "Space", "From"],
      [
        ["Page header and description", "28px", code("--space-5 + --space-2")],
        ["Blocks on a page", "56px", code("--space-7 + --space-4")],
        ["Parts of a section", "16px", code("--space-4")],
        ["Rows in the sidebar", "2px", code("--space-1")],
      ],
    ),
  );
  return wrap;
}

function spacingSection() {
  const wrap = section("Spacing", "Use these for every margin, padding and gap.");
  const bars = el("div", "grid-spacing");
  for (const name of SPACE) {
    const row = el("div", "grid-spacing__row");
    const bar = el("span", "grid-spacing__bar");
    bar.style.width = `var(${name})`;
    row.append(el("code", "grid-spacing__name", name), bar, el("span", "grid-spacing__value text-body-medium", cssValue(name)));
    bars.append(row);
  }
  wrap.append(staticPreview(bars));
  return wrap;
}

function radiusSection() {
  const wrap = section("Radius", "Corners for controls, cards and pills.");
  const row = el("div", "grid-radius");
  for (const name of RADIUS) {
    const item = el("div", "grid-radius__item");
    const shape = el("span", "grid-radius__shape");
    shape.style.borderRadius = `var(${name})`;
    item.append(shape, el("code", "grid-radius__name", name), el("span", "grid-radius__value text-body-medium", cssValue(name)));
    row.append(item);
  }
  wrap.append(staticPreview(row));
  return wrap;
}

export function renderGrid(body: HTMLElement) {
  body.append(layoutSection(), rhythmSection(), spacingSection(), radiusSection(), agentLinks([]));
}
