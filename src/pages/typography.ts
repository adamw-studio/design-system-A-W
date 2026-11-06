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
import { copyToClipboard, createStatusRegion } from "../lib/copy";
import "../styles/pages/typography.css";

export const typographyIntro = rules.intro;

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

  let timer = 0;
  card.addEventListener("click", async () => {
    if (!(await copyToClipboard(style.className, status))) return;
    cls.textContent = `Copied ${style.className}`;
    cls.classList.add("is-copied");
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      cls.textContent = `.${style.className}`;
      cls.classList.remove("is-copied");
    }, 1200);
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
    const heading = el("h2", "type-style__name", style);
    heading.id = `${section.id}-title`;
    section.setAttribute("aria-labelledby", heading.id);

    const specimens = el("div", "type-style__specimens");
    specimens.append(...variants.map((v) => specimen(v, status)));

    section.append(heading, el("p", "type-style__usage", variants[0].usage), specimens);
    list.append(section);
  }

  const agents = el("p", "type-agents text-body-medium");
  agents.append(
    "For AI agents and tools: ",
    Object.assign(el("a", "", "typography.json"), { href: "/tokens/typography.json" }),
    " (design tokens with usage rules) · ",
    Object.assign(el("a", "", "llms.txt"), { href: "/llms.txt" }),
  );

  body.append(list, agents, status);
}
