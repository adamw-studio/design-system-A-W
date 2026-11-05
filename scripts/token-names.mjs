/**
 * Figma variable name → CSS custom property name.
 * Shared by scripts/build-tokens.mjs and the documentation pages so the
 * generated CSS and the docs can never disagree.
 */

export const PRIMITIVE_PREFIX = "🎨/";
export const SEMANTIC_PREFIX = "✦/";

/** 🎨/red/500 → --color-red-500 */
export function primitiveName(figmaName) {
  return `--color-${figmaName.slice(PRIMITIVE_PREFIX.length).replaceAll("/", "-")}`;
}

/**
 * ✦/bg/default/default → --color-bg-default
 * ✦/bg/default/hover   → --color-bg-hover
 * ✦/bg/danger/default  → --color-bg-danger
 * ✦/bg/danger/hover    → --color-bg-danger-hover
 */
export function semanticName(figmaName) {
  const [category, group, variant] = figmaName.slice(SEMANTIC_PREFIX.length).split("/");
  const parts = [category];
  if (group !== "default") parts.push(group);
  if (variant !== "default") parts.push(variant);
  if (parts.length === 1) parts.push("default");
  return `--color-${parts.join("-")}`;
}

export function colorName(figmaName) {
  if (figmaName.startsWith(PRIMITIVE_PREFIX)) return primitiveName(figmaName);
  if (figmaName.startsWith(SEMANTIC_PREFIX)) return semanticName(figmaName);
  throw new Error(`Unknown color variable prefix: ${figmaName}`);
}
