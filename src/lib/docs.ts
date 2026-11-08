/**
 * DOM helpers for the documentation pages. Styles: src/styles/docs.css.
 */
import { copyToClipboard, createStatusRegion, flashLabel } from "./copy";
import { enhanceDropdown } from "./dropdown";
import { icon } from "./icon";

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** A page section with a heading-medium title and an optional intro. */
export function section(title: string, intro?: string | (Node | string)[]) {
  const wrap = el("section", "doc-section");
  const id = `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const heading = el("h2", "doc-section__title text-heading-medium", title);
  heading.id = id;
  wrap.setAttribute("aria-labelledby", id);
  wrap.append(heading, rule());
  if (intro) {
    const p = el("p", "doc-section__intro text-body-large");
    p.append(...(typeof intro === "string" ? [intro] : intro));
    wrap.append(p);
  }
  return wrap;
}

/** The short divider under page and section titles. */
export function rule() {
  const line = el("div", "doc-rule");
  line.setAttribute("aria-hidden", "true");
  return line;
}

/**
 * A preview panel ("stage") with short notes underneath. Returns the note
 * elements too, so a note can flash feedback (e.g. "Copied …").
 */
export function stage(panel: HTMLElement, notes: string[]) {
  const wrap = el("div", "doc-stage");
  const list = el("ul", "doc-notes text-body-large");
  const items = notes.map((note) => el("li", undefined, note));
  list.append(...items);
  wrap.append(panel, list);
  return { stage: wrap, notes: items };
}

/** A code sample block. */
export function codeBlock(code: string) {
  const pre = el("pre", "doc-code");
  pre.append(el("code", undefined, code));
  return pre;
}

/** A bulleted list of usage rules. */
export function ruleList(rules: string[]) {
  const list = el("ul", "doc-rules text-body-large");
  list.append(...rules.map((r) => el("li", undefined, r)));
  return list;
}

/** Inline code, e.g. a class or token name in running text or a table. */
export function code(text: string) {
  return el("code", "doc-inline-code", text);
}

/* ---------------------------------------------------------------------------
 * Richer building blocks for component pages (piloted on Buttons). Each one
 * is generic: it takes content from the page, and its styles live in
 * docs.css under the same name.
 * ------------------------------------------------------------------------- */

/** Two columns that stack on narrow screens. */
export function columns(...children: Node[]) {
  const wrap = el("div", "doc-columns");
  wrap.append(...children);
  return wrap;
}

/** A small heading inside a section (heading-small). */
export function subheading(text: string) {
  return el("h3", "doc-subheading text-heading-small", text);
}

/**
 * A fixed, non-interactive illustration (state previews, do/don't, examples).
 * It's inert and hidden from assistive tech — always put the same
 * information in text next to it — and carries a visible badge so nobody
 * mistakes it for something to click.
 */
export function staticPreview(content: Node | Node[], badge = "Static preview") {
  const wrap = el("div", "doc-static");
  wrap.setAttribute("aria-hidden", "true");
  const tag = el("span", "doc-static__badge tag tag--default tag--outline", badge);
  const body = el("div", "doc-static__body");
  body.inert = true;
  body.append(...(Array.isArray(content) ? content : [content]));
  wrap.append(tag, body);
  return wrap;
}

/** A realistic composition with a title and why it's built that way. */
export function example(opts: { title: string; why: string; content: Node | Node[]; summary: string }) {
  const figure = el("figure", "doc-example");
  const surface = staticPreview(opts.content, "Example");
  surface.classList.add("doc-example__surface");
  const caption = el("figcaption", "doc-example__caption");
  caption.append(
    el("p", "doc-example__title text-body-large-strong", opts.title),
    el("p", "doc-example__why text-body-large", opts.why),
    // What the (hidden) illustration shows, for screen readers.
    el("p", "visually-hidden", opts.summary),
  );
  figure.append(surface, caption);
  return figure;
}

/** A do / don't pair for one topic, each with a static illustration. */
export function doDont(opts: {
  topic: string;
  do: { text: string; preview: Node | Node[] };
  dont: { text: string; preview: Node | Node[] };
}) {
  const wrap = el("div", "doc-dodont");
  wrap.append(subheading(opts.topic));
  const pair = el("div", "doc-dodont__pair");
  for (const kind of ["do", "dont"] as const) {
    const card = el("div", `doc-dodont__card doc-dodont__card--${kind}`);
    const visual = staticPreview(opts[kind].preview, kind === "do" ? "Do" : "Don't");
    const text = el("p", "doc-dodont__text text-body-large");
    const verdict = el("span", "doc-dodont__verdict", kind === "do" ? "Do: " : "Don't: ");
    text.append(verdict, opts[kind].text);
    card.append(visual, text);
    pair.append(card);
  }
  wrap.append(pair);
  return wrap;
}

/** A data table in a horizontally scrollable, keyboard-focusable region. */
export function table(label: string, headers: string[], rows: (string | Node)[][]) {
  const region = el("div", "doc-table-wrap");
  region.setAttribute("role", "region");
  region.setAttribute("aria-label", label);
  region.tabIndex = 0;
  const tableEl = el("table", "doc-table text-body-medium");
  const head = el("thead");
  const headRow = el("tr");
  headRow.append(...headers.map((h) => el("th", undefined, h)));
  head.append(headRow);
  const body = el("tbody");
  for (const cells of rows) {
    const row = el("tr");
    cells.forEach((cell, i) => {
      const td = el(i === 0 ? "th" : "td");
      if (i === 0) td.setAttribute("scope", "row");
      td.append(cell);
      row.append(td);
    });
    body.append(row);
  }
  tableEl.append(head, body);
  region.append(tableEl);
  return region;
}

/** Details tucked behind a native, keyboard-operable disclosure. */
export function disclosure(summary: string, ...content: Node[]) {
  const details = el("details", "doc-disclosure");
  const sum = el("summary", "doc-disclosure__summary text-body-large");
  const chevron = icon("nav-arrow-right", 16);
  chevron.classList.add("doc-disclosure__chevron");
  sum.append(chevron, summary);
  const body = el("div", "doc-disclosure__body");
  body.append(...content);
  details.append(sum, body);
  return details;
}

/* Playground ------------------------------------------------------------------ */

export type PlaygroundValues = Record<string, string | boolean>;

export interface PlaygroundControl {
  id: string;
  label: string;
  kind: "select" | "switch";
  options?: { value: string; label: string }[];
  initial: string | boolean;
}

export interface PlaygroundConfig {
  /** Accessible name of the whole playground, e.g. "Button playground". */
  name: string;
  controls: PlaygroundControl[];
  /** HTML for the chosen options. The preview is rendered from this exact
      markup, so what you copy is what you see. */
  markup(values: PlaygroundValues): string;
  /** Short spoken summary of the preview, e.g. "Primary button, Save". */
  describe(values: PlaygroundValues): string;
}

let playgroundId = 0;

/**
 * Interactive playground: our own Dropdowns and Switches change the options,
 * the preview and its markup update together, Reset restores the defaults
 * and Copy puts the markup on the clipboard. Changes are announced politely
 * to screen readers.
 */
export function playground(config: PlaygroundConfig) {
  const id = `playground-${++playgroundId}`;
  const values: PlaygroundValues = {};
  const wrap = el("div", "doc-playground");
  wrap.setAttribute("role", "group");
  wrap.setAttribute("aria-label", config.name);

  const bar = el("div", "doc-playground__bar");
  bar.append(
    el("span", "tag tag--inverted", "Interactive"),
    el("span", "doc-playground__hint text-body-medium", "Change the options: the preview and the markup update together."),
  );

  const preview = el("div", "doc-playground__preview");
  preview.setAttribute("role", "region");
  preview.setAttribute("aria-label", "Preview");
  // Links in the preview are real but shouldn't navigate away.
  preview.addEventListener("click", (event) => {
    if ((event.target as Element).closest("a")) event.preventDefault();
  });

  const controls = el("div", "doc-playground__controls");
  const resetters: (() => void)[] = [];

  for (const control of config.controls) {
    values[control.id] = control.initial;
    const field = el("div", `doc-field doc-field--${control.kind}`);
    const controlId = `${id}-${control.id}`;

    if (control.kind === "select") {
      const label = el("label", "doc-field__label text-body-medium", control.label);
      label.htmlFor = controlId;
      const dropdown = el("div", "dropdown dropdown--block");
      const select = el("select", "dropdown__select");
      select.id = controlId;
      select.append(...(control.options ?? []).map((o) => new Option(o.label, o.value, false, o.value === control.initial)));
      const chevron = icon("nav-arrow-down");
      chevron.classList.add("dropdown__chevron");
      dropdown.append(select, chevron);
      field.append(label, dropdown);
      enhanceDropdown(dropdown);
      select.addEventListener("change", () => {
        values[control.id] = select.value;
        update();
      });
      resetters.push(() => {
        select.value = String(control.initial);
        values[control.id] = control.initial;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
    } else {
      const label = el("span", "doc-field__label text-body-medium", control.label);
      label.id = `${controlId}-label`;
      const toggle = el("button", "switch");
      toggle.type = "button";
      toggle.id = controlId;
      toggle.setAttribute("role", "switch");
      toggle.setAttribute("aria-labelledby", label.id);
      toggle.setAttribute("aria-checked", String(Boolean(control.initial)));
      toggle.append(el("span", "switch__knob"));
      toggle.addEventListener("click", () => {
        const on = toggle.getAttribute("aria-checked") !== "true";
        toggle.setAttribute("aria-checked", String(on));
        values[control.id] = on;
        update();
      });
      // Clicking the label toggles too, like a native checkbox label.
      label.addEventListener("click", () => toggle.click());
      field.append(label, toggle);
      resetters.push(() => {
        toggle.setAttribute("aria-checked", String(Boolean(control.initial)));
        values[control.id] = control.initial;
      });
    }
    controls.append(field);
  }

  // Actions: Reset (tertiary) and Copy markup (secondary).
  const actions = el("div", "doc-playground__actions");
  const reset = el("button", "button button--tertiary");
  reset.type = "button";
  reset.append(icon("refresh"), "Reset");
  const copy = el("button", "button button--secondary");
  copy.type = "button";
  const copyText = el("span", undefined, "Copy markup");
  copy.append(icon("copy"), copyText);
  actions.append(reset, copy);

  const codeEl = el("code");
  const pre = el("pre", "doc-code doc-playground__code");
  pre.setAttribute("aria-label", "Markup");
  pre.append(codeEl);

  const live = el("p", "visually-hidden");
  live.setAttribute("aria-live", "polite");
  const status = createStatusRegion();

  let markup = "";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  function update(announce = true) {
    markup = config.markup(values);
    preview.innerHTML = markup;
    codeEl.textContent = markup;
    if (!announce) return;
    live.textContent = `Preview: ${config.describe(values)}`;
    // A short blur-in, so the swap reads as one component changing rather
    // than one element replacing another. Opacity only with reduced motion.
    preview.firstElementChild?.animate(
      reducedMotion.matches
        ? [{ opacity: 0.5 }, { opacity: 1 }]
        : [
            { opacity: 0.5, filter: "blur(2px)", transform: "scale(0.98)" },
            { opacity: 1, filter: "blur(0)", transform: "none" },
          ],
      { duration: 180, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
    );
  }

  reset.addEventListener("click", () => {
    resetters.forEach((fn) => fn());
    update(false);
    live.textContent = `Options reset. Preview: ${config.describe(values)}`;
  });
  copy.addEventListener("click", async () => {
    if (await copyToClipboard(markup, status)) {
      // Announce briefly instead of reading the whole snippet aloud.
      status.textContent = "Markup copied to clipboard";
      flashLabel(copyText, "Copied", "Copy markup");
    }
  });

  wrap.append(bar, preview, controls, actions, pre, live, status);
  update(false);
  return wrap;
}
