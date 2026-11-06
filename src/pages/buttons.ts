/**
 * Buttons page — layout from Figma "Foundation – UI 2", node 18:3529: the
 * intro, then a bordered preview panel with the component set (23:5203) as
 * a grid of variants (columns) × states (rows). Below it, the site adds
 * per-variant usage, icon examples and usage rules.
 *
 * The button itself is src/styles/components/button.css; usage rules come
 * from tokens/button-rules.json, which also feeds public/llms.txt.
 */
import rules from "../../tokens/button-rules.json";
import { copyToClipboard, createStatusRegion, flashLabel } from "../lib/copy";
import { agentLinks } from "../lib/agent-links";
import "../styles/pages/buttons.css";

export const buttonsIntro = rules.intro;

type Variant = (typeof rules.variants)[number];
type State = "default" | "hover" | "disabled";

/** Figma column order. Danger and Success sit after a wider gap and have no
    disabled state in the component set. */
const COLUMNS: Record<string, { column: number; states: State[] }> = {
  primary: { column: 1, states: ["default", "hover", "disabled"] },
  secondary: { column: 2, states: ["default", "hover", "disabled"] },
  tertiary: { column: 3, states: ["default", "hover", "disabled"] },
  danger: { column: 5, states: ["default", "hover"] },
  success: { column: 6, states: ["default", "hover"] },
};
const ROWS: State[] = ["default", "hover", "disabled"];

const ICON = "/icons/app-notification.svg";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const classesFor = (variant: string) => `button button--${variant}`;

function button(variant: string, label: string, opts: { state?: State; iconLead?: boolean; iconTrail?: boolean } = {}) {
  const btn = el("button", classesFor(variant));
  btn.type = "button";
  if (opts.state === "hover") btn.dataset.state = "hover";
  if (opts.state === "disabled") btn.disabled = true;

  const icon = () => {
    const span = el("span", "button__icon");
    span.style.setProperty("--icon", `url("${ICON}")`);
    span.setAttribute("aria-hidden", "true");
    return span;
  };
  if (opts.iconLead) btn.append(icon());
  btn.append(label);
  if (opts.iconTrail) btn.append(icon());
  return btn;
}

/** Figma frame "Light": every variant × state, click to copy the classes. */
function preview(status: HTMLElement) {
  const panel = el("div", "button-preview");
  const grid = el("div", "button-preview__grid");
  grid.setAttribute("role", "group");
  grid.setAttribute("aria-label", "Button variants and states");

  const hint = el("p", "button-preview__hint text-body-medium");
  const hintText = "Click a button to copy its classes.";
  hint.textContent = hintText;

  for (const variant of rules.variants) {
    const { column, states } = COLUMNS[variant.variant];
    for (const state of states) {
      const btn = button(variant.variant, "Button", { state });
      btn.style.gridColumn = String(column);
      btn.style.gridRow = String(ROWS.indexOf(state) + 1);
      btn.setAttribute("aria-label", `${variant.label}, ${state}. Copy classes ${classesFor(variant.variant)}`);
      btn.title = `${variant.label} · ${state}`;
      btn.addEventListener("click", async () => {
        if (await copyToClipboard(classesFor(variant.variant), status)) {
          flashLabel(hint, `Copied class="${classesFor(variant.variant)}"`, hintText);
        }
      });
      grid.append(btn);
    }
  }

  panel.append(grid);
  return [panel, hint];
}

function section(title: string, intro?: string) {
  const wrap = el("section", "button-section");
  const id = `buttons-${title.toLowerCase()}`;
  const heading = el("h2", "button-section__title text-heading-medium", title);
  heading.id = id;
  wrap.setAttribute("aria-labelledby", id);
  wrap.append(heading);
  if (intro) wrap.append(el("p", "button-section__intro text-body-large", intro));
  return wrap;
}

function variantRow(variant: Variant) {
  const row = el("li", "button-variant");
  const sample = el("div", "button-variant__sample");
  sample.append(button(variant.variant, variant.label));

  const text = el("div", "button-variant__text");
  const name = el("p", "button-variant__name text-body-large-strong", variant.label);
  const usage = el("p", "button-variant__usage text-body-large", variant.usage);
  const cls = el("code", "button-variant__class", `.button--${variant.variant}`);
  text.append(name, usage, cls);

  row.append(sample, text);
  return row;
}

function iconExamples() {
  const wrap = section("Icons", "Add a 16px icon before or after the label. Icons take the label's color, so they work on every variant.");
  const row = el("div", "button-icons");
  row.append(
    button("primary", "Notify", { iconLead: true }),
    button("secondary", "Notify", { iconTrail: true }),
    button("tertiary", "Notify", { iconLead: true, iconTrail: true }),
  );
  const code = el("pre", "button-code");
  code.append(
    el(
      "code",
      undefined,
      `<button class="button button--primary" type="button">\n  <span class="button__icon" style="--icon: url(/icons/app-notification.svg)" aria-hidden="true"></span>\n  Notify\n</button>`,
    ),
  );
  wrap.append(row, code);
  return wrap;
}

export function renderButtons(body: HTMLElement) {
  const status = createStatusRegion();

  const variants = section("Variants");
  const list = el("ul", "button-variants");
  list.append(...rules.variants.map(variantRow));
  variants.append(list);

  const usage = section("Usage");
  const ruleList = el("ul", "button-rules text-body-large");
  ruleList.append(...rules.rules.map((r) => el("li", undefined, r)));
  usage.append(ruleList);

  body.append(...preview(status), variants, iconExamples(), usage, agentLinks([]), status);
}
