/**
 * Motion helpers: a physical spring easing (as a CSS linear() curve),
 * reduced-motion detection and a FLIP helper.
 */

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Simulates a damped spring from 0 → 1 and samples it into a CSS linear()
 * easing. Returns the easing and the time it takes to settle.
 */
function springCurve(stiffness: number, damping: number, mass = 1) {
  const dt = 1 / 120;
  let x = 0;
  let v = 0;
  let t = 0;
  const samples: number[] = [0];
  while (t < 2) {
    const force = -stiffness * (x - 1) - damping * v;
    v += (force / mass) * dt;
    x += v * dt;
    t += dt;
    samples.push(x);
    if (t > 0.1 && Math.abs(x - 1) < 0.0005 && Math.abs(v) < 0.005) break;
  }
  // Downsample to keep the CSS value compact.
  const step = Math.max(1, Math.floor(samples.length / 48));
  const points = samples.filter((_, i) => i % step === 0);
  points[points.length - 1] = 1;
  return {
    easing: `linear(${points.map((p) => +p.toFixed(4)).join(", ")})`,
    duration: Math.round(t * 1000),
  };
}

const supportsLinear = typeof CSS !== "undefined" && CSS.supports("transition-timing-function", "linear(0, 1)");
const FALLBACK = "cubic-bezier(0.2, 0.9, 0.25, 1.05)";

/** Gentle, slightly springy — cards sliding over each other. */
export const SPRING = supportsLinear ? springCurve(210, 22) : { easing: FALLBACK, duration: 520 };
/** Softer, no visible overshoot — expanding and collapsing panels. */
export const SPRING_SOFT = supportsLinear ? springCurve(170, 26) : { easing: FALLBACK, duration: 480 };

/** Exposes the springs to CSS as --ease-spring / --ease-spring-soft (+ durations). */
export function installMotionTokens() {
  const root = document.documentElement.style;
  root.setProperty("--ease-spring", SPRING.easing);
  root.setProperty("--ease-spring-duration", `${SPRING.duration}ms`);
  root.setProperty("--ease-spring-soft", SPRING_SOFT.easing);
  root.setProperty("--ease-spring-soft-duration", `${SPRING_SOFT.duration}ms`);
}

/**
 * FLIP: call `measure()` before a DOM change, then `play()` after it. Each
 * element animates from its old position to its new one.
 */
export function flip(elements: HTMLElement[]) {
  const before = new Map(elements.map((e) => [e, e.getBoundingClientRect()]));
  return {
    play(options: { exclude?: HTMLElement } = {}) {
      if (prefersReducedMotion()) return;
      for (const [node, rect] of before) {
        if (node === options.exclude || !node.isConnected) continue;
        const now = node.getBoundingClientRect();
        const dx = rect.left - now.left;
        const dy = rect.top - now.top;
        if (!dx && !dy) continue;
        node.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], {
          duration: SPRING.duration,
          easing: SPRING.easing,
        });
      }
    },
  };
}
