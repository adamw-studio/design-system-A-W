/**
 * Switch page — Figma "Foundation – UI 2", node 42:20: the intro, then a
 * bordered preview panel with the Switch set (44:71), Off and On side by
 * side. Below it, the site adds states, a labelled settings row and usage
 * rules.
 *
 * Component: src/styles/components/switch.css. Rules come from
 * tokens/switch-rules.json, which also feeds public/llms.txt.
 */
import rules from "../../tokens/switch-rules.json";
import { agentLinks } from "../lib/agent-links";
import { codeBlock, el, ruleList, section, stage } from "../lib/docs";
import "../styles/pages/switch.css";

export const switchIntro = rules.intro;
/** A live switch: clicking flips aria-checked (and calls onChange). */
function switchEl(checked: boolean, label?: string, onChange?: (on: boolean) => void) {
  const btn = el("button", "switch");
  btn.type = "button";
  btn.setAttribute("role", "switch");
  btn.setAttribute("aria-checked", String(checked));
  if (label) btn.setAttribute("aria-label", label);
  btn.append(el("span", "switch__knob"));
  btn.addEventListener("click", () => {
    const on = btn.getAttribute("aria-checked") !== "true";
    btn.setAttribute("aria-checked", String(on));
    onChange?.(on);
  });
  return btn;
}

/** Figma frame "Light" (42:29): Off and On, 11px apart. Both are live. */
function preview() {
  const panel = el("div", "doc-preview");
  const row = el("div", "switch-preview");
  row.setAttribute("role", "group");
  row.setAttribute("aria-label", "Switch states");
  row.append(switchEl(false, "Example switch (starts off)"), switchEl(true, "Example switch (starts on)"));
  panel.append(row);
  return stage(panel, [
    "Click to try them: a switch takes effect immediately.",
    "Off sits on --color-bg-hover, On on --color-bg-inverse; the knob slides 16px.",
  ]).stage;
}

function stateRow(state: (typeof rules.states)[number]) {
  const row = el("li", "doc-option");
  const sample = el("div", "doc-option__sample switch-sample");
  sample.append(switchEl(state.state === "on", `${state.label} state`));
  const text = el("div");
  text.append(
    el("p", "doc-option__name text-heading-small", state.label),
    el("p", "doc-option__usage text-body-large", state.usage),
  );
  row.append(sample, text);
  return row;
}

/** A settings row: visible label first, switch at the end, linked by id. */
function settingExample() {
  const row = el("div", "switch-setting");
  const label = el("span", "switch-setting__label text-body-large", "Email notifications");
  label.id = "switch-example-label";
  const status = el("span", "switch-setting__status text-body-medium", "aria-checked=\"true\"");
  const toggle = switchEl(true, undefined, (on) => {
    status.textContent = `aria-checked="${on}"`;
  });
  toggle.setAttribute("aria-labelledby", label.id);
  const text = el("span", "switch-setting__text");
  text.append(label, status);
  row.append(text, toggle);
  return row;
}

export function renderSwitch(body: HTMLElement) {
  const states = section("States");
  const list = el("ul", "doc-options");
  list.append(...rules.states.map(stateRow));
  states.append(list);

  const labels = section(
    "Labels",
    "Name the setting with a visible label before the switch and link the two with aria-labelledby.",
  );
  labels.append(
    settingExample(),
    codeBlock(
      `<span id="email-label">Email notifications</span>\n<button class="switch" type="button" role="switch" aria-checked="true" aria-labelledby="email-label">\n  <span class="switch__knob"></span>\n</button>`,
    ),
  );

  const usage = section("Usage");
  usage.append(ruleList(rules.rules));

  body.append(preview(), states, labels, usage, agentLinks([]));
}
