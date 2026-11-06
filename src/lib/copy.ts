/** Screen-reader status region for copy feedback. */
export function createStatusRegion(): HTMLElement {
  const status = document.createElement("span");
  status.className = "visually-hidden";
  status.setAttribute("role", "status");
  return status;
}

/** Copies `text` and announces the result in `status`. */
export async function copyToClipboard(text: string, status: HTMLElement): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    status.textContent = `Couldn't copy ${text}`;
    return false;
  }
  status.textContent = `Copied ${text}`;
  return true;
}

const timers = new WeakMap<HTMLElement, number>();
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/**
 * Replaces a label's text with a short blur-in, so the old and new text read
 * as one label changing rather than two strings swapping.
 */
function swapText(label: HTMLElement, text: string) {
  if (label.textContent === text) return;
  label.textContent = text;
  label.animate(
    reducedMotion.matches
      ? [{ opacity: 0.4 }, { opacity: 1 }]
      : [
          { opacity: 0.4, filter: "blur(2px)" },
          { opacity: 1, filter: "blur(0)" },
        ],
    { duration: 200, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
  );
}

/** Briefly swaps a label's text (e.g. to "Copied"), then restores it. */
export function flashLabel(label: HTMLElement, text: string, original: string, ms = 1200) {
  swapText(label, text);
  label.classList.add("is-copied");
  window.clearTimeout(timers.get(label));
  timers.set(
    label,
    window.setTimeout(() => {
      swapText(label, original);
      label.classList.remove("is-copied");
    }, ms),
  );
}
