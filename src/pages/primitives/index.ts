/**
 * Color Primitives page.
 *
 * Two views over the same, unchanged primitives:
 *  - Grid: the compact utility reference (default). Click copies.
 *  - Specimens: an exploratory, card-based exhibition of each family,
 *    with an expandable specimen view and a composition area.
 */
import { hexLabel, readFamilies, rgbCss, type Mode, type Shade } from "./data";
import { renderGrid } from "./grid";
import { renderSpecimens } from "./specimens";
import { createDetail } from "./detail";
import { createComposition, MAX_COMPOSITION } from "./composition";
import { el, type PaletteContext } from "./shared";
import { segmented } from "../../components/segmented";
import { showToast } from "../../lib/toast";
import { installMotionTokens, prefersReducedMotion } from "../../lib/motion";
import "../../styles/pages/primitives.css";
import "../../styles/pages/specimens.css";

type View = "grid" | "specimens";

const DEFAULT_COMPOSITION = ["🎨/grey/100", "🎨/red/500", "🎨/yellow/500", "🎨/green/700", "🎨/grey/1000"];

const storage = {
  get<T extends string>(key: string, fallback: T, allowed: readonly T[]): T {
    try {
      const value = localStorage.getItem(`aw.primitives.${key}`) as T | null;
      return value && allowed.includes(value) ? value : fallback;
    } catch {
      return fallback;
    }
  },
  getList(key: string, fallback: string[]): string[] {
    try {
      const value = JSON.parse(localStorage.getItem(`aw.primitives.${key}`) ?? "null");
      return Array.isArray(value) ? value.filter((v) => typeof v === "string") : fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: string | string[]) {
    try {
      localStorage.setItem(`aw.primitives.${key}`, typeof value === "string" ? value : JSON.stringify(value));
    } catch {
      /* storage unavailable — preferences just won't persist */
    }
  },
};

export function renderPrimitives(body: HTMLElement, actions: HTMLElement) {
  installMotionTokens();
  const families = readFamilies();
  let view = storage.get<View>("view", "grid", ["grid", "specimens"]);
  const mode = storage.get<Mode>("mode", "light", ["light", "dark"]);

  const ctx: PaletteContext = { mode, families, copy, open, add };

  // --- Header controls ------------------------------------------------------
  const viewSwitch = segmented<View>(
    "View",
    [
      { value: "grid", label: "Grid" },
      { value: "specimens", label: "Specimens" },
    ],
    view,
    setView,
  );
  const modeSwitch = segmented<Mode>(
    "Color mode",
    [
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark" },
    ],
    mode,
    setMode,
  );
  const controls = el("div", "page-controls");
  controls.append(viewSwitch.el, modeSwitch.el);
  actions.append(controls);

  // --- Family index ---------------------------------------------------------
  const index = el("nav", "family-index");
  index.setAttribute("aria-label", "Color families");
  for (const family of families) {
    const anchor = family.shades.find((s) => s.step === "500") ?? family.shades[0];
    const link = el("button", "family-index__item text-body-large");
    link.type = "button";
    const dot = el("span", "family-index__dot");
    dot.style.setProperty("--shade", `var(${anchor.cssVar})`);
    if (family.backdrop) dot.dataset.backdrop = family.backdrop;
    link.append(dot, family.label);
    link.addEventListener("click", () =>
      document.getElementById(`family-${family.name}`)?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      }),
    );
    index.append(link);
  }

  // --- Stage ----------------------------------------------------------------
  const stage = el("div", "palette-stage");
  body.append(index, stage);

  const detail = createDetail(() => ctx);
  const composition = createComposition(() => ctx, storage.getList("composition", DEFAULT_COMPOSITION), (ids) =>
    storage.set("composition", ids),
  );

  let destroyView = () => {};

  function mount(animate: boolean) {
    destroyView();
    stage.dataset.theme = ctx.mode;
    stage.dataset.view = view;

    if (view === "grid") {
      stage.replaceChildren(renderGrid(ctx));
      destroyView = () => {};
    } else {
      const specimens = renderSpecimens(ctx);
      composition.refresh();
      stage.replaceChildren(composition.el, specimens.el);
      destroyView = specimens.destroy;
    }

    if (animate && !prefersReducedMotion()) {
      stage.querySelectorAll<HTMLElement>(".palette, .composition, .family").forEach((node, i) =>
        node.animate([{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], {
          duration: 420,
          delay: Math.min(i, 6) * 45,
          easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
          fill: "backwards",
        }),
      );
    }
  }

  function setView(next: View) {
    view = next;
    storage.set("view", view);
    mount(true);
  }

  function setMode(next: Mode) {
    ctx.mode = next;
    storage.set("mode", next);
    mount(false);
  }

  // --- Shared actions ---------------------------------------------------------
  async function copy(shade: Shade, what: "var" | "hex" | "rgb" = "var") {
    const hex = shade.values[ctx.mode];
    const text = what === "hex" ? `#${hexLabel(hex)}` : what === "rgb" ? rgbCss(hex) : `var(${shade.cssVar})`;
    try {
      await navigator.clipboard.writeText(text);
      showToast({ message: `Copied ${text}`, swatch: hex });
    } catch {
      showToast({ message: "Couldn't copy to the clipboard" });
    }
  }

  function open(shade: Shade, source: HTMLElement) {
    detail.open(shade, source);
  }

  function add(shade: Shade) {
    const family = families.find((f) => f.name === shade.family)!;
    const name = `${family.label} ${shade.step}`;
    const result = composition.add(shade);
    const swatch = shade.values[ctx.mode];
    if (result === "added") {
      showToast({
        message: `Added ${name} to composition`,
        swatch,
        action: {
          label: "View",
          onClick: () => composition.el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" }),
        },
      });
    } else if (result === "exists") {
      showToast({ message: `${name} is already in the composition`, swatch });
    } else {
      showToast({ message: `The composition holds up to ${MAX_COMPOSITION} shades` });
    }
  }

  mount(false);

  return () => {
    destroyView();
    detail.destroy();
  };
}
