/**
 * Semantic Tokens page — layout from Figma "Design System - Web",
 * node 289:1313: one row per token with a tap icon, the token name
 * (category prefix + name) and two swatches, Dark then Light.
 *
 * Tokens and values come from tokens/figma-variables.json via the
 * generated CSS variables.
 */
import variables from "../../tokens/figma-variables.json";
import colorRules from "../../tokens/color-rules.json";
import { colorTokens } from "../../scripts/colors.mjs";
import { copyToClipboard, createStatusRegion } from "../lib/copy";
import { icon } from "../lib/icon";
import { agentLinks, COLOR_TOKENS_FILE } from "../lib/agent-links";
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
  description: string; // when to use it (tokens/color-rules.json)
  values: Record<Mode, ModeValue>;
}

/** Semantic tokens from the shared source used for colors.json / llms.txt. */
function readTokens(): Token[] {
  return colorTokens(variables, colorRules).semantic.map((t) => {
    const short = t.cssVariable.replace("--color-", ""); // "icon-secondary"
    const dash = short.indexOf("-");
    const value = (mode: Mode): ModeValue => ({ alias: t.aliases[mode] ?? t.values[mode], hex: t.values[mode] });
    return {
      cssVar: t.cssVariable,
      prefix: short.slice(0, dash + 1),
      name: short.slice(dash + 1),
      description: t.description,
      values: { light: value("light"), dark: value("dark") },
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
    row.title = `var(${token.cssVar})\n${token.description}\nDark: ${dark.alias} · ${dark.hex}\nLight: ${light.alias} · ${light.hex}`;
    row.setAttribute(
      "aria-label",
      `${token.prefix}${token.name}: ${token.description} Dark ${dark.alias}, light ${light.alias}. Copy var(${token.cssVar})`,
    );
    row.dataset.token = token.cssVar;

    const lead = el("span", "token-row__lead");
    const tapIcon = icon("single-tap-gesture", 16);
    tapIcon.classList.add("token-row__icon");
    const name = el("span", "token-row__name text-body-large");
    name.append(el("span", "token-row__prefix", token.prefix), el("span", "token-row__rest", token.name));
    const copied = el("span", "token-row__copied text-body-large", "Copied");
    lead.append(tapIcon, name, copied);

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

  body.append(list, agentLinks([COLOR_TOKENS_FILE]), status);
}
