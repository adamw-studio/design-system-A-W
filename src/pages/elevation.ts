/**
 * Elevation page — listed under Foundation in the sidebar (Figma "Design
 * System - Web", node 302:2196). Figma has no elevation or shadow variables
 * yet, so this page documents only the three levels the site actually uses,
 * and says what's missing rather than inventing tokens.
 */
import { agentLinks } from "../lib/agent-links";
import { code, el, ruleList, section, staticPreview, table } from "../lib/docs";
import "../styles/pages/elevation.css";

export const elevationIntro =
  "Elevation tells layers apart: the page, the panels that sit on it, and things that float above. Figma has no elevation tokens yet, so these are the levels the site uses today.";
export const elevationSubtitle = "3 levels · no tokens yet";

function levelsPreview() {
  const ground = el("div", "elevation-demo__ground");
  ground.append(el("span", "elevation-demo__label text-body-medium", "Ground"));
  const surface = el("div", "elevation-demo__surface");
  surface.append(el("span", "elevation-demo__label text-body-medium", "Surface"));
  const floating = el("div", "elevation-demo__floating text-body-medium", "Floating");
  surface.append(floating);
  ground.append(surface);
  return staticPreview(ground);
}

export function renderElevation(body: HTMLElement) {
  const levels = section("Levels", "From the bottom up. Each level is set apart by color, then a border, then a shadow.");
  levels.append(
    levelsPreview(),
    table(
      "Elevation levels",
      ["Level", "Used for", "How"],
      [
        ["Ground", "The page and the sidebar", code("--color-bg-secondary")],
        ["Surface", "The content panel, cards, preview panels, menus at rest", [code("--color-bg-default"), " with a 1px ", code("--color-border-default")].reduce((frag, n) => (frag.append(n), frag), document.createDocumentFragment())],
        ["Floating", "Dropdown lists, submenus, the theme toggle", [code("--layout-shadow-floating"), " on a surface"].reduce((frag, n) => (frag.append(n), frag), document.createDocumentFragment())],
      ],
    ),
  );

  const missing = section("Not defined yet");
  missing.append(
    ruleList([
      "There are no shadow or elevation variables in Figma. The floating shadow is a site constant (--layout-shadow-floating in layout.css), built from black primitives because shadows stay black in both themes.",
      "There's no overlay level for modals, sheets or toasts — none of those components exist yet.",
      "When Figma gets elevation tokens, this page and the floating shadow should switch to them.",
    ]),
  );

  body.append(levels, missing, agentLinks([]));
}
