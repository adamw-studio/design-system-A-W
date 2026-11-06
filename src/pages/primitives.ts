import variables from "../../tokens/figma-variables.json";
import { primitiveName, PRIMITIVE_PREFIX as PREFIX } from "../../scripts/token-names.mjs";
import { copyToClipboard, createStatusRegion, flashLabel } from "../lib/copy";
import "../styles/pages/primitives.css";

type Mode = "light" | "dark";

interface Swatch {
  scale: string;
  step: string;
  cssVar: string;
  values: Record<Mode, string>;
}

/** Neutrals first, then the chromatic scales in their Figma order. */
const NEUTRALS = ["grey", "black", "white"];
/** Scales whose steps are opacities rather than solid colors. */
const ALPHA_SCALES: Record<string, "light" | "dark"> = { black: "light", white: "dark" };

function readSwatches(): Map<string, Swatch[]> {
  const { modes, vars } = variables.Colors as { modes: string[]; vars: Record<string, unknown[]> };
  const light = modes.indexOf("Light");
  const dark = modes.indexOf("Dark");

  const scales = new Map<string, Swatch[]>();
  for (const [name, vals] of Object.entries(vars)) {
    if (!name.startsWith(PREFIX)) continue;
    const [scale, step] = name.slice(PREFIX.length).split("/");
    if (!scales.has(scale)) scales.set(scale, []);
    scales.get(scale)!.push({
      scale,
      step,
      cssVar: primitiveName(name),
      values: { light: String(vals[light]), dark: String(vals[dark]) },
    });
  }

  const ordered = [...NEUTRALS.filter((s) => scales.has(s)), ...[...scales.keys()].filter((s) => !NEUTRALS.includes(s))];
  return new Map(ordered.map((s) => [s, scales.get(s)!]));
}

/**
 * "#0000004d" → "30%" for alpha scales, otherwise "F24822". The "#" is
 * dropped so the label fits the narrow swatch; the full value is in the
 * tooltip and accessible name.
 */
function formatValue(hex: string, isAlpha: boolean): string {
  if (isAlpha) {
    const alpha = hex.length === 9 ? parseInt(hex.slice(7), 16) / 255 : 1;
    return `${Math.round(alpha * 100)}%`;
  }
  return hex.slice(1).toUpperCase();
}

const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function renderPrimitives(body: HTMLElement, actions: HTMLElement) {
  const scales = readSwatches();
  let mode: Mode = "light";

  // --- Light / Dark switch (page header) ---------------------------------
  const switcher = el("div", "segmented");
  switcher.setAttribute("role", "group");
  switcher.setAttribute("aria-label", "Color mode");
  const modeButtons = (["light", "dark"] as Mode[]).map((m) => {
    const btn = el("button", "segmented__option text-body-large", capitalize(m));
    btn.type = "button";
    btn.dataset.mode = m;
    btn.addEventListener("click", () => setMode(m));
    switcher.append(btn);
    return btn;
  });
  actions.append(switcher);

  // --- Palette card -------------------------------------------------------
  const palette = el("div", "palette");
  const status = createStatusRegion();

  const valueLabels: { swatch: Swatch; isAlpha: boolean; value: HTMLElement; button: HTMLButtonElement }[] = [];

  for (const [scale, swatches] of scales) {
    const isAlpha = scale in ALPHA_SCALES;
    const section = el("section", "scale");
    if (isAlpha) section.dataset.backdrop = ALPHA_SCALES[scale];

    const header = el("header", "scale__header");
    const title = el("h2", "scale__name text-heading-small", capitalize(scale));
    title.id = `scale-${scale}`;
    header.append(title);
    if (isAlpha) header.append(el("span", "scale__note text-body-medium", "Transparent"));
    section.setAttribute("aria-labelledby", title.id);

    const list = el("ol", "scale__swatches");
    for (const swatch of swatches) {
      const item = el("li");
      const button = el("button", "swatch");
      button.type = "button";
      button.style.setProperty("--swatch", `var(${swatch.cssVar})`);

      const chip = el("span", "swatch__chip");
      const step = el("span", "swatch__step text-body-medium", swatch.step);
      const value = el("span", "swatch__value");

      button.append(chip, step, value);
      button.addEventListener("click", () => copy(swatch, step));
      item.append(button);
      list.append(item);
      valueLabels.push({ swatch, isAlpha, value, button });
    }

    section.append(header, list);
    palette.append(section);
  }

  body.append(palette, status);

  // --- Behaviour ----------------------------------------------------------
  function setMode(next: Mode) {
    mode = next;
    palette.dataset.theme = mode;
    modeButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
    for (const { swatch, isAlpha, value, button } of valueLabels) {
      const hex = swatch.values[mode];
      value.textContent = formatValue(hex, isAlpha);
      button.title = `${swatch.scale}/${swatch.step} · ${hex}`;
      button.setAttribute("aria-label", `${swatch.scale} ${swatch.step}, ${hex}. Copy var(${swatch.cssVar})`);
    }
  }

  async function copy(swatch: Swatch, stepLabel: HTMLElement) {
    if (await copyToClipboard(`var(${swatch.cssVar})`, status)) flashLabel(stepLabel, "Copied", swatch.step);
  }

  setMode(mode);
}
