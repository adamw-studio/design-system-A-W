/**
 * Typography page — layout from Figma "Foundation – UI 2", node 6:182,
 * adapted to the site's content column: each text style shows its name and
 * usage rule, then a specimen card on a grid (regular + strong side by side
 * for body styles).
 *
 * Styles and rules come from scripts/typography.mjs, the same source that
 * generates public/tokens/typography.json and public/llms.txt for AI agents.
 */
import variables from "../../tokens/figma-variables.json";
import rules from "../../tokens/typography-rules.json";
import { typographyStyles, type TypographyStyle } from "../../scripts/typography.mjs";
import { copyToClipboard, createStatusRegion, flashLabel } from "../lib/copy";
import { agentLinks, TYPOGRAPHY_TOKENS_FILE } from "../lib/agent-links";
import "../styles/pages/typography.css";

export const typographyIntro = rules.intro;

/** "7 styles · 10 classes" */
export function typographySubtitle() {
  const styles = typographyStyles(variables, rules);
  return `${new Set(styles.map((s) => s.style)).size} styles · ${styles.length} classes`;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** "24/32" */
const sizeLabel = (s: TypographyStyle) => `${s.values.fontSize}/${s.values.lineHeight}`;

function specimen(style: TypographyStyle, status: HTMLElement) {
  const wrap = el("figure", "type-specimen");
  wrap.dataset.typographyStyle = style.figmaStyle;
  if (style.sample) wrap.classList.add("type-specimen--display");

  const card = el("button", "type-specimen__card");
  card.type = "button";
  const sample = el("span", `type-specimen__sample ${style.className}`, style.sample ?? `${style.label} (${sizeLabel(style)})`);
  card.append(sample);
  card.setAttribute("aria-label", `${style.label}, ${sizeLabel(style)}, weight ${style.values.fontWeight}. Copy class ${style.className}`);

  // Compact spec line: the class to use and the resolved values.
  const meta = el("figcaption", "type-specimen__meta");
  const cls = el("code", "type-specimen__class", `.${style.className}`);
  const values = el(
    "span",
    "type-specimen__values",
    `${style.values.fontFamily} ${style.values.fontWeight} · ${sizeLabel(style)} · ${style.values.letterSpacingPercent}%`,
  );
  meta.append(cls, values);

  card.addEventListener("click", async () => {
    if (!(await copyToClipboard(style.className, status))) return;
    flashLabel(cls, `Copied ${style.className}`, `.${style.className}`);
  });

  wrap.append(card, meta);
  return wrap;
}

export function renderTypography(body: HTMLElement) {
  const styles = typographyStyles(variables, rules);
  const status = createStatusRegion();
  const list = el("div", "type-styles");

  // Group variants (regular / strong) under their Figma style.
  const groups = new Map<string, TypographyStyle[]>();
  for (const s of styles) {
    if (!groups.has(s.style)) groups.set(s.style, []);
    groups.get(s.style)!.push(s);
  }

  for (const [style, variants] of groups) {
    const section = el("section", "type-style");
    section.id = `type-${style.replace("/", "-")}`;
    const heading = el("h2", "type-style__name text-heading-medium", style);
    heading.id = `${section.id}-title`;
    section.setAttribute("aria-labelledby", heading.id);

    const specimens = el("div", "type-style__specimens");
    specimens.append(...variants.map((v) => specimen(v, status)));

    const divider = el("div", "doc-rule");
    divider.setAttribute("aria-hidden", "true");
    section.append(heading, divider, el("p", "type-style__usage text-body-large", variants[0].usage), specimens);
    list.append(section);
  }

  body.append(list, agentLinks([TYPOGRAPHY_TOKENS_FILE]), status);
}
