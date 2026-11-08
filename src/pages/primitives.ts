/**
 * Color Primitives page — Figma "Design System - Web", node 305:2400.
 *
 * One block per family: a heading row (family name · current step), a tall
 * strip of its ten shades in which the current shade is widened, and the
 * current shade's HEX and RGB underneath (plus alpha for translucent
 * families). The first shade (100) is current to start with, as in Figma.
 *
 * Interactive:
 * - hover a shade to preview its step and values;
 * - click (or focus) a shade to make it current: it widens, and its CSS
 *   variable is copied;
 * - click the HEX / RGB values to copy them;
 * - keyboard: one Tab stop per family; Arrow Left/Right, Home/End move
 *   between shades.
 * Widening follows clicks and keys, not hover: a strip that reflowed under
 * the pointer would keep putting a different shade beneath it.
 *
 * Colors come from tokens/figma-variables.json via the generated CSS
 * variables; values are read from the rendered color, so they're right in
 * both themes.
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
 * Block order: neutrals first, then the hues. Any family missing from this
 * list is appended, so new primitives added in Figma still appear after
 * re-exporting.
 */
const ORDER = ["white", "black", "grey", "yellow", "orange", "green", "red"];

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

/** "rgb(255 205 41 / 0.4)" etc. → HEX, RGB and (if translucent) alpha. */
function formatValues(css: string) {
  const m = css.match(/rgba?\(([^)]+)\)/);
  const [r = 0, g = 0, b = 0, a = 1] = (m ? m[1].split(/[\s,/]+/).filter(Boolean) : []).map(Number);
  const hex2 = (n: number) => Math.round(n).toString(16).padStart(2, "0").toUpperCase();
  return {
    hex: `${hex2(r)}${hex2(g)}${hex2(b)}`,
    rgb: `${Math.round(r)} ${Math.round(g)} ${Math.round(b)}`,
    alpha: a < 1 ? `${Math.round(a * 100)}%` : null,
  };
}

/** A "KEY ··· value" row whose value copies on click. */
function valueRow(key: string, status: HTMLElement) {
  const row = el("button", "palette__row");
  row.type = "button";
  const val = el("span", "palette__val");
  row.append(el("span", "palette__key", key), val);
  let copyText = "";
  row.addEventListener("click", async () => {
    if (await copyToClipboard(copyText, status)) flashLabel(val, "Copied", val.textContent ?? "");
  });
  return {
    row,
    set(text: string, copy: string) {
      cancelFlash(val); // a newer value wins over a pending "Copied" restore
      val.textContent = text;
      copyText = copy;
      row.setAttribute("aria-label", `Copy ${key} ${text}`);
    },
  };
}

function paletteBlock(family: string, shades: Shade[], status: HTMLElement) {
  const name = capitalize(family);
  const block = el("section", "palette");
  block.dataset.family = family;
  const nameId = `palette-${family}`;
  block.setAttribute("aria-labelledby", nameId);

  const header = el("div", "palette__header text-body-large-strong");
  const heading = el("h2", "palette__name", name);
  heading.id = nameId;
  const stepEl = el("span", "palette__step");
  header.append(heading, stepEl);

  const strip = el("div", "palette__strip");
  strip.setAttribute("role", "group");
  strip.setAttribute("aria-label", `${name} shades`);

  const values = el("div", "palette__values text-body-large");
  const hex = valueRow("HEX", status);
  const rgb = valueRow("RGB", status);
  const alpha = valueRow("Alpha", status);
  values.append(hex.row, rgb.row, alpha.row);

  const swatches: HTMLButtonElement[] = [];
  let current = 0;

  /** Show one shade's step and values (hover preview or the current one). */
  function show(index: number) {
    const v = formatValues(getComputedStyle(swatches[index]).backgroundColor);
    cancelFlash(stepEl);
    stepEl.textContent = shades[index].step;
    hex.set(v.hex, `#${v.hex}`);
    rgb.set(v.rgb, `rgb(${v.rgb.replaceAll(" ", ", ")})`);
    alpha.row.hidden = !v.alpha;
    if (v.alpha) alpha.set(v.alpha, v.alpha);
  }

  /** Make a shade current: it widens and becomes the family's Tab stop. */
  function choose(index: number, focus = false) {
    current = index;
    swatches.forEach((s, i) => {
      s.tabIndex = i === index ? 0 : -1;
      s.setAttribute("aria-pressed", String(i === index));
    });
    if (focus) swatches[index].focus();
    show(index);
  }

  shades.forEach((shade, i) => {
    const swatch = el("button", "palette__swatch");
    swatch.type = "button";
    swatch.style.setProperty("--swatch", `var(${shade.cssVar})`);
    swatch.setAttribute("aria-label", `${name} ${shade.step}. Copy var(${shade.cssVar})`);
    swatch.addEventListener("pointerenter", () => show(i));
    swatch.addEventListener("focus", () => choose(i));
    swatch.addEventListener("click", async () => {
      choose(i);
      if (await copyToClipboard(`var(${shade.cssVar})`, status)) flashLabel(stepEl, "Copied", shade.step);
    });
    swatches.push(swatch);
    strip.append(swatch);
  });

  // Leaving the strip goes back to the current shade.
  strip.addEventListener("pointerleave", () => show(current));

  // One Tab stop per family; arrows move between shades.
  strip.addEventListener("keydown", (event) => {
    const next: Record<string, number> = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: shades.length - 1 };
    if (!(event.key in next)) return;
    event.preventDefault();
    choose(Math.min(shades.length - 1, Math.max(0, next[event.key])), true);
  });

  block.append(header, strip, values);
  return {
    block,
    init: () => choose(current),
    /** Values depend on the theme; re-read them after it changes. */
    refresh: () => show(current),
  };
}

export function renderPrimitives(body: HTMLElement) {
  const list = el("div", "palette-list");
  const status = createStatusRegion();
  const blocks = [...readFamilies()].map(([family, shades]) => paletteBlock(family, shades, status));
  list.append(...blocks.map((b) => b.block));
  body.append(list, agentLinks([COLOR_TOKENS_FILE]), status);

  // Reading rendered colors needs the blocks in the page.
  blocks.forEach((b) => b.init());
  const observer = new MutationObserver(() => {
    if (!list.isConnected) return observer.disconnect();
    requestAnimationFrame(() => blocks.forEach((b) => b.refresh()));
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}
