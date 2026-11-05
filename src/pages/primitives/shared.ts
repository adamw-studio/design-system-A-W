import type { Family, Mode, Shade } from "./data";
import { hexLabel, inkFor, opacityPercent, rgbLabel } from "./data";

/** What the views need from the page: current mode and the shared actions. */
export interface PaletteContext {
  mode: Mode;
  families: Family[];
  copy(shade: Shade, what?: "var" | "hex" | "rgb"): void;
  open(shade: Shade, source: HTMLElement): void;
  add(shade: Shade): void;
}

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Points an element at a shade: its color var and the ink that reads on it. */
export function paint(node: HTMLElement, shade: Shade, family: Family, mode: Mode) {
  node.style.setProperty("--shade", `var(${shade.cssVar})`);
  node.dataset.ink = inkFor(shade.values[mode], family.backdrop);
}

/** "F24822", or "30%" for transparent scales. */
export function shortValue(shade: Shade, family: Family, mode: Mode) {
  const hex = shade.values[mode];
  return family.backdrop ? `${opacityPercent(hex)}%` : hexLabel(hex);
}

export function longValue(shade: Shade, family: Family, mode: Mode) {
  const hex = shade.values[mode];
  return family.backdrop ? `${hexLabel(hex)} · ${opacityPercent(hex)}%` : `RGB ${rgbLabel(hex)}`;
}

export const ICONS = {
  copy: `<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M5 2.5A1.5 1.5 0 0 1 6.5 1h6A1.5 1.5 0 0 1 14 2.5v6a1.5 1.5 0 0 1-1.5 1.5H11v1.5A1.5 1.5 0 0 1 9.5 13h-6A1.5 1.5 0 0 1 2 11.5v-6A1.5 1.5 0 0 1 3.5 4H5V2.5ZM6 4h3.5A1.5 1.5 0 0 1 11 5.5V9h1.5a.5.5 0 0 0 .5-.5v-6a.5.5 0 0 0-.5-.5h-6a.5.5 0 0 0-.5.5V4ZM3.5 5a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 .5.5h6a.5.5 0 0 0 .5-.5v-6a.5.5 0 0 0-.5-.5h-6Z"/></svg>`,
  add: `<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8.5 2.5a.5.5 0 0 0-1 0v5h-5a.5.5 0 0 0 0 1h5v5a.5.5 0 0 0 1 0v-5h5a.5.5 0 0 0 0-1h-5v-5Z"/></svg>`,
  close: `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M3.65 3.65a.5.5 0 0 1 .7 0L8 7.29l3.65-3.64a.5.5 0 0 1 .7.7L8.71 8l3.64 3.65a.5.5 0 0 1-.7.7L8 8.71l-3.65 3.64a.5.5 0 0 1-.7-.7L7.29 8 3.65 4.35a.5.5 0 0 1 0-.7Z"/></svg>`,
  prev: `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M10.35 3.65a.5.5 0 0 1 0 .7L6.71 8l3.64 3.65a.5.5 0 0 1-.7.7l-4-4a.5.5 0 0 1 0-.7l4-4a.5.5 0 0 1 .7 0Z"/></svg>`,
  next: `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M5.65 3.65a.5.5 0 0 1 .7 0l4 4a.5.5 0 0 1 0 .7l-4 4a.5.5 0 0 1-.7-.7L9.29 8 5.65 4.35a.5.5 0 0 1 0-.7Z"/></svg>`,
};

/** Small icon buttons (copy / add) revealed on hover or focus. */
export function shadeActions(shade: Shade, ctx: PaletteContext, label: string) {
  const actions = el("div", "shade-actions");
  const copy = el("button", "shade-action");
  copy.type = "button";
  copy.innerHTML = ICONS.copy;
  copy.setAttribute("aria-label", `Copy var(${shade.cssVar})`);
  copy.title = `Copy var(${shade.cssVar})`;
  copy.addEventListener("click", (e) => {
    e.stopPropagation();
    ctx.copy(shade);
  });

  const add = el("button", "shade-action");
  add.type = "button";
  add.innerHTML = ICONS.add;
  add.setAttribute("aria-label", `Add ${label} to composition`);
  add.title = "Add to composition";
  add.addEventListener("click", (e) => {
    e.stopPropagation();
    ctx.add(shade);
  });

  actions.append(copy, add);
  return actions;
}
