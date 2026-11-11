/**
 * Tags page — Figma "Foundation – UI 2", node 45:14: the intro, then a
 * bordered preview panel with the Tag set (45:81): strong tags on the left,
 * outlined (Strong=False) on the right, one variant per row. Below it, the
 * site adds per-variant usage, icon examples and usage rules.
 *
 * Component: src/styles/components/tag.css. Rules come from
 * tokens/tag-rules.json, which also feeds public/llms.txt.
 */
import rules from "../../tokens/tag-rules.json";
import { agentLinks } from "../lib/agent-links";
import { copyToClipboard, createStatusRegion, flashLabel } from "../lib/copy";
import { codeBlock, el, optionText, ruleList, section, stage } from "../lib/docs";
import { icon, iconMarkup } from "../lib/icon";
import "../styles/pages/tags.css";

export const tagsIntro = rules.intro;
type Variant = (typeof rules.variants)[number];

const classesFor = (variant: string, outline = false) => `tag tag--${variant}${outline ? " tag--outline" : ""}`;

function tag(variant: string, label: string, opts: { outline?: boolean; iconName?: string } = {}) {
  const node = el("span", classesFor(variant, opts.outline));
  if (opts.iconName) node.append(icon(opts.iconName));
  node.append(label);
  return node;
}

/** Figma frame "Light" (45:23): strong | outline, one row per variant.
    Each tag is a button here only so it can be clicked to copy. */
function preview(status: HTMLElement) {
  const panel = el("div", "doc-preview");
  const grid = el("div", "tag-preview");
  grid.setAttribute("role", "group");
  grid.setAttribute("aria-label", "Tag variants, strong and outlined");

  const hintText = "Click a tag to copy its classes.";
  const { stage: block, notes } = stage(panel, [
    hintText,
    "Left: strong (filled). Right: outline, with tag--outline.",
    "Every tag is 16px tall with 4px of padding at the sides.",
  ]);
  const hint = notes[0];

  for (const variant of rules.variants) {
    for (const outline of [false, true]) {
      const classes = classesFor(variant.variant, outline);
      const btn = el("button", "tag-preview__item");
      btn.type = "button";
      btn.setAttribute("aria-label", `${variant.label}${outline ? ", outline" : ""}. Copy classes ${classes}`);
      btn.append(tag(variant.variant, variant.label, { outline }));
      btn.addEventListener("click", async () => {
        if (await copyToClipboard(classes, status)) flashLabel(hint, `Copied class="${classes}"`, hintText);
      });
      grid.append(btn);
    }
  }

  panel.append(grid);
  return block;
}

function variantRow(variant: Variant) {
  const row = el("li", "doc-option");
  const sample = el("div", "doc-option__sample tag-sample");
  sample.append(tag(variant.variant, variant.label), tag(variant.variant, variant.label, { outline: true }));
  const text = optionText(variant.label, variant.usage, `.tag--${variant.variant}`);
  row.append(sample, text);
  return row;
}

function iconExamples() {
  const wrap = section("Icons", "Add an Icon Shell before the label. The tag sizes it to 12px and it takes the label's color.");
  const row = el("div", "tag-examples");
  row.append(
    tag("inverted", "New", { iconName: "sparks" }),
    tag("success", "Paid", { iconName: "check" }),
    tag("warning", "Pending", { iconName: "clock", outline: true }),
    tag("danger", "Failed", { iconName: "warning-triangle", outline: true }),
  );
  wrap.append(row, codeBlock(`<span class="tag tag--success">\n  ${iconMarkup("check")}\n  Paid\n</span>`));
  return wrap;
}

export function renderTags(body: HTMLElement) {
  const status = createStatusRegion();

  const variants = section("Variants", "Each variant comes strong (filled) or outlined. Add tag--outline for the outlined style.");
  const list = el("ul", "doc-options");
  list.append(...rules.variants.map(variantRow));
  variants.append(list);

  const usage = section("Usage");
  usage.append(ruleList(rules.rules));

  body.append(preview(status), variants, iconExamples(), usage, agentLinks([]), status);
}
