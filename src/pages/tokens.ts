import variables from "../../tokens/figma-variables.json";
import { PRIMITIVE_PREFIX, SEMANTIC_PREFIX, semanticName } from "../../scripts/token-names.mjs";
import { copyToClipboard, createStatusRegion, flashLabel } from "../lib/copy";
import "../styles/pages/tokens.css";

type Mode = "light" | "dark";
const MODES: Mode[] = ["light", "dark"];

interface ModeValue {
  /** Primitive path without the 🎨/ prefix, e.g. "red/600". */
  alias: string;
  hex: string;
}

interface Token {
  path: string; // "bg/danger/hover"
  category: string; // "bg"
  group: string; // "danger"
  variant: string; // "hover"
  cssVar: string; // "--color-bg-danger-hover"
  values: Record<Mode, ModeValue>;
}

const CATEGORY_LABELS: Record<string, string> = {
  bg: "Background",
  text: "Text",
  icon: "Icon",
  border: "Border",
};

const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** category → group → tokens, in Figma order. */
function readTokens(): Map<string, Map<string, Token[]>> {
  const { modes, vars } = variables.Colors as { modes: string[]; vars: Record<string, unknown[]> };
  const index: Record<Mode, number> = { light: modes.indexOf("Light"), dark: modes.indexOf("Dark") };

  const resolve = (name: string, mode: Mode): ModeValue => {
    const raw = vars[name][index[mode]] as { alias?: string } | string;
    if (typeof raw === "object" && raw.alias) {
      const target = resolve(raw.alias, mode);
      return { alias: raw.alias.replace(PRIMITIVE_PREFIX, ""), hex: target.hex };
    }
    return { alias: name.replace(PRIMITIVE_PREFIX, ""), hex: String(raw) };
  };

  const tree = new Map<string, Map<string, Token[]>>();
  for (const name of Object.keys(vars)) {
    if (!name.startsWith(SEMANTIC_PREFIX)) continue;
    const path = name.slice(SEMANTIC_PREFIX.length);
    const [category, group, variant] = path.split("/");
    if (!tree.has(category)) tree.set(category, new Map());
    const groups = tree.get(category)!;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push({
      path,
      category,
      group,
      variant,
      cssVar: semanticName(name),
      values: { light: resolve(name, "light"), dark: resolve(name, "dark") },
    });
  }
  return tree;
}

/**
 * Text and icon tokens are previewed on the surface they're meant for:
 * "inverse" on the inverse background, "on<group>" on that group's fill.
 */
function surfaceFor(token: Token): string | null {
  if (token.category !== "text" && token.category !== "icon") return null;
  if (token.variant.startsWith("inverse")) return "var(--color-bg-inverse)";
  if (token.variant.startsWith("on")) return `var(--color-bg-${token.group})`;
  return null;
}

const ICON_GLYPH = `<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 0.5 8.7 5.3 13.5 7 8.7 8.7 7 13.5 5.3 8.7 0.5 7 5.3 5.3Z" fill="currentColor"/></svg>`;

function preview(token: Token, mode: Mode): HTMLElement {
  const tile = el("span", "token-preview");
  tile.dataset.theme = mode;
  tile.dataset.kind = token.category;
  tile.style.setProperty("--token", `var(${token.cssVar})`);
  const surface = surfaceFor(token);
  if (surface) tile.style.setProperty("--surface", surface);
  if (token.category === "text") tile.textContent = "Aa";
  if (token.category === "icon") tile.innerHTML = ICON_GLYPH;
  return tile;
}

export function renderTokens(body: HTMLElement) {
  const tree = readTokens();
  const status = createStatusRegion();
  const container = el("div", "tokens");

  for (const [category, groups] of tree) {
    const section = el("section", "token-category");
    const heading = el("h2", "token-category__title text-heading-medium", CATEGORY_LABELS[category] ?? capitalize(category));
    heading.id = `tokens-${category}`;
    section.setAttribute("aria-labelledby", heading.id);

    const head = el("div", "token-grid token-head text-body-medium");
    head.setAttribute("aria-hidden", "true");
    head.append(el("span", "", "Token"), el("span", "", "Light"), el("span", "", "Dark"));

    section.append(heading, head);

    for (const [group, tokens] of groups) {
      section.append(el("h3", "token-group__title text-body-medium-strong", capitalize(group)));
      const list = el("ul", "token-list");

      for (const token of tokens) {
        const item = el("li");
        const row = el("button", "token-grid token-row");
        row.type = "button";
        row.title = `Copy var(${token.cssVar})`;
        row.setAttribute(
          "aria-label",
          `${token.path}: light ${token.values.light.alias}, dark ${token.values.dark.alias}. Copy var(${token.cssVar})`,
        );

        const name = el("span", "token-row__name");
        const varLabel = el("span", "token-row__var", token.cssVar);
        name.append(el("span", "token-row__path text-body-large", token.path), varLabel);
        row.append(name);

        for (const mode of MODES) {
          const { alias, hex } = token.values[mode];
          const cell = el("span", "token-row__value");
          cell.title = `${alias} · ${hex}`;
          cell.append(preview(token, mode), el("span", "token-row__alias", alias));
          row.append(cell);
        }

        row.addEventListener("click", async () => {
          if (await copyToClipboard(`var(${token.cssVar})`, status)) flashLabel(varLabel, "Copied", token.cssVar);
        });

        item.append(row);
        list.append(item);
      }
      section.append(list);
    }
    container.append(section);
  }

  body.append(container, status);
}
