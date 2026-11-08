/**
 * Dropdown enhancement for src/styles/components/dropdown.css.
 *
 * The markup is a native <select> (works without JavaScript and in forms).
 * enhanceDropdown() keeps that select as the source of the value but hides
 * it, and puts a trigger button in its place that opens the options in a
 * floating Menu (src/lib/menu.ts) as a listbox:
 * - opens below the trigger (above if there's no room), scaling from it;
 * - animates when opened with the pointer, appears instantly from the
 *   keyboard (Enter, Space, Arrow keys);
 * - type-ahead and arrow keys inside; Escape, Tab or a click outside close
 *   it; choosing an option updates the select and fires its change event.
 */
import { createMenu } from "./menu";

let uid = 0;

export function enhanceDropdown(wrap: HTMLElement) {
  const found = wrap.querySelector<HTMLSelectElement>("select.dropdown__select");
  if (!found || wrap.dataset.enhanced !== undefined) return;
  const select: HTMLSelectElement = found;
  wrap.dataset.enhanced = "";
  const id = `dropdown-${++uid}`;

  // Name: the visible <label for>, else the select's aria-label.
  // Look next to the dropdown first, so it also works before it's in the page.
  const labelFor = `label[for="${select.id}"]`;
  const visibleLabel = select.id
    ? (wrap.parentElement?.querySelector<HTMLLabelElement>(labelFor) ?? document.querySelector<HTMLLabelElement>(labelFor))
    : null;
  const labelText = visibleLabel?.textContent?.trim() ?? select.getAttribute("aria-label") ?? "";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "dropdown__trigger";
  trigger.id = `${id}-trigger`;
  trigger.disabled = select.disabled;
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");

  const value = document.createElement("span");
  value.className = "dropdown__value";
  value.id = `${id}-value`;
  trigger.append(value);

  // Read as "<label>, <value>, collapsed".
  let labelId = visibleLabel?.id;
  if (visibleLabel && !labelId) labelId = visibleLabel.id = `${id}-label`;
  if (!visibleLabel) {
    const hidden = document.createElement("span");
    hidden.className = "visually-hidden";
    hidden.id = labelId = `${id}-label`;
    hidden.textContent = labelText;
    wrap.append(hidden);
  }
  trigger.setAttribute("aria-labelledby", `${labelId} ${value.id}`);
  if (visibleLabel) visibleLabel.htmlFor = trigger.id;

  const options = Array.from(select.options);
  const menu = createMenu(
    options.map((option) => ({
      label: option.text,
      value: option.value,
      disabled: option.disabled,
      selected: option.selected,
    })),
    {
      role: "listbox",
      floating: true,
      label: labelText,
      onSelect: (item) => {
        if (item.value !== undefined && item.value !== select.value) {
          select.value = item.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
        sync();
        close();
        trigger.focus();
      },
      onEscape: () => {
        close();
        trigger.focus();
      },
    },
  );
  trigger.setAttribute("aria-controls", menu.el.id);

  function sync() {
    value.textContent = select.selectedOptions[0]?.text ?? "";
    menu.setSelected(select.value);
  }

  function open(instant: boolean) {
    // Below the trigger, or above it when the panel has no room below.
    const bounds = wrap.closest(".panel")?.getBoundingClientRect() ?? { bottom: window.innerHeight };
    menu.el.hidden = false;
    const below = bounds.bottom - wrap.getBoundingClientRect().bottom;
    menu.el.dataset.side = below < menu.el.offsetHeight + 16 ? "top" : "bottom";
    menu.open({ instant, focus: "selected" });
    trigger.setAttribute("aria-expanded", "true");
  }

  function close(opts: { instant?: boolean } = {}) {
    if (!menu.isOpen()) return;
    menu.close(opts);
    trigger.setAttribute("aria-expanded", "false");
  }

  // A click from the keyboard (Enter/Space) has detail 0: open instantly.
  trigger.addEventListener("click", (event) => {
    if (menu.isOpen()) close();
    else open(event.detail === 0);
  });
  trigger.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    open(true);
  });

  document.addEventListener("pointerdown", (event) => {
    if (menu.isOpen() && !wrap.contains(event.target as Node)) close();
  });
  wrap.addEventListener("focusout", (event) => {
    if (menu.isOpen() && !wrap.contains(event.relatedTarget as Node | null)) close({ instant: true });
  });
  select.addEventListener("change", sync);

  // Swap the native control for the trigger; keep the select for forms.
  select.hidden = true;
  select.tabIndex = -1;
  select.setAttribute("aria-hidden", "true");
  select.before(trigger);
  wrap.append(menu.el);
  sync();
}
