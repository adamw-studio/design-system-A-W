/**
 * Menu behaviour for src/styles/components/menu.css.
 *
 * - Pointer: the item under the pointer is highlighted at once. Submenus open
 *   (and sibling submenus close) only once the pointer rests on an item for
 *   300ms — a debounce, restarted on every move to another item. Passing over
 *   items, or cutting diagonally across them into an open submenu, doesn't
 *   flicker submenus open and shut. Clicking opens a submenu immediately.
 * - Keyboard: Arrow Up/Down, Home/End move; Enter/Space/Arrow Right activate
 *   or open a submenu; Arrow Left/Escape close it. Typing jumps to the first
 *   item starting with the typed letters; the typed text resets 300ms after
 *   the last key (debounced).
 * - Floating menus animate open/closed with CSS transitions (menu.css); when
 *   opened from the keyboard they appear instantly.
 */
import { debounce, DEBOUNCE_MS } from "./debounce";
import { icon } from "./icon";

export interface MenuItemSpec {
  label: string;
  /** Lead icon name (Icon Shell, 12px). */
  icon?: string;
  value?: string;
  disabled?: boolean;
  /** Listbox only: the chosen option, marked with a check. */
  selected?: boolean;
  submenu?: MenuItemSpec[];
}

export interface MenuOptions {
  role?: "menu" | "listbox";
  /** Positioned over content and animated (dropdown lists, submenus). */
  floating?: boolean;
  label?: string;
  /** A leaf item was chosen (click, Enter or Space). */
  onSelect?: (item: MenuItemSpec) => void;
  /** Escape (or Arrow Left) on the top-level menu. */
  onEscape?: () => void;
}

export interface Menu {
  el: HTMLElement;
  open(opts?: { instant?: boolean; focus?: "first" | "selected" | "none" }): void;
  close(opts?: { instant?: boolean }): void;
  isOpen(): boolean;
  setSelected(value: string): void;
}

let uid = 0;

