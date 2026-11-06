/**
 * Color Primitives page — layout from Figma "Design System - Web",
 * node 289:1053: one row per family, name on the left and the ten shades
 * as a flush strip of 20px swatches on the right.
 *
 * Colors come from tokens/figma-variables.json (the Foundation – UI 2
 * export) via the generated CSS variables — never hard-coded here.
 */
import variables from "../../tokens/figma-variables.json";
import { primitiveName, PRIMITIVE_PREFIX } from "../../scripts/token-names.mjs";
import { copyToClipboard, createStatusRegion, flashLabel } from "../lib/copy";
import "../styles/pages/primitives.css";

interface Shade {
  family: string;
  step: string;
  cssVar: string;
  hex: string;
}

/**
 * Row order follows the Figma layout (white, black, yellow, green, red);
 * families it doesn't show are placed next to their closest neighbour.
 * Any family missing from this list is appended, so new primitives added
 * in Figma still appear after re-exporting.
 */
const ORDER = ["white", "black", "grey", "yellow", "orange", "green", "red"];

function readFamilies(): Map<string, Shade[]> {
  const { modes, vars } = variables.Colors as { modes: string[]; vars: Record<string, unknown[]> };
  const light = modes.indexOf("Light");

  const families = new Map<string, Shade[]>();
  for (const [name, values] of Object.entries(vars)) {
    if (!name.startsWith(PRIMITIVE_PREFIX)) continue;
    const [family, step] = name.slice(PRIMITIVE_PREFIX.length).split("/");
    if (!families.has(family)) families.set(family, []);
    families.get(family)!.push({ family, step, cssVar: primitiveName(name), hex: String(values[light]) });
  }

  const ordered = [...ORDER.filter((f) => families.has(f)), ...[...families.keys()].filter((f) => !ORDER.includes(f))];
  return new Map(ordered.map((f) => [f, families.get(f)!]));
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function renderPrimitives(body: HTMLElement) {
  const list = el("div", "primitive-list");
  const status = createStatusRegion();

  for (const [family, shades] of readFamilies()) {
    const row = el("section", "primitive-row");
    row.dataset.family = family;
    const label = el("h2", "primitive-row__name text-body-large", family);
    label.id = `primitive-${family}`;
    row.setAttribute("aria-labelledby", label.id);

    const swatches = el("ol", "primitive-row__swatches");
    for (const shade of shades) {
      const item = el("li");
      const swatch = el("button", "primitive-swatch");
      swatch.type = "button";
      swatch.style.setProperty("--swatch", `var(${shade.cssVar})`);
      swatch.title = `${shade.family}/${shade.step} · ${shade.hex}`;
      swatch.setAttribute("aria-label", `${shade.family} ${shade.step}, ${shade.hex}. Copy var(${shade.cssVar})`);
      swatch.addEventListener("click", async () => {
        if (await copyToClipboard(`var(${shade.cssVar})`, status)) {
          flashLabel(label, `Copied var(${shade.cssVar})`, family);
        }
      });
      item.append(swatch);
      swatches.append(item);
    }

    row.append(label, swatches);
    list.append(row);
  }

  body.append(list, status);
}
