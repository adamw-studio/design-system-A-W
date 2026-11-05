/**
 * Read-only view of the color primitives in tokens/figma-variables.json.
 * Nothing here creates or adjusts colors — it only reads the exported values
 * and derives display information (RGB, opacity, contrast, label ink).
 */
import variables from "../../../tokens/figma-variables.json";
import { primitiveName, PRIMITIVE_PREFIX } from "../../../scripts/token-names.mjs";

export type Mode = "light" | "dark";

export interface Shade {
  family: string; // "red"
  step: string; // "500"
  index: number; // position in the family, 0-based
  figmaName: string; // "🎨/red/500"
  cssVar: string; // "--color-red-500"
  values: Record<Mode, string>; // "#f24822"
}

export interface Family {
  name: string; // "red"
  label: string; // "Red"
  /** Transparent scales: which backdrop makes their opacity readable. */
  backdrop: "light" | "dark" | null;
  shades: Shade[];
  /** True when any shade has a different value in dark mode. */
  shiftsInDark: boolean;
}

/** Neutrals first, then the chromatic scales in their Figma order. */
const NEUTRALS = ["grey", "black", "white"];
const BACKDROPS: Record<string, "light" | "dark"> = { black: "light", white: "dark" };

export const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);

export function readFamilies(): Family[] {
  const { modes, vars } = variables.Colors as { modes: string[]; vars: Record<string, unknown[]> };
  const light = modes.indexOf("Light");
  const dark = modes.indexOf("Dark");

  const families = new Map<string, Shade[]>();
  for (const [figmaName, vals] of Object.entries(vars)) {
    if (!figmaName.startsWith(PRIMITIVE_PREFIX)) continue;
    const [family, step] = figmaName.slice(PRIMITIVE_PREFIX.length).split("/");
    if (!families.has(family)) families.set(family, []);
    const shades = families.get(family)!;
    shades.push({
      family,
      step,
      index: shades.length,
      figmaName,
      cssVar: primitiveName(figmaName),
      values: { light: String(vals[light]), dark: String(vals[dark]) },
    });
  }

  const order = [...NEUTRALS.filter((f) => families.has(f)), ...[...families.keys()].filter((f) => !NEUTRALS.includes(f))];
  return order.map((name) => {
    const shades = families.get(name)!;
    return {
      name,
      label: capitalize(name),
      backdrop: BACKDROPS[name] ?? null,
      shades,
      shiftsInDark: shades.some((s) => s.values.light !== s.values.dark),
    };
  });
}

// ---------- color math (display only) ----------------------------------------

interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function parseHex(hex: string): RGBA {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
  };
}

/** "F24822" — uppercase, no "#". */
export const hexLabel = (hex: string) => hex.replace("#", "").toUpperCase();

/** 0–100, rounded. */
export const opacityPercent = (hex: string) => Math.round(parseHex(hex).a * 100);

/** "242 72 34" */
export function rgbLabel(hex: string): string {
  const { r, g, b } = parseHex(hex);
  return `${r} ${g} ${b}`;
}

/** CSS rgb() string, with alpha when the color is transparent. */
export function rgbCss(hex: string): string {
  const { r, g, b, a } = parseHex(hex);
  return a < 1 ? `rgb(${r} ${g} ${b} / ${opacityPercent(hex)}%)` : `rgb(${r} ${g} ${b})`;
}

const WHITE = { r: 255, g: 255, b: 255, a: 1 };
const BLACK = { r: 0, g: 0, b: 0, a: 1 };
/** Backdrops the transparent scales are shown on (grey/1000 for dark). */
const DARK_BACKDROP = { r: 0x11, g: 0x11, b: 0x11, a: 1 };

function over(fg: RGBA, bg: RGBA): RGBA {
  const mix = (f: number, b: number) => f * fg.a + b * (1 - fg.a);
  return { r: mix(fg.r, bg.r), g: mix(fg.g, bg.g), b: mix(fg.b, bg.b), a: 1 };
}

function luminance({ r, g, b }: RGBA): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function ratio(a: RGBA, b: RGBA): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG contrast of the color (composited if transparent) against white or black. */
export function contrastOn(hex: string, ground: "white" | "black"): number {
  const bg = ground === "white" ? WHITE : BLACK;
  return ratio(over(parseHex(hex), bg), bg);
}

export function wcagLevel(r: number): string {
  if (r >= 7) return "AAA";
  if (r >= 4.5) return "AA";
  if (r >= 3) return "AA Large";
  return "—";
}

/** Which ink reads best on this shade as displayed (over its family backdrop). */
export function inkFor(hex: string, backdrop: Family["backdrop"]): "dark" | "light" {
  const bg = backdrop === "dark" ? DARK_BACKDROP : WHITE;
  const shown = over(parseHex(hex), bg);
  return ratio(shown, BLACK) >= ratio(shown, WHITE) ? "dark" : "light";
}
