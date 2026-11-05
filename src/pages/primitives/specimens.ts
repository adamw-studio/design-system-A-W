/**
 * Specimen view: each family is shown as an "exhibit" using one of three
 * compositions — a stack of offset cards, horizontal strips, or an
 * oversized block with a shade rail.
 */
import type { Family, Shade } from "./data";
import { hexLabel, opacityPercent, rgbLabel } from "./data";
import { el, longValue, paint, shadeActions, shortValue, type PaletteContext } from "./shared";
import { prefersReducedMotion } from "../../lib/motion";

type Composition = "stack" | "strips" | "block";

/** Neutrals read best as a ramp; the rest alternate stacks and blocks. */
const COMPOSITION: Record<string, Composition> = {
  grey: "strips",
  black: "stack",
  white: "stack",
  red: "stack",
  orange: "block",
  green: "stack",
  yellow: "block",
};

export function renderSpecimens(ctx: PaletteContext): { el: HTMLElement; destroy: () => void } {
  const root = el("div", "specimens");
  const cleanups: (() => void)[] = [];

  ctx.families.forEach((family, i) => {
    const section = el("section", "family");
    section.id = `family-${family.name}`;
    section.dataset.family = family.name;
    if (family.backdrop) section.dataset.backdrop = family.backdrop;

    const head = el("header", "family__head");
    const titleId = `family-title-${family.name}`;
    const index = el("span", "family__index", `${String(i + 1).padStart(2, "0")} / ${String(ctx.families.length).padStart(2, "0")}`);
    const name = el("h2", "family__name text-heading-display", family.label);
    name.id = titleId;
    const meta = el("p", "family__meta text-body-medium");
    meta.textContent = [
      `${family.shades.length} shades`,
      family.backdrop ? "Transparent" : "Solid",
      family.shiftsInDark ? "Shifts in dark mode" : null,
    ]
      .filter(Boolean)
      .join(" · ");
    head.append(index, name, meta);
    section.setAttribute("aria-labelledby", titleId);

    const composition = COMPOSITION[family.name] ?? "stack";
    let body: HTMLElement;
    if (composition === "strips") body = strips(family, ctx);
    else if (composition === "block") body = block(family, ctx);
    else {
      const stackView = stack(family, ctx);
      cleanups.push(stackView.destroy);
      body = stackView.el;
    }

    section.append(head, body);
    root.append(section);
  });

  return { el: root, destroy: () => cleanups.forEach((fn) => fn()) };
}

// ---------- Stack: offset cards that fan out ---------------------------------

const CARD_W = 132;
const COMPACT_STEP = 36;
const MIN_STEP = 40; // narrow screens scroll instead of squeezing
const CASCADE = 6;
const LIFT = 14;
const GAP = 6;

function stack(family: Family, ctx: PaletteContext) {
  const scroller = el("div", "stack-scroller");
  const wrap = el("div", "stack");
  scroller.append(wrap);
  const n = family.shades.length;

  const cards = family.shades.map((shade) => stackCard(shade, family, ctx));
  wrap.append(...cards);

  let hovered: number | null = null;
  let spread = false;

  const stackWidth = () => Math.max(wrap.clientWidth, CARD_W + (n - 1) * MIN_STEP);

  /**
   * Target x position of every card. Later cards sit on top, so each card
   * shows a strip on its left (where its step number is). Hovering opens an
   * accordion: the hovered card shows in full, every other card keeps a strip.
   */
  function positions(h: number | null, open: boolean): number[] {
    const width = stackWidth();
    if (h === null) {
      const step = open ? (width - CARD_W) / (n - 1) : COMPACT_STEP;
      return cards.map((_, i) => i * step);
    }
    const strip = (width - 2 * CARD_W - GAP) / (n - 2);
    const xs = [0];
    for (let i = 1; i < n; i++) xs.push(xs[i - 1] + (i - 1 === h ? CARD_W + GAP : strip));
    return xs;
  }

  /** Topmost card whose target region contains x (later cards are on top). */
  function hitTest(x: number, xs: number[]) {
    for (let i = n - 1; i > 0; i--) if (x >= xs[i]) return i;
    return 0;
  }

  function layout() {
    const xs = positions(hovered, spread);
    cards.forEach((card, i) => {
      const y = i * CASCADE - (i === hovered ? LIFT : 0);
      card.style.transform = `translate(${xs[i]}px, ${y}px)`;
      card.style.zIndex = String(i + 1);
      card.classList.toggle("is-active", i === hovered);
    });
    wrap.classList.toggle("is-open", spread || hovered !== null);
  }

  cards.forEach((card, i) => {
    card.addEventListener("focusin", () => {
      hovered = i;
      spread = true;
      layout();
    });
  });
  // Hit-test against the *target* layout rather than the moving cards. The
  // accordion keeps the pointer inside the card it picked, so it can't flicker.
  wrap.addEventListener("pointermove", (e) => {
    const x = e.clientX - wrap.getBoundingClientRect().left;
    const next = hitTest(x, positions(hovered, true));
    if (next === hovered && spread) return;
    hovered = next;
    spread = true;
    layout();
  });
  wrap.addEventListener("pointerleave", () => {
    if (wrap.contains(document.activeElement)) return;
    hovered = null;
    spread = false;
    layout();
  });
  wrap.addEventListener("focusout", (e) => {
    if (wrap.contains(e.relatedTarget as Node)) return;
    hovered = null;
    spread = false;
    layout();
  });

  // Deal the cards in from a single pile on first render.
  wrap.classList.add("is-dealing");
  cards.forEach((card, i) => {
    card.style.transform = `translate(0px, ${i * CASCADE}px)`;
    card.style.zIndex = String(i + 1);
    card.style.transitionDelay = prefersReducedMotion() ? "0ms" : `${i * 28}ms`;
  });
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      layout();
      window.setTimeout(() => {
        wrap.classList.remove("is-dealing");
        cards.forEach((card) => (card.style.transitionDelay = ""));
      }, 600);
    }),
  );

  const observer = new ResizeObserver(() => layout());
  observer.observe(wrap);

  return { el: scroller, destroy: () => observer.disconnect() };
}

