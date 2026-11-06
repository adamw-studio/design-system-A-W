/**
 * Icon Shell (src/styles/components/icon.css): an <svg class="icon"> that
 * references an Iconoir icon by name in the sprite built by `npm run tokens`.
 *
 * The sprite is inlined into the page once (loadIconSprite) and icons point
 * at in-page ids: <use href="#icon-bell">. Referencing the external file
 * instead (href="/icons/iconoir.svg#icon-bell") works, but Chrome pays
 * ~12ms per icon for it — 11s to paint the Icons page.
 */
export const ICON_SPRITE = "/icons/iconoir.svg";
const ID_PREFIX = "icon-";

export type IconSize = 32 | 24 | 20 | 16 | 12;

const SVG_NS = "http://www.w3.org/2000/svg";

let spriteLoad: Promise<void> | undefined;

/** Fetches the sprite and inserts it at the top of <body> (once). Icons
    rendered before it arrives fill in as soon as it does. */
export function loadIconSprite(): Promise<void> {
  spriteLoad ??= fetch(ICON_SPRITE)
    .then((res) => {
      if (!res.ok) throw new Error(`${ICON_SPRITE}: ${res.status}`);
      return res.text();
    })
    .then((svg) => document.body.insertAdjacentHTML("afterbegin", svg))
    .catch((error) => {
      spriteLoad = undefined;
      console.error("Icon sprite failed to load", error);
    });
  return spriteLoad;
}

const classFor = (size?: IconSize) => (size ? `icon icon--${size}` : "icon");

/** Decorative icon (aria-hidden); label the surrounding control instead. */
export function icon(name: string, size?: IconSize): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", classFor(size));
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(SVG_NS, "use");
  use.setAttribute("href", `#${ID_PREFIX}${name}`);
  svg.append(use);
  return svg;
}

/** The same icon as an HTML string, for code samples and copy buttons. */
export function iconMarkup(name: string, size?: IconSize): string {
  return `<svg class="${classFor(size)}" aria-hidden="true"><use href="#${ID_PREFIX}${name}"></use></svg>`;
}
