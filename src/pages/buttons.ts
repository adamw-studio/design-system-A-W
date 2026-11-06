/**
 * Buttons page — layout from Figma "Foundation – UI 2", node 18:3529: the
 * intro, then a bordered preview panel with the component set (23:5203) as
 * a grid of variants (columns) × states (rows). Below it, the site adds
 * per-variant usage, icon examples and usage rules.
 *
 * Icon Buttons page — Figma node 23:5380: the same layout with the Icon
 * Button set (23:5345) in the panel, one state per column.
 *
 * Components: src/styles/components/{button,icon-button}.css. Usage rules
 * come from tokens/button-rules.json, which also feeds public/llms.txt.
 */
import rules from "../../tokens/button-rules.json";
import { copyToClipboard, createStatusRegion, flashLabel } from "../lib/copy";
import { agentLinks } from "../lib/agent-links";
import "../styles/pages/buttons.css";

export const buttonsIntro = rules.intro;
export const iconButtonsIntro = rules.iconButton.intro;

type Variant = (typeof rules.variants)[number];
type State = "default" | "hover" | "disabled";
type IconState = (typeof rules.iconButton.states)[number];

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

function iconButton(label: string, state: string = "default") {
  const btn = el("button", "icon-button");
  btn.type = "button";
  btn.setAttribute("aria-label", label);
  btn.title = label;
  if (state === "hover" || state === "active") btn.dataset.state = state;
  if (state === "disabled") btn.disabled = true;
  const icon = el("span", "icon-button__icon");
  icon.style.setProperty("--icon", `url("${ICON}")`);
  icon.setAttribute("aria-hidden", "true");
  btn.append(icon);
  return btn;
}

/** Figma frame "Light" (23:5389): the four states in a row. */
function iconPreview(status: HTMLElement) {
  const panel = el("div", "button-preview");
  const row = el("div", "icon-button-preview");
  row.setAttribute("role", "group");
  row.setAttribute("aria-label", "Icon button states");

  const hint = el("p", "button-preview__hint text-body-medium");
  const hintText = "Click an icon button to copy its class.";
  hint.textContent = hintText;

  for (const state of rules.iconButton.states) {
    const btn = iconButton(`Notifications (${state.label.toLowerCase()})`, state.state);
    btn.addEventListener("click", async () => {
      if (await copyToClipboard("icon-button", status)) flashLabel(hint, 'Copied class="icon-button"', hintText);
    });
    row.append(btn);
  }

  panel.append(row);
  return [panel, hint];
}

function iconStateRow(state: IconState) {
  const row = el("li", "button-variant");
  const sample = el("div", "button-variant__sample");
  sample.append(iconButton(`Notifications (${state.label.toLowerCase()})`, state.state));
  const text = el("div", "button-variant__text");
  text.append(
    el("p", "button-variant__name text-body-large-strong", state.label),
    el("p", "button-variant__usage text-body-large", state.usage),
  );
  row.append(sample, text);
  return row;
}

/** A live toggle so the Active state can be tried, not just seen. */
function toggleExample() {
  const wrap = el("div", "button-icons");
  const btn = iconButton("Mute notifications");
  btn.setAttribute("aria-pressed", "false");
  const label = el("span", "icon-button-toggle__label text-body-medium", "aria-pressed=\"false\"");
  btn.addEventListener("click", () => {
    const on = btn.getAttribute("aria-pressed") !== "true";
    btn.setAttribute("aria-pressed", String(on));
    label.textContent = `aria-pressed="${on}"`;
  });
  wrap.append(btn, label);
  return wrap;
}

export function renderIconButtons(body: HTMLElement) {
  const status = createStatusRegion();

  const states = section("States");
  const list = el("ul", "button-variants");
  list.append(...rules.iconButton.states.map(iconStateRow));
  states.append(list);

  const toggle = section("Toggles", "For on/off actions, set aria-pressed. The Active fill then stays on while the toggle is on. Try it:");
  const code = el("pre", "button-code");
  code.append(
    el(
      "code",
      undefined,
      `<button class="icon-button" type="button" aria-label="Mute notifications" aria-pressed="false">\n  <span class="icon-button__icon" style="--icon: url(/icons/app-notification.svg)" aria-hidden="true"></span>\n</button>`,
    ),
  );
  toggle.append(toggleExample(), code);

  const usage = section("Usage");
  const ruleList = el("ul", "button-rules text-body-large");
  ruleList.append(...rules.iconButton.rules.map((r) => el("li", undefined, r)));
  usage.append(ruleList);

  body.append(...iconPreview(status), states, toggle, usage, agentLinks([]), status);
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
