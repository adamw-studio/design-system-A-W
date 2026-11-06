/**
 * Resolves every Figma text style into one description: its values, the
 * CSS class and variables that implement it, and its usage rule.
 *
 * Shared by scripts/build-tokens.mjs (machine-readable outputs for AI
 * agents) and the Typography page, so docs, CSS and exports always agree.
 */

/** font/weight/strong → --font-weight-strong, heading/large/fontSize → --heading-large-font-size */
export function kebab(figmaName) {
  return (
    "--" +
    figmaName
      .split("/")
      .map((p) => p.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase())
      .join("-")
  );
}

/**
 * @param {{ Typography: { vars: Record<string, unknown[]> } }} source  figma-variables.json
 * @param {{ styles: { style: string, label: string, usage: string, sample?: string, variants?: string[] }[] }} rules  typography-rules.json
 */
export function typographyStyles(source, rules) {
  const vars = source.Typography.vars;
  const resolve = (name) => {
    if (!(name in vars)) throw new Error(`Missing typography variable: ${name}`);
    const value = vars[name][0];
    return typeof value === "object" && value && "alias" in value ? resolve(value.alias) : value;
  };

  const out = [];
  for (const rule of rules.styles) {
    // Body styles keep their variables under "<style>/strong" in Figma; the
    // regular variant swaps in font/weight/default.
    const variants = rule.variants ?? [null];
    const group = rule.variants ? `${rule.style}/strong` : rule.style;
    const cls = rule.style.replaceAll("/", "-");

    for (const variant of variants) {
      const regular = variant === "regular";
      const weightVar = regular ? "font/weight/default" : `${group}/fontWeight`;
      const letterSpacingPercent = resolve(`${group}/letterSpacing`);

      out.push({
        figmaStyle: variant ? `${rule.style}/${variant}` : rule.style,
        style: rule.style,
        variant,
        label: variant === "strong" ? `${rule.label} Strong` : rule.label,
        usage: rule.usage,
        sample: rule.sample ?? null,
        className: variant === "strong" ? `text-${cls}-strong` : `text-${cls}`,
        values: {
          fontFamily: resolve(`${group}/fontFamily`),
          fontSize: resolve(`${group}/fontSize`),
          lineHeight: resolve(`${group}/lineHeight`),
          fontWeight: resolve(weightVar),
          // Figma letter spacing is a percentage of the font size.
          letterSpacing: `${+(letterSpacingPercent / 100).toFixed(5)}em`,
          letterSpacingPercent: +letterSpacingPercent.toFixed(2),
        },
        cssVariables: {
          fontFamily: kebab(`${group}/fontFamily`),
          fontSize: kebab(`${group}/fontSize`),
          lineHeight: kebab(`${group}/lineHeight`),
          fontWeight: kebab(weightVar),
          letterSpacing: kebab(`${group}/letterSpacing`),
        },
      });
    }
  }
  return out;
}