function stackCard(shade: Shade, family: Family, ctx: PaletteContext) {
  const card = el("div", "card");
  paint(card, shade, family, ctx.mode);

  const face = el("button", "card__face");
  face.type = "button";
  face.setAttribute("aria-label", `${family.label} ${shade.step}, ${shade.values[ctx.mode]}. Open specimen`);
  face.addEventListener("click", () => ctx.open(shade, card));

  face.append(
    el("span", "card__name", family.label),
    el("span", "card__value", shortValue(shade, family, ctx.mode)),
    el("span", "card__more", longValue(shade, family, ctx.mode)),
    el("span", "card__step", shade.step),
  );
  card.append(face, shadeActions(shade, ctx, `${family.label} ${shade.step}`));
  return card;
}

// ---------- Strips: a ramp of bands that open on hover -----------------------

function strips(family: Family, ctx: PaletteContext) {
  const list = el("ol", "strips");
  for (const shade of family.shades) {
    const item = el("li", "strip");
    paint(item, shade, family, ctx.mode);
    const hex = shade.values[ctx.mode];

    const main = el("button", "strip__main");
    main.type = "button";
    main.setAttribute("aria-label", `${family.label} ${shade.step}, ${hex}. Open specimen`);
    main.addEventListener("click", () => ctx.open(shade, item));

    const details = el("span", "strip__details");
    details.append(el("span", "", `RGB ${rgbLabel(hex)}`), el("span", "", `var(${shade.cssVar})`));

    main.append(
      el("span", "strip__step", shade.step),
      details,
      el("span", "strip__value", family.backdrop ? `${opacityPercent(hex)}%` : hexLabel(hex)),
    );
    item.append(main, shadeActions(shade, ctx, `${family.label} ${shade.step}`));
    list.append(item);
  }
  return list;
}

// ---------- Block: an oversized specimen with a shade rail -------------------

function block(family: Family, ctx: PaletteContext) {
  const root = el("div", "block");
  const anchor = family.shades.findIndex((s) => s.step === "500");
  let pinned = anchor >= 0 ? anchor : Math.floor(family.shades.length / 2);
  let current = pinned;

  const hero = el("div", "block__hero");
  const heroButton = el("button", "block__face");
  heroButton.type = "button";
  const label = el("span", "block__label");
  const values = el("span", "block__values");
  const step = el("span", "block__step");
  heroButton.append(label, values, step);
  heroButton.addEventListener("click", () => ctx.open(family.shades[current], hero));
  const actionsSlot = el("div", "block__actions");
  hero.append(heroButton, actionsSlot);

  const rail = el("ol", "block__rail");
  const chips = family.shades.map((shade, i) => {
    const item = el("li");
    const chip = el("button", "block__chip");
    chip.type = "button";
    paint(chip, shade, family, ctx.mode);
    chip.append(el("span", "", shade.step));
    chip.setAttribute("aria-label", `${family.label} ${shade.step}, ${shade.values[ctx.mode]}. Open specimen`);
    chip.addEventListener("pointerenter", () => show(i));
    chip.addEventListener("focus", () => show(i));
    chip.addEventListener("click", () => {
      pinned = i;
      show(i);
      ctx.open(shade, hero);
    });
    item.append(chip);
    rail.append(item);
    return chip;
  });
  root.addEventListener("pointerleave", () => show(pinned));
  root.addEventListener("focusout", (e) => {
    if (!root.contains(e.relatedTarget as Node)) show(pinned);
  });

  function show(i: number) {
    const changed = i !== current;
    current = i;
    const shade = family.shades[i];
    const hex = shade.values[ctx.mode];
    paint(hero, shade, family, ctx.mode);
    label.textContent = `${family.label} — ${shade.figmaName.replace("🎨/", "")}`;
    values.replaceChildren(
      el("span", "", `HEX ${hexLabel(hex)}`),
      el("span", "", family.backdrop ? `Opacity ${opacityPercent(hex)}%` : `RGB ${rgbLabel(hex)}`),
      el("span", "", `var(${shade.cssVar})`),
    );
    step.textContent = shade.step;
    heroButton.setAttribute("aria-label", `${family.label} ${shade.step}, ${hex}. Open specimen`);
    actionsSlot.replaceChildren(shadeActions(shade, ctx, `${family.label} ${shade.step}`));
    chips.forEach((c, j) => c.classList.toggle("is-current", j === i));
    if (changed && !prefersReducedMotion()) {
      step.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], {
        duration: 260,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      });
    }
  }

  show(current);
  root.append(hero, rail);
  return root;
}
