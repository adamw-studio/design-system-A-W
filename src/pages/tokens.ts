/**
 * Semantic Tokens page — after Figma "Design System - Web", node 310:4035.
 *
 * One color card per category and group ("✦ /bg/danger", with a chip of the
 * group's default token), listing every token of the group on its own line:
 * a 60px sample, the variant, and the primitive it points to in the current
 * theme (left out of a line too narrow for both; it's in the tooltip). The samples stack into one column, so a card reads as the group's
 * strip of colors with the names in line beside it. The sample follows the
 * token's category:
 * - bg: filled with it;
 * - text: "Aa" in it, icon: an icon in it, on the fill it's meant for ("on…"
 *   variants on the group's fill, inverse on the inverse fill);
 * - border: outlined with it.
 *
 * Click a line to copy the token's CSS variable. The full description and
 * both modes' values are in each line's tooltip and accessible name.
 *
 * Tokens and values come from tokens/figma-variables.json via the shared
 * colorTokens() (as in colors.json / llms.txt) and the generated CSS.
 */
import variables from "../../tokens/figma-variables.json";
import colorRules from "../../tokens/color-rules.json";
import { colorTokens } from "../../scripts/colors.mjs";
import { SEMANTIC_PREFIX } from "../../scripts/token-names.mjs";
import { copyToClipboard, createStatusRegion, flashLabel } from "../lib/copy";
import { icon } from "../lib/icon";
import { agentLinks, COLOR_TOKENS_FILE } from "../lib/agent-links";
import { el } from "../lib/docs";
import "../styles/pages/tokens.css";

export const tokensIntro =
  "Semantic color tokens give each primitive a purpose, with a value for light and dark mode. Use these in components. Click a token to copy its CSS variable.";

type Mode = "light" | "dark";

interface Token {
  category: string; // "bg"
  group: string; // "danger"
  variant: string; // "secondary"
  cssVar: string; // "--color-bg-danger-secondary"
  description: string; // when to use it (tokens/color-rules.json)
  aliases: Record<Mode, string>; // "red/700"
  values: Record<Mode, string>; // hex
}

/** Card order: categories as in Figma's collection, groups as below. */
const CATEGORIES = ["bg", "text", "icon", "border"];
const GROUPS = ["default", "danger", "warning", "success", "disabled"];
/** Lines after default, as in Figma; then the rest in Figma's order, with
 * the "on…" variants (for text on a colored fill) last. */
const LEADING = ["default", "hover", "pressed"];
const SAMPLE_ICON = "bell";

function readGroups(): Map<string, Token[]> {
  const groups = new Map<string, Token[]>();
  for (const t of colorTokens(variables, colorRules).semantic) {
    const key = `${t.category}/${t.group}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({
      category: t.category,
      group: t.group,
      variant: t.variant,
      cssVar: t.cssVariable,
      description: t.description,
      aliases: { light: t.aliases.light ?? t.values.light, dark: t.aliases.dark ?? t.values.dark },
      values: t.values,
    });
  }
  const rank = (key: string) => {
    const [c, g] = key.split("/");
    const ci = CATEGORIES.indexOf(c);
    const gi = GROUPS.indexOf(g);
    return (ci < 0 ? CATEGORIES.length : ci) * 100 + (gi < 0 ? GROUPS.length : gi);
  };
  return new Map([...groups].sort(([a], [b]) => rank(a) - rank(b)));
}

function ordered(tokens: Token[]): Token[] {
  return [
    ...LEADING.flatMap((v) => tokens.filter((t) => t.variant === v)),
    ...tokens.filter((t) => !LEADING.includes(t.variant) && !t.variant.startsWith("on")),
    ...tokens.filter((t) => t.variant.startsWith("on")),
  ];
}

const currentMode = (): Mode => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

/** The fill a text / icon token is meant to sit on, if not the page. */
function groundOf(t: Token) {
  if (t.variant.startsWith("on")) return `var(--color-bg-${t.group})`;
  if (t.variant.startsWith("inverse")) return "var(--color-bg-inverse)";
  return null;
}

function tokenLine(t: Token, status: HTMLElement) {
  const line = el("button", "token-line text-body-large");
  line.type = "button";
  line.style.setProperty("--token", `var(${t.cssVar})`);
  const ground = groundOf(t);
  if (ground && (t.category === "text" || t.category === "icon")) line.style.setProperty("--ground", ground);
  const { light, dark } = t.aliases;
  line.title = `var(${t.cssVar})\n${t.description}\nLight: ${light} · ${t.values.light}\nDark: ${dark} · ${t.values.dark}`;
  line.setAttribute(
    "aria-label",
    `${t.category} ${t.group} ${t.variant}: ${t.description} Light ${light}, dark ${dark}. Copy var(${t.cssVar})`,
  );

  const sample = el("span", "token-line__sample");
  if (t.category === "text") sample.append(el("span", "token-line__aa text-body-large-strong", "Aa"));
  if (t.category === "icon") sample.append(icon(SAMPLE_ICON, 16));
  const nameText = t.variant === "default" ? "default" : `-${t.variant}`;
  const name = el("span", "token-line__name", nameText);
  const alias = el("span", "token-line__alias");
  const text = el("span", "token-line__text");
  text.append(name, alias);
  line.append(sample, text);

  const showAlias = () => {
    alias.textContent = t.aliases[currentMode()];
  };
  // "Copied" flashes in the name, which is always shown (the alias may not be).
  line.addEventListener("click", async () => {
    if (await copyToClipboard(`var(${t.cssVar})`, status)) flashLabel(name, "Copied", nameText);
  });
  return { line, refresh: showAlias };
}

function tokenCard(key: string, tokens: Token[], status: HTMLElement) {
  const [category, group] = key.split("/");
  const base = tokens.find((t) => t.variant === "default") ?? tokens[0];

  const card = el("section", "color-card token-card");
  card.dataset.category = category;
  const nameId = `tokens-${category}-${group}`;
  card.setAttribute("aria-labelledby", nameId);

  const header = el("div", "color-card__header text-body-large");
  const heading = el("h2", "color-card__name");
  heading.id = nameId;
  heading.setAttribute("aria-label", `${category} ${group}`);
  heading.append(el("span", "color-card__emoji", SEMANTIC_PREFIX.replace("/", "")), ` /${category}/${group}`);
  const chip = el("span", "color-card__chip");
  chip.style.setProperty("--chip", `var(${base.cssVar})`);
  header.append(heading, chip);

  const body = el("div", "color-card__body token-lines");
  const lines = ordered(tokens).map((t) => tokenLine(t, status));
  body.append(...lines.map((l) => l.line));

  card.append(header, body);
  return { card, refresh: () => lines.forEach((l) => l.refresh()) };
}

export function renderTokens(body: HTMLElement) {
  const list = el("div", "color-cards token-cards");
  const status = createStatusRegion();
  const cards = [...readGroups()].map(([key, tokens]) => tokenCard(key, tokens, status));
  list.append(...cards.map((c) => c.card));
  body.append(list, agentLinks([COLOR_TOKENS_FILE]), status);

  // Each line names the primitive its token points to in the current theme.
  const refresh = () => cards.forEach((c) => c.refresh());
  refresh();
  const observer = new MutationObserver(() => {
    if (!list.isConnected) return observer.disconnect();
    refresh();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}
