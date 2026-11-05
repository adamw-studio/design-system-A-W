import { SPRING, prefersReducedMotion } from "./motion";
import "../styles/components/toast.css";

interface ToastOptions {
  message: string;
  /** CSS color (e.g. "var(--color-red-500)") shown as a small chip. */
  swatch?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

let toast: HTMLElement | null = null;
let hideTimer = 0;

function ensureToast(): HTMLElement {
  if (toast?.isConnected) return toast;
  toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  document.body.append(toast);
  return toast;
}

/** Small confirmation pill at the bottom of the content panel. */
export function showToast({ message, swatch, action, duration = 1800 }: ToastOptions) {
  const node = ensureToast();
  node.replaceChildren();

  if (swatch) {
    const chip = document.createElement("span");
    chip.className = "toast__swatch";
    chip.style.setProperty("--toast-swatch", swatch);
    node.append(chip);
  }
  const text = document.createElement("span");
  text.className = "toast__message";
  text.textContent = message;
  node.append(text);

  if (action) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "toast__action";
    button.textContent = action.label;
    button.addEventListener("click", () => {
      action.onClick();
      hide();
    });
    node.append(button);
  }

  const wasVisible = node.classList.contains("is-visible");
  node.classList.add("is-visible");
  if (!wasVisible && !prefersReducedMotion()) {
    node.animate(
      [
        { opacity: 0, transform: "translate(-50%, 12px) scale(0.96)" },
        { opacity: 1, transform: "translate(-50%, 0) scale(1)" },
      ],
      { duration: SPRING.duration, easing: SPRING.easing },
    );
  }

  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(hide, action ? duration + 1400 : duration);
}

function hide() {
  if (!toast) return;
  const node = toast;
  const done = () => node.classList.remove("is-visible");
  if (prefersReducedMotion()) return done();
  node
    .animate([{ opacity: 1 }, { opacity: 0, transform: "translate(-50%, 6px)" }], { duration: 160, easing: "ease-in" })
    .finished.then(done, done);
}
