/**
 * Menu page — Figma "Foundation – UI 2":
 * - Menus (node 46:588): the stage is Figma's menu (46:645) — three items
 *   with arrows, live: each opens a submenu once the pointer rests on it
 *   for 300ms (debounced).
 * - Menu item (node 46:492): a section with the item set (46:587) —
 *   default, hover and disabled — and what each state uses.
 * Below that, the site adds a floating menu opened from a Button (the open /
 * close animation), the debounce and usage rules.
 *
 * Component: src/styles/components/menu.css + src/lib/menu.ts. Rules come
 * from tokens/menu-rules.json, which also feeds public/llms.txt.
 */
import rules from "../../tokens/menu-rules.json";
import { agentLinks } from "../lib/agent-links";
import { codeBlock, el, ruleList, section, stage } from "../lib/docs";
import { icon } from "../lib/icon";
import { createMenu, type MenuItemSpec } from "../lib/menu";
import "../styles/pages/menu.css";

export const menuIntro = rules.intro;
export const menuSubtitle = `${rules.itemStates.length} item states · submenus after 300ms`;

/** Figma's menu (46:645): three items, each with a submenu. */
const FIGMA_MENU: MenuItemSpec[] = [
  { label: "Move to", submenu: [{ label: "Inbox" }, { label: "Archive" }, { label: "Trash" }] },
  { label: "Share", submenu: [{ label: "Copy link" }, { label: "Email" }, { label: "Embed", disabled: true }] },
  { label: "Export", submenu: [{ label: "PDF" }, { label: "PNG" }, { label: "SVG" }] },
];

/** Figma frame "Light" (46:597): the menu itself, flat on the panel. */
function menuStage(status: HTMLElement) {
  const panel = el("div", "doc-preview");
  const menu = createMenu(FIGMA_MENU, {
    label: "Example menu",
    onSelect: (item) => {
      status.textContent = `Chose ${item.label}`;
      menu.close();
    },
  });
  menu.el.classList.add("menu-stage");
  panel.append(menu.el);
  return stage(panel, [
    "Hover an item and rest: its submenu opens after 300ms. Move to another item first and the wait restarts — that's the debounce.",
    "Cut diagonally from an item into its open submenu: crossing the items in between doesn't close it.",
    "From the keyboard: Arrow keys to move, Arrow Right or Enter to open, Arrow Left or Escape to go back, letters to jump.",
  ]).stage;
}

/** One standalone Menu item in a given state (Figma set 46:587). */
function menuItem(state: string) {
  const item = el("div", "menu__item menu-item-sample");
  if (state === "hover") item.dataset.state = "hover";
  if (state === "disabled") item.setAttribute("aria-disabled", "true");
  const label = el("span", "menu__label");
  const lead = icon("notes");
  lead.classList.add("menu__icon");
  label.append(lead, el("span", "menu__text", "Action item"));
  const arrow = icon("nav-arrow-right");
  arrow.classList.add("menu__trail");
  item.append(label, arrow);
  return item;
}

function itemSection() {
  const wrap = section("Menu item", "The building block of every menu: 24px tall, with an optional icon before the label and an arrow after it.");
  const panel = el("div", "doc-preview");
  const column = el("div", "menu-item-preview");
  column.setAttribute("aria-hidden", "true");
  column.append(...rules.itemStates.map((s) => menuItem(s.state)));
  panel.append(column);

  const list = el("ul", "doc-options");
  for (const s of rules.itemStates) {
    const row = el("li", "doc-option");
    const sample = el("div", "doc-option__sample menu-item-option");
    const item = menuItem(s.state);
    item.setAttribute("aria-hidden", "true");
    sample.append(item);
    const text = el("div");
    text.append(
      el("p", "doc-option__name text-body-large-strong", s.label),
      el("p", "doc-option__usage text-body-large", s.usage),
    );
    row.append(sample, text);
    list.append(row);
  }
  wrap.append(panel, list);
  return wrap;
}

/** A floating menu opened from a Button: shows the open/close animation. */
function floatingSection(status: HTMLElement) {
  const wrap = section(
    "Opening and closing",
    "A floating menu scales in from its trigger over 200ms and closes in 120ms, without ever starting from nothing. Open it from the keyboard and it appears at once.",
  );
  const demo = el("div", "menu-anchor");
  const trigger = el("button", "button button--secondary");
  trigger.type = "button";
  trigger.setAttribute("aria-haspopup", "menu");
  trigger.setAttribute("aria-expanded", "false");
  trigger.append("Actions", icon("nav-arrow-down"));

  const close = (focus = false) => {
    menu.close();
    trigger.setAttribute("aria-expanded", "false");
    if (focus) trigger.focus();
  };
  const menu = createMenu(
    [
      { label: "Rename", icon: "edit-pencil" },
      { label: "Duplicate", icon: "copy" },
      { label: "Move to", icon: "folder", submenu: [{ label: "Inbox" }, { label: "Archive" }] },
      { label: "Delete", icon: "trash", disabled: true },
    ],
    {
      floating: true,
      label: "Actions",
      onSelect: (item) => {
        status.textContent = `Chose ${item.label}`;
        close(true);
      },
      onEscape: () => close(true),
    },
  );
  trigger.setAttribute("aria-controls", menu.el.id);

  trigger.addEventListener("click", (event) => {
    if (menu.isOpen()) return close();
    // detail 0 = Enter/Space: open instantly and focus the first item.
    const keyboard = event.detail === 0;
    menu.open({ instant: keyboard, focus: keyboard ? "first" : "none" });
    trigger.setAttribute("aria-expanded", "true");
  });
  document.addEventListener("pointerdown", (event) => {
    if (menu.isOpen() && !demo.contains(event.target as Node)) close();
  });
  demo.addEventListener("focusout", (event) => {
    if (menu.isOpen() && !demo.contains(event.relatedTarget as Node | null)) close();
  });

  demo.append(trigger, menu.el);
  wrap.append(demo);
  return wrap;
}

function debounceSection() {
  const wrap = section(
    "Debounce",
    "A delay before running a function that restarts each time it's triggered, so only the last call runs. Menus use 300ms for submenus and for resetting type-ahead.",
  );
  wrap.append(
    codeBlock(`import { debounce } from "./lib/debounce";

// Runs 300ms after the pointer stops moving between items.
const settle = debounce((item) => openSubmenuOf(item), 300);
menu.addEventListener("pointermove", (e) => settle(itemUnder(e)));`),
  );
  return wrap;
}

export function renderMenu(body: HTMLElement) {
  const status = el("p", "visually-hidden");
  status.setAttribute("role", "status");

  const usage = section("Usage");
  usage.append(ruleList(rules.rules));

  body.append(menuStage(status), itemSection(), floatingSection(status), debounceSection(), usage, agentLinks([]), status);
}
