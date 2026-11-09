/**
 * Color Primitives page — Figma "Design System - Web", node 310:3840.
 *
 * Two columns of cards, one per family: a header row with the family's
 * Figma name ("🎨 /grey") and a chip of its 500 shade, then a strip of its
 * ten shades in which the current shade is a 60px square. The first shade
 * (100) is current to start with, as in Figma.
 *
 * Interactive:
 * - hover (or focus) a shade to preview it: the header shows its step and
 *   HEX, and the chip takes its color;
 * - click a shade to make it current (it widens) and copy its CSS variable;
 * - keyboard: one Tab stop per family; Arrow Left/Right, Home/End move
 *   between shades.
 * Widening follows clicks and keys, not hover: a strip that reflowed under
 * the pointer would keep putting a different shade beneath it.
 *
 * Colors come from tokens/figma-variables.json via the generated CSS
 * variables. Some primitives have dark-mode values, so HEX is read from the
 * rendered color and re-read when the theme changes.
 */
import variables from "../../tokens/figma-variables.json";
import { primitiveName, PRIMITIVE_PREFIX } from "../../scripts/token-names.mjs";
import { cancelFlash, copyToClipboard, createStatusRegion, flashLabel } from "../lib/copy";
import { agentLinks, COLOR_TOKENS_FILE } from "../lib/agent-links";
import { el } from "../lib/docs";
import "../styles/pages/primitives.css";

export const primitivesIntro =
  "The raw color palette. Components should use semantic tokens, which point to these values. Click a swatch to copy its CSS variable.";

interface Shade {
  family: string;
  step: string;
  cssVar: string;
}

/**
 * Card order, as in Figma (black, which the frame leaves out, sits with the
 * other neutral). Any family missing from this list is appended, so new
 * primitives added in Figma still appear after re-exporting.
 */
const ORDER = ["grey", "white", "black", "yellow", "orange", "green", "red"];

/** The shade the header chip shows at rest. */
const CHIP_STEP = "500";

function readFamilies(): Map<string, Shade[]> {
  const { vars } = variables.Colors as { vars: Record<string, unknown[]> };
  const families = new Map<string, Shade[]>();
  for (const name of Object.keys(vars)) {
    if (!name.startsWith(PRIMITIVE_PREFIX)) continue;
    const [family, step] = name.slice(PRIMITIVE_PREFIX.length).split("/");
    if (!families.has(family)) families.set(family, []);
    families.get(family)!.push({ family, step, cssVar: primitiveName(name) });
  }
  const ordered = [...ORDER.filter((f) => families.has(f)), ...[...families.keys()].filter((f) => !ORDER.includes(f))];
  return new Map(ordered.map((f) => [f, families.get(f)!]));
}

const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);

/** "rgb(255 205 41 / 0.4)" etc. → "FFCD29", plus " 40%" if translucent. */
function formatHex(css: string) {
  const m = css.match(/rgba?\(([^)]+)\)/);
  const [r = 0, g = 0, b = 0, a = 1] = (m ? m[1].split(/[\s,/]+/).filter(Boolean) : []).map(Number);
  const hex2 = (n: number) => Math.round(n).toString(16).padStart(2, "0").toUpperCase();
  return `${hex2(r)}${hex2(g)}${hex2(b)}${a < 1 ? ` ${Math.round(a * 100)}%` : ""}`;
}

