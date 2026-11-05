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

/** Briefly swaps a label's text (e.g. to "Copied"), then restores it. */
export function flashLabel(label: HTMLElement, text: string, original: string, ms = 1200) {
  label.textContent = text;
  label.classList.add("is-copied");
  window.clearTimeout(timers.get(label));
  timers.set(
    label,
    window.setTimeout(() => {
      label.textContent = original;
      label.classList.remove("is-copied");
    }, ms),
  );
}
