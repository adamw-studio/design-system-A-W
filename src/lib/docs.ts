/**
 * DOM helpers for the documentation pages. Styles: src/styles/docs.css.
 */

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** A page section with a heading-medium title and an optional intro. */
export function section(title: string, intro?: string | (Node | string)[]) {
  const wrap = el("section", "doc-section");
  const id = `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const heading = el("h2", "doc-section__title text-heading-medium", title);
  heading.id = id;
  wrap.setAttribute("aria-labelledby", id);
  wrap.append(heading);
  if (intro) {
    const p = el("p", "doc-section__intro text-body-large");
    p.append(...(typeof intro === "string" ? [intro] : intro));
    wrap.append(p);
  }
  return wrap;
}

/** A code sample block. */
export function codeBlock(code: string) {
  const pre = el("pre", "doc-code");
  pre.append(el("code", undefined, code));
  return pre;
}

/** A bulleted list of usage rules. */
export function ruleList(rules: string[]) {
  const list = el("ul", "doc-rules text-body-large");
  list.append(...rules.map((r) => el("li", undefined, r)));
  return list;
}