function paletteCard(family: string, shades: Shade[], status: HTMLElement) {
  const name = capitalize(family);
  const card = el("section", "color-card palette");
  card.dataset.family = family;
  const nameId = `palette-${family}`;
  card.setAttribute("aria-labelledby", nameId);

  const header = el("div", "color-card__header text-body-large");
  const heading = el("h2", "color-card__name");
  heading.id = nameId;
  heading.setAttribute("aria-label", name);
  heading.append(el("span", "color-card__emoji", PRIMITIVE_PREFIX.replace("/", "")), ` /${family}`);
  const info = el("span", "color-card__info");
  const value = el("span", "color-card__value");
  value.setAttribute("aria-hidden", "true"); // the swatch labels carry it
  const chip = el("span", "color-card__chip");
  const chipShade = shades.find((s) => s.step === CHIP_STEP) ?? shades[Math.floor(shades.length / 2)];
  const restChip = `var(${chipShade.cssVar})`;
  chip.style.setProperty("--chip", restChip);
  info.append(value, chip);
  header.append(heading, info);

  const body = el("div", "color-card__body");
  const strip = el("div", "palette__strip");
  strip.setAttribute("role", "group");
  strip.setAttribute("aria-label", `${name} shades`);
  body.append(strip);

  const swatches: HTMLButtonElement[] = [];
  const hexes: string[] = [];
  let current = 0;

  /** Preview one shade in the header; null goes back to rest. */
  function preview(index: number | null) {
    cancelFlash(value);
    if (index === null) {
      value.textContent = "";
      chip.style.setProperty("--chip", restChip);
      return;
    }
    value.textContent = `${shades[index].step} · ${hexes[index]}`;
    chip.style.setProperty("--chip", `var(${shades[index].cssVar})`);
  }

  /** Make a shade current: it widens and becomes the family's Tab stop. */
  function choose(index: number, focus = false) {
    current = index;
    swatches.forEach((s, i) => {
      s.tabIndex = i === index ? 0 : -1;
      s.setAttribute("aria-pressed", String(i === index));
    });
    if (focus) swatches[index].focus();
  }

  shades.forEach((shade, i) => {
    const swatch = el("button", "palette__swatch");
    swatch.type = "button";
    swatch.style.setProperty("--swatch", `var(${shade.cssVar})`);
    swatch.addEventListener("pointerenter", () => preview(i));
    swatch.addEventListener("focus", () => {
      choose(i);
      preview(i);
    });
    swatch.addEventListener("click", async () => {
      choose(i);
      preview(i);
      if (await copyToClipboard(`var(${shade.cssVar})`, status)) {
        flashLabel(value, "Copied", `${shade.step} · ${hexes[i]}`);
      }
    });
    swatches.push(swatch);
    strip.append(swatch);
  });

  // Leaving the strip goes back to the focused shade, or to rest.
  strip.addEventListener("pointerleave", () => preview(strip.contains(document.activeElement) ? current : null));
  strip.addEventListener("focusout", (event) => {
    if (!strip.contains(event.relatedTarget as Node | null)) preview(null);
  });

  // One Tab stop per family; arrows move between shades.
  strip.addEventListener("keydown", (event) => {
    const next: Record<string, number> = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: shades.length - 1 };
    if (!(event.key in next)) return;
    event.preventDefault();
    choose(Math.min(shades.length - 1, Math.max(0, next[event.key])), true);
  });

  /** Read each shade's rendered HEX (needs the card in the page). */
  function readHexes() {
    swatches.forEach((swatch, i) => {
      hexes[i] = formatHex(getComputedStyle(swatch).backgroundColor);
      swatch.setAttribute("aria-label", `${name} ${shades[i].step}, ${hexes[i]}. Copy var(${shades[i].cssVar})`);
    });
  }

  card.append(header, body);
  return {
    card,
    init() {
      readHexes();
      choose(current);
    },
    refresh() {
      readHexes();
      if (value.textContent) preview(strip.contains(document.activeElement) ? current : null);
    },
  };
}

export function renderPrimitives(body: HTMLElement) {
  const list = el("div", "color-cards");
  const status = createStatusRegion();
  const cards = [...readFamilies()].map(([family, shades]) => paletteCard(family, shades, status));
  list.append(...cards.map((c) => c.card));
  body.append(list, agentLinks([COLOR_TOKENS_FILE]), status);
  cards.forEach((c) => c.init());

  const observer = new MutationObserver(() => {
    if (!list.isConnected) return observer.disconnect();
    requestAnimationFrame(() => cards.forEach((c) => c.refresh()));
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}
