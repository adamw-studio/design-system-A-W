/**
 * Frosted top and bottom edges on the content panel (Figma "Design System -
 * Web", node 309:3325; styles: .panel__edge in layout.css).
 *
 * Each edge shows only when there's content past it: the top one once the
 * panel is scrolled down, the bottom one while there's more below. State is
 * set as data attributes on the panel; CSS fades the edges in and out.
 * Updates are batched to one per frame, and re-run when the page content
 * changes size (route changes, disclosures, the window resizing).
 */
export function initScrollFades(panel: HTMLElement) {
  let frame = 0;

  const update = () => {
    frame = 0;
    const { scrollTop, scrollHeight, clientHeight } = panel;
    panel.dataset.scrollTop = String(scrollTop > 1);
    panel.dataset.scrollBottom = String(scrollTop + clientHeight < scrollHeight - 1);
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  panel.addEventListener("scroll", schedule, { passive: true });
  const resize = new ResizeObserver(schedule);
  resize.observe(panel);
  const page = panel.querySelector(".page");
  if (page) resize.observe(page);
  update();
}
