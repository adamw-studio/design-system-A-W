/**
 * Debounce: wait before running a function, and restart the wait every time
 * it's called again. Only the last call within the window runs. 300ms is the
 * common threshold — long enough to ignore a pointer passing over items,
 * short enough to feel responsive once it rests.
 *
 * Used by the Menu (src/lib/menu.ts) for opening and closing submenus on
 * hover, and for resetting type-ahead search.
 */
export const DEBOUNCE_MS = 300;

export interface Debounced<A extends unknown[]> {
  (...args: A): void;
  /** Drop the pending call, if any. */
  cancel(): void;
  /** Run the pending call now, if any. */
  flush(): void;
}

export function debounce<A extends unknown[]>(fn: (...args: A) => void, wait = DEBOUNCE_MS): Debounced<A> {
  let timer = 0;
  let pending: A | null = null;

  const run = () => {
    timer = 0;
    const args = pending;
    pending = null;
    if (args) fn(...args);
  };

  const debounced = ((...args: A) => {
    pending = args;
    window.clearTimeout(timer);
    timer = window.setTimeout(run, wait);
  }) as Debounced<A>;

  debounced.cancel = () => {
    window.clearTimeout(timer);
    timer = 0;
    pending = null;
  };
  debounced.flush = () => {
    if (!timer) return;
    window.clearTimeout(timer);
    run();
  };
  return debounced;
}
