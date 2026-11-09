/**
 * Light / dark theme. The theme is a data-theme attribute on <html>; the
 * generated color tokens (src/styles/tokens/color.css) switch on it, so
 * nothing else needs dark styles.
 *
 * An inline script in index.html applies the saved (or system) theme before
 * the first paint; this module wires up the Theme switch in the bottom-right
 * corner (on = dark).
 */
export type Theme = "light" | "dark";

/** Must match the key read by the inline script in index.html. */
const STORAGE_KEY = "aw-theme";
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

function savedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/**
 * Applies a theme in one frame. Transitions are paused while the colors
 * swap, so every element changes at once instead of each hover/color
 * transition fading at its own pace. The Theme switch's knob keeps its motion.
 */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.add("is-theme-switching");
  root.dataset.theme = theme;
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("is-theme-switching")));
}

/**
 * Connects the Theme switch (a .switch with role="switch"): checked means
 * dark. It reflects <html data-theme>, so a saved dark theme shows as on
 * from the first frame the script runs.
 */
export function initThemeSwitch(control: HTMLButtonElement) {
  const sync = () => control.setAttribute("aria-checked", String(currentTheme() === "dark"));
  sync();

  control.addEventListener("click", () => {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode etc.: the choice just won't persist.
    }
    sync();
  });

  // Follow the system setting until the user picks a theme here.
  systemDark.addEventListener("change", (event) => {
    if (savedTheme()) return;
    applyTheme(event.matches ? "dark" : "light");
    sync();
  });
}
