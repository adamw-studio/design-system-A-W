/**
 * Dropdown page — Figma "Foundation – UI 2", node 45:314: the intro, then a
 * bordered preview panel with the Dropdown set (45:421) stacked: default
 * with icon, borderless, focused, disabled. Below it, the site adds states,
 * a labelled form example and usage rules. Every dropdown is enhanced
 * (src/lib/dropdown.ts) to open its options in a Menu.
 *
 * Component: src/styles/components/dropdown.css. Rules come from
 * tokens/dropdown-rules.json, which also feeds public/llms.txt.
 */
import rules from "../../tokens/dropdown-rules.json";
import { agentLinks } from "../lib/agent-links";
import { codeBlock, el, ruleList, section, stage } from "../lib/docs";
import { enhanceDropdown } from "../lib/dropdown";
import { icon, iconMarkup } from "../lib/icon";
import "../styles/pages/dropdown.css";

export const dropdownIntro = rules.intro;
type State = (typeof rules.states)[number];

const OPTIONS = ["Value", "Draft", "In review", "Published", "Archived"];

interface DropdownOptions {
  label: string;
  iconName?: string;
  borderless?: boolean;
  state?: "focused";
  disabled?: boolean;
  options?: string[];
  id?: string;
}

function dropdown({ label, iconName, borderless, state, disabled, options = OPTIONS, id }: DropdownOptions) {
  const wrap = el("div", "dropdown");
  if (iconName) wrap.classList.add("dropdown--icon");
  if (borderless) wrap.classList.add("dropdown--borderless");
  if (state) wrap.dataset.state = state;

  const select = el("select", "dropdown__select");
  select.setAttribute("aria-label", label);
  if (id) select.id = id;
  select.disabled = Boolean(disabled);
  select.append(...options.map((text) => new Option(text, text)));

  if (iconName) {
    const lead = icon(iconName);
    lead.classList.add("dropdown__icon");
    wrap.append(lead);
  }
  const chevron = icon("nav-arrow-down");
  chevron.classList.add("dropdown__chevron");
  wrap.append(select, chevron);
  return wrap;
}

const SAMPLES: Record<string, DropdownOptions> = {
  default: { label: "Status (default)", iconName: "notes" },
  borderless: { label: "Status (borderless)", borderless: true },
  focused: { label: "Status (focused)", iconName: "notes", state: "focused" },
  disabled: { label: "Status (disabled)", disabled: true },
};

/** Figma frame "Light" (45:323): the four variants stacked, 11px apart. */
function preview() {
  const panel = el("div", "doc-preview");
  const column = el("div", "dropdown-preview");
  column.setAttribute("role", "group");
  column.setAttribute("aria-label", "Dropdown states");
  // Figma order: default, borderless, focused, disabled.
  column.append(...["default", "borderless", "focused", "disabled"].map((key) => dropdown(SAMPLES[key])));
  panel.append(column);
  return stage(panel, [
    "They work: open one to pick a value. The list is a Menu that scales in from the dropdown in 200ms and closes faster.",
    "From the keyboard (Enter, Space, arrow keys) it opens instantly. Type to jump to an option.",
    "Focused keeps the stroke and adds a soft 1.4px ring, the same for keyboard and pointer.",
  ]).stage;
}

function stateRow(state: State) {
  const row = el("li", "doc-option");
  const sample = el("div", "doc-option__sample dropdown-sample");
  sample.append(dropdown(SAMPLES[state.state]));
  const text = el("div");
  text.append(
    el("p", "doc-option__name text-heading-small", state.label),
    el("p", "doc-option__usage text-body-large", state.usage),
  );
  row.append(sample, text);
  return row;
}

/** A form field: visible label linked with for/id, full-width dropdown. */
function formExample() {
  const field = el("div", "dropdown-field");
  const label = el("label", "dropdown-field__label text-body-medium", "Country");
  label.htmlFor = "dropdown-example-country";
  const control = dropdown({
    label: "Country",
    iconName: "map-pin",
    id: "dropdown-example-country",
    options: ["Germany", "Netherlands", "Sweden", "United Kingdom", "United States"],
  });
  control.classList.add("dropdown--block");
  // The visible label names it; drop the fallback aria-label.
  control.querySelector("select")?.removeAttribute("aria-label");
  field.append(label, control);
  return field;
}

export function renderDropdown(body: HTMLElement) {
  const states = section("States");
  const list = el("ul", "doc-options");
  list.append(...rules.states.map(stateRow));
  states.append(list);

  const labels = section("Labels", "In forms, put a visible label above the dropdown and link the two with for and id.");
  labels.append(
    formExample(),
    codeBlock(
      `<label for="country">Country</label>\n<div class="dropdown dropdown--icon dropdown--block">\n  ${iconMarkup("map-pin").replace('class="icon"', 'class="icon dropdown__icon"')}\n  <select class="dropdown__select" id="country">\n    <option>Germany</option>\n    …\n  </select>\n  ${iconMarkup("nav-arrow-down").replace('class="icon"', 'class="icon dropdown__chevron"')}\n</div>`,
    ),
  );

  const usage = section("Usage");
  usage.append(ruleList(rules.rules));

  body.append(preview(), states, labels, usage, agentLinks([]));
  // Enhance once in the page, so visible <label for> elements can be found.
  body.querySelectorAll<HTMLElement>(".dropdown").forEach(enhanceDropdown);
}
