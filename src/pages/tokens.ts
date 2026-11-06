/**
 * Semantic Tokens page — layout from Figma "Design System - Web",
 * node 289:1313: one row per token with a tap icon, the token name
 * (category prefix + name) and two swatches, Dark then Light.
 *
 * Tokens and values come from tokens/figma-variables.json via the
 * generated CSS variables.
 */
import variables from "../../tokens/figma-variables.json";
import { PRIMITIVE_PREFIX, SEMANTIC_PREFIX, semanticName } from "../../scripts/token-names.mjs";
import { copyToClipboard, createStatusRegion } from "../lib/copy";
import "../styles/pages/tokens.css";

type Mode = "light" | "dark";
/** Figma shows the Dark value first, then Light. */
const SWATCH_MODES: Mode[] = ["dark", "light"];

interface ModeValue {
  alias: string; // "black/800"
  hex: string;
}

interface Token {
  cssVar: string; // "--color-icon-secondary"
  prefix: string; // "icon-"
  name: string; // "secondary"
  values: Record<Mode, ModeValue>;
}

function readTokens(): Token[] {
  const { modes, vars } = variables.Colors as { modes: string[]; vars: Record<string, unknown[]> };
  const index: Record<Mode, number> = { light: modes.indexOf("Light"), dark: modes.indexOf("Dark") };

  const resolve = (name: string, mode: Mode): ModeValue => {
    const raw = vars[name][index[mode]] as { alias?: string } | string;
    if (typeof raw === "object" && raw.alias) {
      return { alias: raw.alias.replace(PRIMITIVE_PREFIX, ""), hex: resolve(raw.alias, mode).hex };
    }
    return { alias: name.replace(PRIMITIVE_PREFIX, ""), hex: String(raw) };
  };

  return Object.keys(vars)
    .filter((name) => name.startsWith(SEMANTIC_PREFIX))
    .map((name) => {
      const cssVar = semanticName(name);
      const short = cssVar.replace("--color-", ""); // "icon-secondary"
      const dash = short.indexOf("-");
      return {
        cssVar,
        prefix: short.slice(0, dash + 1),
        name: short.slice(dash + 1),
        values: { light: resolve(name, "light"), dark: resolve(name, "dark") },
      };
    });
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);

export function renderTokens(body: HTMLElement) {
  const list = el("ul", "token-list");
  const status = createStatusRegion();
  const timers = new WeakMap<HTMLElement, number>();

  for (const token of readTokens()) {
    const item = el("li");
    const row = el("button", "token-row");
    row.type = "button";
    const { light, dark } = token.values;
    row.title = `var(${token.cssVar})\nDark: ${dark.alias} · ${dark.hex}\nLight: ${light.alias} · ${light.hex}`;
    row.setAttribute(
      "aria-label",
      `${token.prefix}${token.name}: dark ${dark.alias}, light ${light.alias}. Copy var(${token.cssVar})`,
    );

    const lead = el("span", "token-row__lead");
    const icon = el("img", "token-row__icon");
    icon.src = "/icons/single-tap-gesture.svg";
    icon.width = 16;
    icon.height = 16;
    icon.alt = "";
    const name = el("span", "token-row__name text-body-large");
    name.append(el("span", "token-row__prefix", token.prefix), el("span", "token-row__rest", token.name));
    const copied = el("span", "token-row__copied text-body-large", "Copied");
    lead.append(icon, name, copied);

    const swatches = el("span", "token-row__swatches");
    for (const mode of SWATCH_MODES) {
      const swatch = el("span", "token-swatch");
      // Each swatch resolves the variable in its own mode, drawn over that
      // mode's background so light-on-dark values stay visible.
      swatch.dataset.theme = mode;
      swatch.style.setProperty("--token", `var(${token.cssVar})`);
      swatch.title = `${capitalize(mode)}: ${token.values[mode].alias} · ${token.values[mode].hex}`;
      swatches.append(swatch);
    }

    row.append(lead, swatches);
    row.addEventListener("click", async () => {
      if (!(await copyToClipboard(`var(${token.cssVar})`, status))) return;
      row.classList.add("is-copied");
      window.clearTimeout(timers.get(row));
      timers.set(row, window.setTimeout(() => row.classList.remove("is-copied"), 1200));
    });

    item.append(row);
    list.append(item);
  }

  body.append(list, status);
}
