/**
 * Expanded specimen: a large "collectible" card for one shade. Opens from
 * the clicked card with a FLIP expansion; Escape or clicking outside closes.
 * ← / → step through the family.
 */
import type { Family, Shade } from "./data";
import { contrastOn, hexLabel, opacityPercent, rgbCss, rgbLabel, wcagLevel } from "./data";
import { ICONS, el, paint, type PaletteContext } from "./shared";
import { SPRING_SOFT, prefersReducedMotion } from "../../lib/motion";

export function createDetail(getCtx: () => PaletteContext) {
  const dialog = el("dialog", "specimen-dialog");
  dialog.setAttribute("aria-labelledby", "specimen-title");
  const card = el("article", "specimen");
  dialog.append(card);
  document.body.append(dialog);

  let family: Family;
  let index = 0;
  let source: HTMLElement | null = null;
  let closing = false;

  const ctx = () => getCtx();

  function render(direction = 0) {
    const { mode } = ctx();
    const shade = family.shades[index];
    const hex = shade.values[mode];
    dialog.dataset.theme = mode;
    if (family.backdrop) card.dataset.backdrop = family.backdrop;
    else delete card.dataset.backdrop;

    // Color field
    const field = el("div", "specimen__field");
    paint(field, shade, family, mode);
    const title = el("h2", "specimen__family text-heading-display", family.label);
    title.id = "specimen-title";
    field.append(
      title,
      el("span", "specimen__step", shade.step),
      el("span", "specimen__figma", `${shade.figmaName} · ${String(index + 1).padStart(2, "0")}/${family.shades.length}`),
    );

    const close = el("button", "specimen__close");
    close.type = "button";
    close.innerHTML = ICONS.close;
    close.setAttribute("aria-label", "Close");
    close.addEventListener("click", () => hide());
    field.append(close);

    // Metadata
    const meta = el("dl", "specimen__meta");
    const row = (label: string, value: string | HTMLElement, copy?: () => void) => {
      const wrap = el("div", "specimen__row");
      const dd = el("dd");
      if (copy) {
        const button = el("button", "specimen__copy");
        button.type = "button";
        const icon = el("span", "specimen__copy-icon");
        icon.innerHTML = ICONS.copy;
        button.append(value, icon);
        button.setAttribute("aria-label", `Copy ${label}: ${typeof value === "string" ? value : value.textContent}`);
        button.addEventListener("click", copy);
        dd.append(button);
      } else dd.append(value);
      wrap.append(el("dt", "", label), dd);
      meta.append(wrap);
    };

    const c = ctx();
    row("CSS variable", `var(${shade.cssVar})`, () => c.copy(shade, "var"));
    row("HEX", `#${hexLabel(hex)}`, () => c.copy(shade, "hex"));
    row("RGB", family.backdrop ? rgbCss(hex) : rgbLabel(hex), () => c.copy(shade, "rgb"));
    row("Opacity", `${opacityPercent(hex)}%`);

    // Both modes side by side; each chip resolves the variable in its own theme.
    const modes = el("span", "specimen__modes");
    for (const m of ["light", "dark"] as const) {
      const item = el("span", "specimen__mode");
      if (m === mode) item.classList.add("is-current");
      const chip = el("span", "specimen__mode-chip");
      chip.dataset.theme = m;
      chip.style.setProperty("--shade", `var(${shade.cssVar})`);
      item.append(chip, `${m === "light" ? "Light" : "Dark"} ${hexLabel(shade.values[m])}`);
      modes.append(item);
    }
    row(shade.values.light === shade.values.dark ? "Light / Dark (same)" : "Light / Dark", modes);

    const contrast = (ground: "white" | "black") => {
      const r = contrastOn(hex, ground);
      return `${r.toFixed(2)}:1 ${wcagLevel(r)}`;
    };
    row("Contrast on white", contrast("white"));
    row("Contrast on black", contrast("black"));

    // Shade rail + actions
    const footer = el("div", "specimen__footer");
    const rail = el("ol", "specimen__rail");
    family.shades.forEach((s, i) => {
      const item = el("li");
      const chip = el("button", "specimen__rail-chip");
      chip.type = "button";
      chip.style.setProperty("--shade", `var(${s.cssVar})`);
      chip.setAttribute("aria-label", `${family.label} ${s.step}`);
      chip.title = s.step;
      if (i === index) chip.setAttribute("aria-current", "true");
      chip.addEventListener("click", () => go(i));
      item.append(chip);
      rail.append(item);
    });

    const nav = el("div", "specimen__nav");
    const prev = el("button", "specimen__icon-button");
    prev.type = "button";
    prev.innerHTML = ICONS.prev;
    prev.setAttribute("aria-label", "Previous shade");
    prev.disabled = index === 0;
    prev.addEventListener("click", () => go(index - 1));
    const next = el("button", "specimen__icon-button");
    next.type = "button";
    next.innerHTML = ICONS.next;
    next.setAttribute("aria-label", "Next shade");
    next.disabled = index === family.shades.length - 1;
    next.addEventListener("click", () => go(index + 1));
    const add = el("button", "specimen__add text-body-large");
    add.type = "button";
    add.innerHTML = `${ICONS.add}<span>Add to composition</span>`;
    add.addEventListener("click", () => c.add(shade));
    nav.append(prev, next, add);

    footer.append(rail, nav);

    const focusedRail = card.contains(document.activeElement) && document.activeElement?.classList.contains("specimen__rail-chip");
    card.replaceChildren(field, meta, footer);
    if (focusedRail) (rail.children[index]?.firstElementChild as HTMLElement | null)?.focus();

    if (direction && !prefersReducedMotion()) {
      field.animate(
        [{ transform: `translateX(${direction * 18}px)`, opacity: 0.4 }, { transform: "none", opacity: 1 }],
        { duration: 280, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
      );
    }
  }

  function go(i: number) {
    if (i < 0 || i >= family.shades.length || i === index) return;
    const direction = i > index ? 1 : -1;
    index = i;
    render(direction);
  }

  function open(shade: Shade, from: HTMLElement) {
    family = ctx().families.find((f) => f.name === shade.family)!;
    index = shade.index;
    source = from;
    closing = false;
    render();
    dialog.showModal();
    (card.querySelector(".specimen__close") as HTMLElement)?.focus();

    if (prefersReducedMotion()) return;
    const from_ = from.getBoundingClientRect();
    const to = card.getBoundingClientRect();
    card.animate(
      [
        {
          transform: `translate(${from_.left - to.left}px, ${from_.top - to.top}px) scale(${from_.width / to.width}, ${from_.height / to.height})`,
          borderRadius: "13px",
        },
        { transform: "none" },
      ],
      { duration: SPRING_SOFT.duration, easing: SPRING_SOFT.easing, fill: "backwards" },
    );
    card.querySelectorAll(".specimen__meta, .specimen__footer, .specimen__field > *").forEach((n, i) =>
      (n as HTMLElement).animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], {
        duration: 260,
        delay: 120 + i * 25,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        fill: "backwards",
      }),
    );
    dialog.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, pseudoElement: "::backdrop" });
  }

  async function hide() {
    if (closing || !dialog.open) return;
    closing = true;
    const target = source?.isConnected ? source.getBoundingClientRect() : null;
    if (!prefersReducedMotion()) {
      const now = card.getBoundingClientRect();
      const frames: Keyframe[] = target
        ? [
            { transform: "none", opacity: 1 },
            {
              transform: `translate(${target.left - now.left}px, ${target.top - now.top}px) scale(${target.width / now.width}, ${target.height / now.height})`,
              opacity: 0.6,
            },
          ]
        : [{ transform: "none", opacity: 1 }, { transform: "scale(0.96)", opacity: 0 }];
      card.querySelectorAll(".specimen__meta, .specimen__footer, .specimen__field > *").forEach((n) =>
        (n as HTMLElement).animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "forwards" }),
      );
      dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, pseudoElement: "::backdrop", fill: "forwards" });
      await card.animate(frames, { duration: 260, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" }).finished.catch(() => {});
    }
    dialog.close();
    card.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    dialog.getAnimations().forEach((a) => a.cancel());
    if (source?.isConnected) (source.querySelector("button") ?? source).focus({ preventScroll: true });
    closing = false;
  }

  // Escape (native "cancel") and clicks on the backdrop close with animation.
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    hide();
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) hide();
  });
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index - 1);
    }
  });

  return {
    open,
    /** Re-render in place, e.g. after the mode changes. */
    refresh: () => dialog.open && render(),
    destroy: () => dialog.remove(),
  };
}
