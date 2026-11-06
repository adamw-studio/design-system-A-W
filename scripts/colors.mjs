/**
 * Resolves every color variable into one description: values per mode,
 * CSS variable, what it points to, and a usage description composed from
 * tokens/color-rules.json.
 *
 * Shared by scripts/build-tokens.mjs (colors.json, llms.txt) and the
 * Primitives / Tokens pages, so docs, CSS and exports always agree.
 */
import { PRIMITIVE_PREFIX, SEMANTIC_PREFIX, primitiveName, semanticName } from "./token-names.mjs";

const MODES = ["light", "dark"];

/**
 * "secondary" → "secondary, less prominent"; "ondanger-tertiary" on the
 * success group → "placed on a success fill …, tertiary, least prominent".
 * The "on…" prefix is read from the group, so a token named
 * success/onwarning is still described as sitting on the success fill.
 */
function describeSemantic(category, group, variant, rules) {
  const { categories, groups, variants, onVariant } = rules.semantic;
  const parts = [`${categories[category] ?? category} for ${groups[group] ?? group}`];
  let rest = variant;
  if (rest.startsWith("on")) {
    parts.push(onVariant.replaceAll("{group}", group));
    const dash = rest.indexOf("-");
    rest = dash === -1 ? "default" : rest.slice(dash + 1);
  }
  if (rest !== "default" || parts.length === 1) parts.push(variants[rest] ?? rest);
  return parts.join(" — ") + ".";
}

/**
 * @param {{ Colors: { modes: string[], vars: Record<string, unknown[]> } }} source  figma-variables.json
 * @param {object} rules  color-rules.json
 */
export function colorTokens(source, rules) {
  const { modes, vars } = source.Colors;
  const index = { light: modes.indexOf("Light"), dark: modes.indexOf("Dark") };

  const resolve = (name, mode) => {
    const value = vars[name][index[mode]];
    return typeof value === "object" && value && "alias" in value ? resolve(value.alias, mode) : String(value);
  };
  const aliasOf = (name, mode) => {
    const value = vars[name][index[mode]];
    return typeof value === "object" && value && "alias" in value ? value.alias : null;
  };

  const primitives = [];
  const semantic = [];

  for (const name of Object.keys(vars)) {
    if (name.startsWith(PRIMITIVE_PREFIX)) {
      const [family, step] = name.slice(PRIMITIVE_PREFIX.length).split("/");
      primitives.push({
        figmaVariable: name,
        path: [family, step],
        family,
        step,
        cssVariable: primitiveName(name),
        values: Object.fromEntries(MODES.map((m) => [m, resolve(name, m)])),
        description: rules.primitives.families[family] ?? null,
      });
    } else if (name.startsWith(SEMANTIC_PREFIX)) {
      const [category, group, variant] = name.slice(SEMANTIC_PREFIX.length).split("/");
      semantic.push({
        figmaVariable: name,
        path: [category, group, variant],
        category,
        group,
        variant,
        cssVariable: semanticName(name),
        /** Primitive each mode points to, e.g. { light: "red/600", dark: "red/400" }. */
        aliases: Object.fromEntries(MODES.map((m) => [m, aliasOf(name, m)?.slice(PRIMITIVE_PREFIX.length) ?? null])),
        values: Object.fromEntries(MODES.map((m) => [m, resolve(name, m)])),
        description: describeSemantic(category, group, variant, rules),
      });
    }
  }
  return { primitives, semantic };
}
