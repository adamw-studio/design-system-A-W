/**
 * Composition: a small poster of shades the user picked, to see existing
 * colors side by side. Drag (or Shift+←/→) to reorder; × or Delete removes.
 */
import type { Family, Shade } from "./data";
import { hexLabel, opacityPercent } from "./data";
import { ICONS, el, paint, type PaletteContext } from "./shared";
import { SPRING, flip, prefersReducedMotion } from "../../lib/motion";
import { showToast } from "../../lib/toast";

export const MAX_COMPOSITION = 6;

export function createComposition(getCtx: () => PaletteContext, initial: string[], onChange: (ids: string[]) => void) {
  let order = [...initial];

  const section = el("section", "composition");
  section.id = "composition";
  section.setAttribute("aria-labelledby", "composition-title");

  const head = el("header", "composition__head");
  const titles = el("div", "composition__titles");
  const title = el("h2", "composition__title text-heading-medium", "Composition");
  title.id = "composition-title";
  const hint = el("p", "composition__hint text-body-medium");
  titles.append(title, hint);

  const tools = el("div", "composition__tools");
  const copyAll = el("button", "composition__tool text-body-large", "Copy variables");
  copyAll.type = "button";
  copyAll.addEventListener("click", async () => {
    const text = order.map((id) => `var(${find(id)?.shade.cssVar})`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      showToast({ message: `Copied ${order.length} variables` });
    } catch {
      showToast({ message: "Couldn't copy to the clipboard" });
    }
  });
  const clear = el("button", "composition__tool text-body-large", "Clear");
  clear.type = "button";
  clear.addEventListener("click", () => {
    order = [];
    render();
    onChange(order);
  });
  tools.append(copyAll, clear);
  head.append(titles, tools);

  const poster = el("div", "composition__poster");
  poster.setAttribute("role", "list");
  section.append(head, poster);

  function find(id: string): { shade: Shade; family: Family } | undefined {
    for (const family of getCtx().families) {
      const shade = family.shades.find((s) => s.figmaName === id);
      if (shade) return { shade, family };
    }
  }

  const blocks = new Map<string, HTMLElement>();

  function render() {
    const { mode } = getCtx();
    order = order.filter((id) => find(id));
    blocks.clear();
    hint.textContent = order.length
      ? `${order.length} of ${MAX_COMPOSITION} · drag to rearrange`
      : `Pick up to ${MAX_COMPOSITION} shades with + to see them together`;
    copyAll.disabled = clear.disabled = order.length === 0;

    if (!order.length) {
      poster.replaceChildren(el("p", "composition__empty text-body-large", "Hover any specimen and press + to start a composition."));
      return;
    }

    poster.replaceChildren(
      ...order.map((id, i) => {
        const { shade, family } = find(id)!;
        const hex = shade.values[mode];
        const block = el("div", "composition__block");
        block.setAttribute("role", "listitem");
        block.tabIndex = 0;
        block.dataset.id = id;
        if (family.backdrop) block.dataset.backdrop = family.backdrop;
        paint(block, shade, family, mode);
        block.setAttribute(
          "aria-label",
          `${family.label} ${shade.step}, position ${i + 1} of ${order.length}. Enter opens, Shift+arrows move, Delete removes`,
        );
        block.append(
          el("span", "composition__step", shade.step),
          el("span", "composition__name", family.label),
          el("span", "composition__value", family.backdrop ? `${opacityPercent(hex)}%` : hexLabel(hex)),
        );
        const remove = el("button", "composition__remove");
        remove.type = "button";
        remove.innerHTML = ICONS.close;
        remove.setAttribute("aria-label", `Remove ${family.label} ${shade.step}`);
        remove.addEventListener("click", (e) => {
          e.stopPropagation();
          removeId(id);
        });
        block.append(remove);
        wireDrag(block, id);
        blocks.set(id, block);
        return block;
      }),
    );
  }

  /** Updates position wording without rebuilding (keeps running animations). */
  function relabel() {
    order.forEach((id, i) => {
      const found = find(id);
      const block = blocks.get(id);
      if (!found || !block) return;
      block.setAttribute(
        "aria-label",
        `${found.family.label} ${found.shade.step}, position ${i + 1} of ${order.length}. Enter opens, Shift+arrows move, Delete removes`,
      );
    });
  }

  function removeId(id: string) {
    const f = flip([...blocks.values()]);
    order = order.filter((x) => x !== id);
    render();
    f.play();
    onChange(order);
  }

  function move(id: string, delta: number) {
    const from = order.indexOf(id);
    const to = from + delta;
    if (to < 0 || to >= order.length) return;
    const f = flip([...blocks.values()]);
    order.splice(to, 0, order.splice(from, 1)[0]);
    render();
    f.play();
    blocks.get(id)?.focus();
    onChange(order);
  }

  function wireDrag(block: HTMLElement, id: string) {
    let startX = 0;
    let moved = false;
    let active = false;

    block.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const found = find(id);
        if (found) getCtx().open(found.shade, block);
      } else if (e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
        move(id, e.key === "ArrowLeft" ? -1 : 1);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeId(id);
      }
    });

    block.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest(".composition__remove")) return;
      active = true;
      moved = false;
      startX = e.clientX;
      block.setPointerCapture(e.pointerId);
    });

    block.addEventListener("pointermove", (e) => {
      if (!active) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) < 4) return;
      moved = true;
      block.classList.add("is-dragging");
      block.style.transform = `translateX(${dx}px)`;

      // Where would the pointer drop it? Compare against siblings' layout centres.
      const posterLeft = poster.getBoundingClientRect().left;
      const others = order.filter((x) => x !== id).map((x) => blocks.get(x)!);
      const target = others.filter((o) => posterLeft + o.offsetLeft + o.offsetWidth / 2 < e.clientX).length;
      if (target === order.indexOf(id)) return;

      // Reorder visually with CSS `order` — moving the dragged node in the DOM
      // would drop its pointer capture mid-drag.
      const f = flip(others);
      const oldLeft = block.offsetLeft;
      order = order.filter((x) => x !== id);
      order.splice(target, 0, id);
      order.forEach((x, i) => (blocks.get(x)!.style.order = String(i)));
      f.play();
      startX += block.offsetLeft - oldLeft;
      block.style.transform = `translateX(${e.clientX - startX}px)`;
    });

    const end = () => {
      if (!active) return;
      active = false;
      if (!moved) {
        const found = find(id);
        if (found) getCtx().open(found.shade, block);
        return;
      }
      const current = block.style.transform;
      // Commit the visual order to the DOM now that capture is no longer needed.
      poster.append(...order.map((x) => blocks.get(x)!));
      blocks.forEach((b) => (b.style.order = ""));
      block.style.transform = "";
      block.classList.remove("is-dragging");
      if (!prefersReducedMotion()) {
        block.animate([{ transform: current }, { transform: "none" }], { duration: SPRING.duration, easing: SPRING.easing });
      }
      relabel();
      onChange(order);
    };
    block.addEventListener("pointerup", end);
    block.addEventListener("pointercancel", end);
    block.addEventListener("lostpointercapture", end);
  }

  function add(shade: Shade): "added" | "exists" | "full" {
    if (order.includes(shade.figmaName)) return "exists";
    if (order.length >= MAX_COMPOSITION) return "full";
    const f = flip([...blocks.values()]);
    order.push(shade.figmaName);
    render();
    f.play();
    const block = blocks.get(shade.figmaName);
    if (block && !prefersReducedMotion()) {
      block.animate([{ opacity: 0, transform: "translateY(24px) scale(0.96)" }, { opacity: 1, transform: "none" }], {
        duration: SPRING.duration,
        easing: SPRING.easing,
      });
    }
    onChange(order);
    return "added";
  }

  render();
  return { el: section, add, refresh: render, has: (id: string) => order.includes(id) };
}
