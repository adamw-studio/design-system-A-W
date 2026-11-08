/**
 * Resizable sidebar: drag the edge between the sidebar and the content panel
 * (the .sidebar-resizer handle in index.html).
 *
 * - The width lives in --layout-sidebar-width on <html>, so the sidebar, the
 *   panel and the floating theme toggle (centered over the panel) all follow.
 *   While dragging, though, each frame writes the sidebar's (and toggle's)
 *   own inline styles instead: changing a variable on <html> restyles the
 *   whole page (15ms a frame on the Icons page, vs ~1ms). The variable is
 *   set once, on release.
 * - It stays between --layout-sidebar-min and --layout-sidebar-max
 *   (layout.css). Dragging past a limit meets increasing resistance instead
 *   of a hard stop, and eases back to the limit on release.
 * - Keyboard: it's a focusable separator. Arrow Left/Right resize by 16px
 *   (48px with Shift), Home/End jump to the limits, Enter resets. Keyboard
 *   changes are instant, not animated.
 * - Double-click resets to the default (Figma's 292px).
 * - The width is saved; an inline script in index.html applies it before
 *   first paint.
 */
const STORAGE_KEY = "aw-sidebar-width";
const STEP = 16;
const BIG_STEP = 48;
/** How far past a limit the edge can be pulled, at most. */
const MAX_OVERSHOOT = 32;
/** Settle-back duration; matches the transition in layout.css. */
const SETTLE_MS = 200;

export function initSidebarResize(handle: HTMLElement) {
  const root = document.documentElement;
  const readPx = (name: string) => parseFloat(getComputedStyle(root).getPropertyValue(name));

  // The default comes from layout.css; read it without the saved override.
  const saved = root.style.getPropertyValue("--layout-sidebar-width");
  root.style.removeProperty("--layout-sidebar-width");
  const DEFAULT = readPx("--layout-sidebar-width");
  if (saved) root.style.setProperty("--layout-sidebar-width", saved);
  const MIN = readPx("--layout-sidebar-min");
  const MAX = readPx("--layout-sidebar-max");

  const clamp = (w: number) => Math.round(Math.min(MAX, Math.max(MIN, w)));

  /** Past a limit, each extra pixel moves the edge less (rubber band). */
  const damp = (w: number) => {
    if (w > MAX) return MAX + MAX_OVERSHOOT * (1 - Math.exp(-(w - MAX) / (MAX_OVERSHOOT * 4)));
    if (w < MIN) return MIN - MAX_OVERSHOOT * (1 - Math.exp(-(MIN - w) / (MAX_OVERSHOOT * 4)));
    return w;
  };

  let width = clamp(readPx("--layout-sidebar-width") || DEFAULT);
  const sidebar = document.getElementById("sidebar");
  const toggle = document.querySelector<HTMLElement>(".theme-toggle");

  function paint(w: number) {
    root.style.setProperty("--layout-sidebar-width", `${w}px`);
  }

  /** Per-frame drag preview: only the elements that move. */
  function paintDrag(w: number) {
    if (sidebar) sidebar.style.flexBasis = sidebar.style.width = `${w}px`;
    if (toggle) toggle.style.left = `calc(${w}px + (100vw - ${w}px - var(--layout-gutter)) / 2)`;
  }

  function clearDrag() {
    if (sidebar) sidebar.style.flexBasis = sidebar.style.width = "";
    if (toggle) toggle.style.left = "";
  }

  function commit(w: number, opts: { settle?: boolean } = {}) {
    width = clamp(w);
    if (opts.settle) {
      root.classList.add("is-sidebar-settling");
      window.setTimeout(() => root.classList.remove("is-sidebar-settling"), SETTLE_MS + 20);
    }
    // Same frame: the variable takes over from the drag's inline styles, so
    // a settle-back transitions from where the edge was let go.
    paint(width);
    clearDrag();
    handle.setAttribute("aria-valuenow", String(width));
    handle.setAttribute("aria-valuetext", `${width} pixels wide`);
    try {
      if (width === DEFAULT) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, String(width));
    } catch {
      // Private mode etc.: the width just won't persist.
    }
  }

  handle.setAttribute("aria-valuemin", String(MIN));
  handle.setAttribute("aria-valuemax", String(MAX));
  commit(width);

  // Pointer ------------------------------------------------------------------------

  let startX = 0;
  let startWidth = 0;
  let pending = 0;
  let frame = 0;
  let dragging = false;

  handle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    dragging = true;
    startX = event.clientX;
    startWidth = width;
    pending = width;
    root.classList.add("is-resizing-sidebar");
  });

  handle.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    pending = startWidth + (event.clientX - startX);
    // One style update per frame, however fast the pointer reports.
    if (!frame) {
      frame = requestAnimationFrame(() => {
        frame = 0;
        paintDrag(Math.round(damp(pending)));
      });
    }
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    cancelAnimationFrame(frame);
    frame = 0;
    root.classList.remove("is-resizing-sidebar");
    // Pulled past a limit: ease back to it.
    commit(pending, { settle: pending !== clamp(pending) });
  };
  handle.addEventListener("pointerup", endDrag);
  handle.addEventListener("pointercancel", endDrag);
  handle.addEventListener("lostpointercapture", endDrag);

  handle.addEventListener("dblclick", () => commit(DEFAULT, { settle: true }));

  // Keyboard -----------------------------------------------------------------------

  handle.addEventListener("keydown", (event) => {
    const step = event.shiftKey ? BIG_STEP : STEP;
    let next: number | null = null;
    if (event.key === "ArrowLeft") next = width - step;
    else if (event.key === "ArrowRight") next = width + step;
    else if (event.key === "Home") next = MIN;
    else if (event.key === "End") next = MAX;
    else if (event.key === "Enter") next = DEFAULT;
    if (next === null) return;
    event.preventDefault();
    commit(next);
  });
}
