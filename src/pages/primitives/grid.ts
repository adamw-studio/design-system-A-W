/** Grid view: the compact utility reference (unchanged from the original page). */
import { el, shortValue, type PaletteContext } from "./shared";

export function renderGrid(ctx: PaletteContext): HTMLElement {
  const palette = el("div", "palette");

  for (const family of ctx.families) {
    const section = el("section", "scale");
    section.id = `family-${family.name}`;
    if (family.backdrop) section.dataset.backdrop = family.backdrop;

    const header = el("header", "scale__header");
    const title = el("h2", "scale__name text-heading-small", family.label);
    title.id = `scale-${family.name}`;
    header.append(title);
    if (family.backdrop) header.append(el("span", "scale__note text-body-medium", "Transparent"));
    section.setAttribute("aria-labelledby", title.id);

    const list = el("ol", "scale__swatches");
    for (const shade of family.shades) {
      const hex = shade.values[ctx.mode];
      const item = el("li");
      const button = el("button", "swatch");
      button.type = "button";
      button.style.setProperty("--swatch", `var(${shade.cssVar})`);
      button.title = `${family.name}/${shade.step} · ${hex}`;
      button.setAttribute("aria-label", `${family.name} ${shade.step}, ${hex}. Copy var(${shade.cssVar})`);
      button.append(
        el("span", "swatch__chip"),
        el("span", "swatch__step text-body-medium", shade.step),
        el("span", "swatch__value", shortValue(shade, family, ctx.mode)),
      );
      button.addEventListener("click", () => ctx.copy(shade));
      item.append(button);
      list.append(item);
    }

    section.append(header, list);
    palette.append(section);
  }
  return palette;
}
