/**
 * Buttons page — Figma "Foundation – UI 2", node 18:3529 (component set
 * 23:5203). The documentation pilot: overview, playground, variants, states
 * (Figma's default / hover / disabled plus pressed and focus), examples,
 * do/don't, accessibility and an implementation reference. See the
 * "Buttons page" block below.
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
import {
  code,
  codeBlock,
  columns,
  disclosure,
  doDont,
  el,
  example,
  playground,
  ruleList,
  section,
  stage,
  staticPreview,
  subheading,
  table,
  type PlaygroundValues,
} from "../lib/docs";
import { icon, iconMarkup } from "../lib/icon";
import "../styles/pages/buttons.css";

export const buttonsIntro = rules.intro;
export const iconButtonsIntro = rules.iconButton.intro;
export const buttonsSubtitle = `${rules.variants.length} variants · ${rules.states.length} states · optional icons`;
export const iconButtonsSubtitle = `${rules.iconButton.states.length} states · 16px icon`;

type IconState = (typeof rules.iconButton.states)[number];

/** The icon Figma uses in the button sets. */
const ICON = "app-notification";

const classesFor = (variant: string) => `button button--${variant}`;

function iconButton(label: string, state: string = "default") {
  const btn = el("button", "icon-button");
  btn.type = "button";
  btn.setAttribute("aria-label", label);
  btn.title = label;
  if (state === "hover" || state === "active") btn.dataset.state = state;
  if (state === "disabled") btn.disabled = true;
  btn.append(icon(ICON));
  return btn;
}

/** Figma frame "Light" (23:5389): the four states in a row. */
function iconPreview(status: HTMLElement) {
  const panel = el("div", "doc-preview");
  const row = el("div", "icon-button-preview");
  row.setAttribute("role", "group");
  row.setAttribute("aria-label", "Icon button states");

  const hintText = "Click an icon button to copy its class.";
  const { stage: block, notes } = stage(panel, [
    hintText,
    "States: default, hover, active and disabled.",
    "The icon is a 16px Icon Shell in --color-icon-default.",
  ]);
  const hint = notes[0];

  for (const state of rules.iconButton.states) {
    const btn = iconButton(`Notifications (${state.label.toLowerCase()})`, state.state);
    btn.addEventListener("click", async () => {
      if (await copyToClipboard("icon-button", status)) flashLabel(hint, 'Copied class="icon-button"', hintText);
    });
    row.append(btn);
  }

  panel.append(row);
  return block;
}

