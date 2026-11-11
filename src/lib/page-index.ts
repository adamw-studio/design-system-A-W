/**
 * Index pill: a small inverse pill in the bottom-left corner of the content
 * panel (opposite the Theme / globe controls), shown once the page header
 * has scrolled away. It shows how far you've
 * read (a ring and a percentage) and opens a Menu of the page's sections;
 * choosing one scrolls to it and moves focus to its heading.
 *
 * Only pages with at least MIN_SECTIONS labelled sections get one (doc
 * sections, Typography's styles, Overview's essay). Markup is built here;
 * styles are .page-index in layout.css.
 */
import { createMenu, type Menu } from "./menu";
import { icon } from "./icon";

const MIN_SECTIONS = 3;
/** Sections the index lists: labelled <section>s inside the page body. */
const SECTION_SELECTOR = ".doc-section, .type-style, .overview-section";
/** Ring geometry (16px icon, 2px stroke). */
const RING_RADIUS = 6;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

interface Entry {
  section: HTMLElement;
  heading: HTMLElement;
  label: string;
}

export function initPageIndex(panel: HTMLElement, body: HTMLElement, header: HTMLElement) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Sticky, zero-height anchor at the end of the panel: the pill sits in its
  // bottom-left corner without taking up room in the page.
  const anchor = document.createElement("div");
  anchor.className = "page-index-anchor";
  const pill = document.createElement("div");
  pill.className = "page-index";
  pill.hidden = true;

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "page-index__trigger text-body-medium-strong";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");

  const svgNS = "http://www.w3.org/2000/svg";
  const ring = document.createElementNS(svgNS, "svg");
  ring.setAttribute("class", "page-index__ring");
  ring.setAttribute("viewBox", "0 0 16 16");
  ring.setAttribute("aria-hidden", "true");
  const track = document.createElementNS(svgNS, "circle");
  const bar = document.createElementNS(svgNS, "circle");
  for (const circle of [track, bar]) {
    circle.setAttribute("cx", "8");
    circle.setAttribute("cy", "8");
    circle.setAttribute("r", String(RING_RADIUS));
  }
  track.setAttribute("class", "page-index__ring-track");
  bar.setAttribute("class", "page-index__ring-bar");
  bar.setAttribute("stroke-dasharray", String(RING_LENGTH));
  ring.append(track, bar);

  const chevron = icon("nav-arrow-down", 12);
  chevron.classList.add("page-index__chevron");
  trigger.append(ring, document.createTextNode("Index"), chevron);

  const percent = document.createElement("span");
  percent.className = "page-index__percent text-body-medium-strong";
  percent.setAttribute("aria-hidden", "true");

  pill.append(trigger, percent);
  anchor.append(pill);
  panel.append(anchor);

  let entries: Entry[] = [];
  let menu: Menu | null = null;
  let current = -1;
  let frame = 0;

  function close(opts: { instant?: boolean } = {}) {
    if (!menu?.isOpen()) return;
    menu.close(opts);
    trigger.setAttribute("aria-expanded", "false");
  }

  function jumpTo(entry: Entry) {
    entry.section.scrollIntoView({ block: "start", behavior: reducedMotion.matches ? "auto" : "smooth" });
    entry.heading.tabIndex = -1;
    entry.heading.focus({ preventScroll: true });
  }

  /** Rebuild for the page that was just rendered. */
  function setup() {
    close({ instant: true });
    menu?.el.remove();
    menu = null;
    current = -1;
    entries = Array.from(body.querySelectorAll<HTMLElement>(SECTION_SELECTOR)).flatMap((section) => {
      const heading = section.querySelector<HTMLElement>("h2");
      const label = heading?.textContent?.trim();
      return heading && label ? [{ section, heading, label }] : [];
    });

    if (entries.length < MIN_SECTIONS) {
      pill.hidden = true;
      delete pill.dataset.visible;
      return;
    }
    pill.hidden = false;

    menu = createMenu(
      entries.map((entry, i) => ({ label: entry.label, value: String(i) })),
      {
        role: "listbox",
        floating: true,
        label: "Sections on this page",
        onSelect: (item) => {
          close();
          const entry = entries[Number(item.value)];
          if (entry) jumpTo(entry);
        },
        onEscape: () => {
          close();
          trigger.focus();
        },
      },
    );
    menu.el.classList.add("page-index__menu");
    trigger.setAttribute("aria-controls", menu.el.id);
    pill.append(menu.el);
    update();
  }

  /** Progress, current section and whether the pill shows. */
  function update() {
    frame = 0;
    if (!entries.length || pill.hidden) return;
    const { scrollTop, scrollHeight, clientHeight } = panel;
    const max = scrollHeight - clientHeight;
    const progress = max > 0 ? Math.min(1, Math.max(0, scrollTop / max)) : 1;
    bar.setAttribute("stroke-dashoffset", String(RING_LENGTH * (1 - progress)));
    percent.textContent = `${Math.round(progress * 100)}%`;
    trigger.setAttribute("aria-label", `Index: ${Math.round(progress * 100)}% read. Jump to a section`);

    // Shown once the header has scrolled under the top of the panel.
    const panelTop = panel.getBoundingClientRect().top;
    const visible = header.getBoundingClientRect().bottom < panelTop;
    if (visible) pill.dataset.visible = "";
    else {
      delete pill.dataset.visible;
      close({ instant: true });
    }

    // Current: the last section whose top has passed a third of the way down.
    const line = panelTop + clientHeight / 3;
    let next = 0;
    entries.forEach((entry, i) => {
      if (entry.section.getBoundingClientRect().top <= line) next = i;
    });
    if (scrollTop >= max - 1) next = entries.length - 1;
    if (next !== current) {
      current = next;
      menu?.setSelected(String(current));
    }
  }

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  panel.addEventListener("scroll", schedule, { passive: true });
  new ResizeObserver(schedule).observe(body);

  // A click from the keyboard (Enter/Space) has detail 0: open instantly.
  trigger.addEventListener("click", (event) => {
    if (!menu) return;
    if (menu.isOpen()) return close();
    const keyboard = event.detail === 0;
    menu.open({ instant: keyboard, focus: keyboard ? "selected" : "none" });
    trigger.setAttribute("aria-expanded", "true");
  });
  trigger.addEventListener("keydown", (event) => {
    if (!menu || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
    event.preventDefault();
    menu.open({ instant: true, focus: "selected" });
    trigger.setAttribute("aria-expanded", "true");
  });
  document.addEventListener("pointerdown", (event) => {
    if (menu?.isOpen() && !pill.contains(event.target as Node)) close();
  });
  pill.addEventListener("focusout", (event) => {
    if (menu?.isOpen() && !pill.contains(event.relatedTarget as Node | null)) close({ instant: true });
  });

  return { setup };
}