export function createMenu(items: MenuItemSpec[], options: MenuOptions = {}, parentItem?: HTMLElement): Menu {
  const role = options.role ?? "menu";
  const el = document.createElement("div");
  el.className = "menu";
  el.id = `menu-${++uid}`;
  el.setAttribute("role", role);
  if (options.label) el.setAttribute("aria-label", options.label);
  if (options.floating) {
    el.classList.add("menu--floating");
    el.dataset.state = "closed";
    el.hidden = true;
  }
  if (parentItem) el.classList.add("menu--sub");

  const specs = new WeakMap<HTMLElement, MenuItemSpec>();
  const submenus = new WeakMap<HTMLElement, Menu>();
  const itemEls: HTMLElement[] = [];

  for (const spec of items) {
    const item = document.createElement("div");
    item.className = "menu__item";
    item.id = `${el.id}-item-${itemEls.length}`;
    item.setAttribute("role", role === "listbox" ? "option" : "menuitem");
    item.tabIndex = -1;
    if (spec.disabled) item.setAttribute("aria-disabled", "true");
    if (role === "listbox") item.setAttribute("aria-selected", String(Boolean(spec.selected)));

    const label = document.createElement("span");
    label.className = "menu__label";
    if (spec.icon) {
      const lead = icon(spec.icon);
      lead.classList.add("menu__icon");
      label.append(lead);
    }
    const text = document.createElement("span");
    text.className = "menu__text";
    text.textContent = spec.label;
    label.append(text);
    item.append(label);

    if (spec.submenu) {
      const arrow = icon("nav-arrow-right");
      arrow.classList.add("menu__trail");
      item.append(arrow);
      item.setAttribute("aria-haspopup", "menu");
      item.setAttribute("aria-expanded", "false");
      const sub = createMenu(spec.submenu, { role: "menu", floating: true, label: spec.label, onSelect: options.onSelect }, item);
      item.setAttribute("aria-controls", sub.el.id);
      item.append(sub.el);
      submenus.set(item, sub);
    } else if (role === "listbox") {
      const check = icon("check");
      check.classList.add("menu__trail");
      check.style.visibility = spec.selected ? "" : "hidden";
      item.append(check);
    }

    specs.set(item, spec);
    itemEls.push(item);
    el.append(item);
  }

  // Helpers ----------------------------------------------------------------------

  const enabled = () => itemEls.filter((item) => item.getAttribute("aria-disabled") !== "true");
  /** The item of this menu (not a nested one) an event happened in. */
  const ownItem = (target: EventTarget | null) => {
    let node = target instanceof Element ? target.closest<HTMLElement>(".menu__item") : null;
    while (node && node.parentElement !== el) node = node.parentElement?.closest<HTMLElement>(".menu__item") ?? null;
    return node;
  };

  function setActive(item: HTMLElement | null, focus = true) {
    for (const other of itemEls) if (other !== item) delete other.dataset.active;
    if (!item) return;
    item.dataset.active = "";
    if (focus) item.focus({ preventScroll: false });
  }

  function closeSubmenus(except?: HTMLElement) {
    for (const item of itemEls) {
      if (item === except) continue;
      const sub = submenus.get(item);
      if (sub?.isOpen()) {
        sub.close();
        item.setAttribute("aria-expanded", "false");
      }
    }
  }

  function openSubmenu(item: HTMLElement, opts: { instant?: boolean; focus?: "first" | "none" } = {}) {
    const sub = submenus.get(item);
    if (!sub || item.getAttribute("aria-disabled") === "true") return;
    closeSubmenus(item);
    if (!sub.isOpen()) {
      // Flip to the left if there's no room on the right.
      const bounds = el.closest(".panel")?.getBoundingClientRect() ?? { right: window.innerWidth };
      const room = bounds.right - el.getBoundingClientRect().right;
      sub.el.dataset.side = room < sub.el.offsetWidth + 16 || room < 180 ? "left" : "right";
      sub.open({ instant: opts.instant, focus: opts.focus ?? "none" });
      item.setAttribute("aria-expanded", "true");
    } else if (opts.focus === "first") {
      sub.open({ instant: true, focus: "first" });
    }
  }

  function select(item: HTMLElement) {
    const spec = specs.get(item);
    if (!spec || item.getAttribute("aria-disabled") === "true") return;
    if (submenus.has(item)) {
      settle.cancel();
      openSubmenu(item, { focus: "first" });
      return;
    }
    options.onSelect?.(spec);
  }

  // Pointer: highlight now, open/close submenus once the pointer rests -------

  const settle = debounce((item: HTMLElement) => {
    if (submenus.has(item)) openSubmenu(item);
    else closeSubmenus();
  }, DEBOUNCE_MS);

  el.addEventListener("pointermove", (event) => {
    const item = ownItem(event.target);
    if (!item) return;
    const inNested = item !== (event.target as Element).closest(".menu__item");
    if (inNested) {
      // In this item's open submenu: keep it, drop any pending change.
      settle.cancel();
      setActive(item, false);
      return;
    }
    if (item.dataset.active === undefined || document.activeElement !== item) setActive(item);
    if (item.getAttribute("aria-disabled") === "true") return;
    settle(item);
  });

  el.addEventListener("pointerleave", () => {
    settle.cancel();
    if (!itemEls.some((item) => submenus.get(item)?.isOpen())) setActive(null, false);
  });

  el.addEventListener("click", (event) => {
    const item = ownItem(event.target);
    if (!item || item !== (event.target as Element).closest(".menu__item")) return;
    select(item);
  });

  // Keyboard ---------------------------------------------------------------------

  let typed = "";
  const resetTyped = debounce(() => {
    typed = "";
  }, DEBOUNCE_MS);

  el.addEventListener("keydown", (event) => {
    const item = ownItem(event.target);
    // Keys pressed inside a nested menu belong to that menu.
    if (!item || item !== (event.target as Element).closest(".menu__item")) return;
    const list = enabled();
    const index = list.indexOf(item);
    const move = (to: number) => setActive(list[(to + list.length) % list.length]);

    switch (event.key) {
      case "ArrowDown":
        move(index + 1);
        break;
      case "ArrowUp":
        move(index - 1);
        break;
      case "Home":
        move(0);
        break;
      case "End":
        move(list.length - 1);
        break;
      case "Enter":
      case " ":
        select(item);
        break;
      case "ArrowRight":
        if (!submenus.has(item)) return;
        openSubmenu(item, { instant: true, focus: "first" });
        break;
      case "ArrowLeft":
      case "Escape":
        if (parentItem) {
          close({ instant: true });
          parentItem.setAttribute("aria-expanded", "false");
          parentItem.focus();
        } else if (event.key === "Escape") {
          options.onEscape?.();
        } else return;
        break;
      default: {
        if (event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) return;
        typed += event.key.toLowerCase();
        resetTyped();
        const start = typed.length === 1 ? index + 1 : index;
        const ordered = [...list.slice(start), ...list.slice(0, start)];
        const match = ordered.find((option) => specs.get(option)?.label.toLowerCase().startsWith(typed));
        if (match) setActive(match);
      }
    }
    event.preventDefault();
    event.stopPropagation();
  });

  // Open / close (floating menus) -------------------------------------------------

  let hideTimer = 0;

  function open(opts: { instant?: boolean; focus?: "first" | "selected" | "none" } = {}) {
    window.clearTimeout(hideTimer);
    if (options.floating) {
      if (opts.instant) el.dataset.instant = "";
      else delete el.dataset.instant;
      if (el.hidden) {
        el.hidden = false;
        el.dataset.state = "closed";
        void el.offsetWidth; // start the transition from the closed state
      }
      el.dataset.state = "open";
    }
    const list = enabled();
    const target =
      opts.focus === "selected"
        ? (list.find((item) => item.getAttribute("aria-selected") === "true") ?? list[0])
        : opts.focus === "first"
          ? list[0]
          : null;
    if (target) setActive(target);
  }

  function close(opts: { instant?: boolean } = {}) {
    settle.cancel();
    closeSubmenus();
    setActive(null, false);
    if (!options.floating) return;
    if (opts.instant) el.dataset.instant = "";
    else delete el.dataset.instant;
    el.dataset.state = "closed";
    window.clearTimeout(hideTimer);
    // Hide once the (shorter) exit transition has run; a reopen cancels this.
    hideTimer = window.setTimeout(() => {
      if (el.dataset.state === "closed") el.hidden = true;
    }, opts.instant ? 0 : 160);
  }

  function setSelected(value: string) {
    for (const item of itemEls) {
      const on = specs.get(item)?.value === value;
      item.setAttribute("aria-selected", String(on));
      const check = item.querySelector<SVGElement>(".menu__trail");
      if (check) check.style.visibility = on ? "" : "hidden";
    }
  }

  return {
    el,
    open,
    close,
    isOpen: () => !options.floating || el.dataset.state === "open",
    setSelected,
  };
}