function iconStateRow(state: IconState) {
  const row = el("li", "doc-option");
  const sample = el("div", "doc-option__sample");
  sample.append(iconButton(`Notifications (${state.label.toLowerCase()})`, state.state));
  const text = el("div", "doc-option__text");
  text.append(
    el("p", "doc-option__name text-body-large-strong", state.label),
    el("p", "doc-option__usage text-body-large", state.usage),
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
  const list = el("ul", "doc-options");
  list.append(...rules.iconButton.states.map(iconStateRow));
  states.append(list);

  const toggle = section("Toggles", "For on/off actions, set aria-pressed. The Active fill then stays on while the toggle is on. Try it:");
  toggle.append(
    toggleExample(),
    codeBlock(
      `<button class="icon-button" type="button" aria-label="Mute notifications" aria-pressed="false">\n  ${iconMarkup(ICON)}\n</button>`,
    ),
  );

  const usage = section("Usage");
  usage.append(ruleList(rules.iconButton.rules));

  body.append(iconPreview(status), states, toggle, usage, agentLinks([]), status);
}


/* ============================================================================
 * Buttons page (documentation pilot)
 *
 * Essentials first — overview, playground, variants, states — then examples,
 * do/don't, accessibility, and the implementation reference behind
 * disclosures. All reusable wording comes from tokens/button-rules.json
 * (also published to llms.txt); this file only arranges it and builds the
 * illustrations. Only the playground is interactive: every other preview is
 * a static illustration (staticPreview) with the same information in text.
 * ========================================================================== */

type Variant = (typeof rules.variants)[number];
type PinnedState = "default" | "hover" | "pressed" | "focus" | "disabled";

const variantLabel = (variant: string) => rules.variants.find((v) => v.variant === variant)?.label ?? variant;

/** A real .button for illustrations: variant, label, optional icons. */
function demoButton(variant: string, label: string, opts: { lead?: string; trail?: string; state?: PinnedState } = {}) {
  const btn = el("button", classesFor(variant));
  btn.type = "button";
  if (opts.state === "hover") btn.dataset.state = "hover";
  // Pressed and focus can't be pinned with the component's own hooks; the
  // page pins them with data-pin (buttons.css) from the same tokens.
  if (opts.state === "pressed" || opts.state === "focus") btn.dataset.pin = opts.state;
  if (opts.state === "disabled") btn.disabled = true;
  if (opts.lead) btn.append(icon(opts.lead));
  btn.append(label);
  if (opts.trail) btn.append(icon(opts.trail));
  return btn;
}

/** A row of buttons, end-aligned like a footer (or spread for a "don't"). */
function buttonRow(buttons: HTMLElement[], align: "end" | "between" | "start" = "end") {
  const row = el("div", `button-row button-row--${align}`);
  row.append(...buttons);
  return row;
}

/** A small card (title, text, footer) to show buttons in context. */
function card(title: string, text: string, footer: HTMLElement) {
  const wrap = el("div", "button-example-card");
  wrap.append(
    el("p", "button-example-card__title text-body-large-strong", title),
    el("p", "button-example-card__text text-body-large", text),
    footer,
  );
  return wrap;
}

/* 1. Overview ------------------------------------------------------------------ */

function overviewSection() {
  const wrap = section("Overview");
  const use = el("div");
  use.append(subheading("Use a button when"), ruleList(rules.overview.useWhen));

  const instead = el("div");
  const list = el("ul", "doc-rules text-body-large");
  for (const alt of rules.overview.useInstead) {
    const item = el("li");
    const name = alt.route ? el("a", "button-overview__link", alt.component) : el("span", "button-overview__name", alt.component);
    if (alt.route && name instanceof HTMLAnchorElement) name.href = `#${alt.route}`;
    item.append(name, ` — ${alt.when}`);
    list.append(item);
  }
  instead.append(subheading("Use something else when"), list);
  wrap.append(columns(use, instead));
  return wrap;
}

/* 2. Playground ---------------------------------------------------------------- */

const LABELS = ["Save changes", "Continue", "Cancel", "Delete project", "Approve", "Download report", "Save and continue to checkout"];
const LEAD_ICONS = ["none", "plus", "download", "trash", "check", "edit-pencil"];
const TRAIL_ICONS = ["none", "nav-arrow-down", "arrow-right", "open-new-window"];

const iconOption = (name: string) => ({ value: name, label: name === "none" ? "None" : name });

function buttonMarkup(values: PlaygroundValues) {
  const variant = String(values.variant);
  const label = String(values.label);
  const lead = values.lead !== "none" ? `\n  ${iconMarkup(String(values.lead))}` : "";
  const trail = values.trail !== "none" ? `\n  ${iconMarkup(String(values.trail))}` : "";
  const cls = classesFor(variant);
  const inner = `${lead}\n  ${label}${trail}\n`;
  if (values.element === "a") {
    // A disabled link has no href (so Enter can't follow it) and says so.
    const attrs = values.disabled ? ' aria-disabled="true"' : ' href="/reports"';
    return `<a class="${cls}"${attrs}>${inner}</a>`;
  }
  return `<button class="${cls}" type="button"${values.disabled ? " disabled" : ""}>${inner}</button>`;
}

function playgroundSection() {
  const wrap = section("Playground", "Every option the component supports. The preview is a real button: hover it, press it, Tab to it.");
  wrap.append(
    playground({
      name: "Button playground",
      controls: [
        {
          id: "variant",
          label: "Variant",
          kind: "select",
          initial: "primary",
          options: rules.variants.map((v) => ({ value: v.variant, label: v.label })),
        },
        { id: "label", label: "Label", kind: "select", initial: LABELS[0], options: LABELS.map((l) => ({ value: l, label: l })) },
        { id: "lead", label: "Leading icon", kind: "select", initial: "none", options: LEAD_ICONS.map(iconOption) },
        { id: "trail", label: "Trailing icon", kind: "select", initial: "none", options: TRAIL_ICONS.map(iconOption) },
        {
          id: "element",
          label: "Element",
          kind: "select",
          initial: "button",
          options: [
            { value: "button", label: "<button> — an action" },
            { value: "a", label: "<a> — navigation" },
          ],
        },
        { id: "disabled", label: "Disabled", kind: "switch", initial: false },
      ],
      markup: buttonMarkup,
      describe: (v) =>
        [
          `${variantLabel(String(v.variant))} ${v.element === "a" ? "link" : "button"}, ${v.label}`,
          v.lead !== "none" ? `leading icon ${v.lead}` : "",
          v.trail !== "none" ? `trailing icon ${v.trail}` : "",
          v.disabled ? "disabled" : "",
        ]
          .filter(Boolean)
          .join(", "),
    }),
  );
  return wrap;
}

/* 3. Variants and states ------------------------------------------------------------ */

function variantRow(variant: Variant) {
  const row = el("li", "doc-option");
  const sample = el("div", "doc-option__sample button-variant-sample");
  sample.setAttribute("aria-hidden", "true");
  sample.inert = true;
  sample.append(demoButton(variant.variant, variant.example));
  const text = el("div");
  text.append(
    el("p", "doc-option__name text-body-large-strong", variant.label),
    el("p", "doc-option__usage text-body-large", variant.usage),
    el("code", "doc-option__class", `.button--${variant.variant}`),
  );
  row.append(sample, text);
  return row;
}

function variantsSection() {
  const wrap = section("Variants", "One modifier class each. The previews here are static; try them in the playground.");
  const list = el("ul", "doc-options");
  list.append(...rules.variants.map(variantRow));
  wrap.append(list);
  return wrap;
}

function statesSection() {
  const wrap = section(
    "States",
    "Hover, pressed and disabled come with the component. These are pinned, static previews of every variant; the table says what changes.",
  );
  const matrix = el("div", "button-states");
  matrix.append(el("span"), ...rules.variants.map((v) => el("span", "button-states__head text-body-medium", v.label)));
  for (const state of rules.states) {
    matrix.append(el("span", "button-states__head text-body-medium", state.label));
    for (const v of rules.variants) matrix.append(demoButton(v.variant, "Button", { state: state.state as PinnedState }));
  }
  wrap.append(
    staticPreview(matrix),
    table(
      "Button states",
      ["State", "What changes"],
      rules.states.map((s) => [s.label, s.usage]),
    ),
  );
  return wrap;
}

/* 4. Practical examples ------------------------------------------------------------- */

function examplesSection() {
  const wrap = section("Examples", "Common combinations, and why each uses the variants it does.");
  const byId = Object.fromEntries(rules.examples.map((e) => [e.id, e]));
  const compositions: Record<string, { content: HTMLElement; summary: string }> = {
    form: {
      content: card(
        "Edit profile",
        "Changes show on your public page.",
        buttonRow([demoButton("secondary", "Cancel"), demoButton("primary", "Save changes")]),
      ),
      summary: "Buttons: Cancel (secondary), then Save changes (primary).",
    },
    destructive: {
      content: card(
        "Delete project?",
        "This removes 12 reports for everyone. You can't undo it.",
        buttonRow([demoButton("secondary", "Cancel"), demoButton("danger", "Delete project")]),
      ),
      summary: "Buttons: Cancel (secondary), then Delete project (danger).",
    },
    toolbar: {
      content: buttonRow(
        [
          demoButton("tertiary", "Filter", { lead: "filter" }),
          demoButton("tertiary", "Sort", { lead: "sort" }),
          demoButton("tertiary", "Export", { lead: "download" }),
          demoButton("primary", "New report", { lead: "plus" }),
        ],
        "between",
      ),
      summary: "Buttons: Filter, Sort and Export (tertiary, with icons), then New report (primary, plus icon) at the far end.",
    },
    review: {
      content: card(
        "Budget request #42",
        "Marta asked for 3 new licenses.",
        buttonRow([demoButton("secondary", "Request changes"), demoButton("success", "Approve", { lead: "check" })]),
      ),
      summary: "Buttons: Request changes (secondary), then Approve (success, check icon).",
    },
  };
  const grid = el("div", "button-examples");
  // The toolbar needs the full width to stay on one line.
  for (const id of ["form", "destructive", "review", "toolbar"]) {
    const ex = byId[id];
    const figure = example({ title: ex.title, why: ex.why, ...compositions[id] });
    if (id === "toolbar") figure.classList.add("button-examples__wide");
    grid.append(figure);
  }
  wrap.append(grid);
  return wrap;
}

/* 5. Usage guidance ----------------------------------------------------------------- */

function guidanceSection() {
  const wrap = section("Usage guidance");
  const previews: Record<string, { do: Node; dont: Node }> = {
    Hierarchy: {
      do: buttonRow([demoButton("secondary", "Cancel"), demoButton("primary", "Publish")]),
      dont: buttonRow([demoButton("primary", "Save draft"), demoButton("primary", "Publish")]),
    },
    Labels: {
      do: buttonRow([demoButton("secondary", "Cancel"), demoButton("danger", "Delete project")]),
      dont: buttonRow([demoButton("secondary", "Cancel"), demoButton("danger", "OK")]),
    },
    Icons: {
      do: buttonRow([demoButton("secondary", "Export", { lead: "download" }), demoButton("primary", "Continue", { trail: "arrow-right" })], "start"),
      dont: buttonRow([demoButton("secondary", "Export", { lead: "edit-pencil", trail: "check" })], "start"),
    },
    Placement: {
      do: buttonRow([demoButton("secondary", "Cancel"), demoButton("primary", "Save changes")], "end"),
      dont: buttonRow([demoButton("primary", "Save changes"), demoButton("secondary", "Cancel")], "between"),
    },
  };
  for (const g of rules.guidance) {
    wrap.append(
      doDont({
        topic: g.topic,
        do: { text: g.do, preview: previews[g.topic].do },
        dont: { text: g.dont, preview: previews[g.topic].dont },
      }),
    );
  }
  return wrap;
}

/* 6. Accessibility ------------------------------------------------------------------ */

function accessibilitySection() {
  const wrap = section("Accessibility");
  const list = el("ul", "doc-rules text-body-large");
  for (const item of rules.accessibility) {
    const li = el("li");
    li.append(el("span", "doc-rules__topic", `${item.topic}. `), item.text);
    list.append(li);
  }
  wrap.append(list);
  return wrap;
}

/* 7. Implementation reference ----------------------------------------------------------- */

function referenceSection() {
  const ref = rules.reference;
  const wrap = section("Implementation reference", "The details, for when you build with it.");

  const markup = disclosure(
    "Markup",
    codeBlock(
      [
        `<!-- An action -->`,
        `<button class="button button--primary" type="button">Save changes</button>`,
        ``,
        `<!-- With a leading icon (sized to 16px by the button) -->`,
        `<button class="button button--secondary" type="button">`,
        `  ${iconMarkup("download")}`,
        `  Export`,
        `</button>`,
        ``,
        `<!-- Navigation -->`,
        `<a class="button button--secondary" href="/reports">View reports</a>`,
        ``,
        `<!-- Disabled -->`,
        `<button class="button button--primary" type="button" disabled>Save changes</button>`,
        `<a class="button button--secondary" aria-disabled="true">View reports</a>`,
      ].join("\n"),
    ),
  );

  const classes = disclosure(
    "Classes and options",
    table(
      "Button classes",
      ["Class", "Purpose"],
      ref.classes.map((c) => [code(c.name), c.purpose]),
    ),
    table(
      "Button options",
      ["Option", "Values", "How"],
      ref.options.map((o) => [o.name, o.values, o.how]),
    ),
  );

  const tokenCell = (token: string) => (token === "none" ? "None" : code(token));
  const tokens = disclosure(
    "Semantic tokens",
    table(
      "Button tokens by variant",
      ["Variant", "Fill", "Hover", "Pressed", "Label"],
      rules.variants.map((v) => [v.label, tokenCell(v.tokens.fill), tokenCell(v.tokens.hover), tokenCell(v.tokens.pressed), tokenCell(v.tokens.label)]),
    ),
    table(
      "Tokens shared by every variant",
      ["Use", "Token"],
      [
        ["Disabled label and icons", code("--color-bg-disabled-secondary")],
        ["Text style", code(".text-body-medium (--body-medium-strong-*)")],
        ["Padding", code("--space-2 / --space-3")],
        ["Gap between icon and label", code("--space-2")],
        ["Corner radius", code("--radius-s")],
        ["Hover and press timing", code("--motion-hover / --motion-press / --motion-press-scale")],
      ],
    ),
  );

  const split = disclosure(
    "What the component handles, and what your app handles",
    columns(
      (() => {
        const col = el("div");
        col.append(subheading("The component"), ruleList(ref.component));
        return col;
      })(),
      (() => {
        const col = el("div");
        col.append(subheading("Your app"), ruleList(ref.app));
        return col;
      })(),
    ),
  );

  const limits = disclosure("Known limitations", ruleList(ref.limitations));

  const group = el("div", "doc-disclosures");
  group.append(markup, classes, tokens, split, limits);
  wrap.append(group);
  return wrap;
}

export function renderButtons(body: HTMLElement) {
  body.append(
    overviewSection(),
    playgroundSection(),
    variantsSection(),
    statesSection(),
    examplesSection(),
    guidanceSection(),
    accessibilitySection(),
    referenceSection(),
    agentLinks([]),
  );
}
