/**
 * Overview page — Figma "Design System - Web", node 302:2166 (content frame
 * 302:2167): a short essay, "Why I am building this library", in six
 * sections. Each section heading sits on a hand-drawn stroke (vectors
 * 303:2298–2308), used as-is from public/images/overview/ as a mask filled
 * with --color-border-default (the strokes' #E6E6E6), so they follow the
 * theme. The page uses the "article" header: a small label and the title,
 * no subtitle, rule, description or Figma button (styles: layout.css).
 */
import { el } from "../lib/docs";
import { publicUrl } from "../lib/url";
import "../styles/pages/overview.css";

export const overviewTitle = "Why I am building this library";

interface Section {
  title: string;
  paragraphs: string[];
  /** Figma's stroke under the heading: file and drawn width. */
  underline: { file: string; width: number };
}

const SECTIONS: Section[] = [
  {
    title: "The problem I kept running into",
    underline: { file: "underline-1.svg", width: 212 },
    paragraphs: [
      "Across projects, I found myself revisiting the same interface decisions: choosing type sizes, defining button states, adjusting spacing, and deciding how much emphasis an action needed. Each decision was small, but together they took attention away from the specific problem I was designing for. I wanted a starting point that captured those recurring choices and made them easier to apply consistently.",
    ],
  },
  {
    title: "Why I chose to build my own",
    underline: { file: "underline-2.svg", width: 195 },
    paragraphs: [
      "Existing libraries provide strong foundations, and building my own means taking on work they already solve. For my workflow, however, I wanted closer control over the visual language and the relationship between Figma and code.",
      "Creating this library lets me develop those together, understand the consequences of each decision, and document the reasoning behind it. That control comes with responsibility: every component I add becomes something I need to test, explain and maintain.",
    ],
  },
  {
    title: "What I chose to standardize",
    underline: { file: "underline-3.svg", width: 189 },
    paragraphs: [
      "I started with the decisions that affect almost every interface: colour, typography, spacing, icons, and common controls. Semantic tokens describe how values should be used, while components turn those foundations into repeatable patterns.",
      "The documentation adds another layer by explaining when a pattern is appropriate. My aim is to make recurring decisions dependable while leaving room for the content, layout, and priorities of each project.",
    ],
  },
  {
    title: "The principles behind the system",
    underline: { file: "underline-4.svg", width: 224 },
    paragraphs: [
      "I want the system to make hierarchy clear and behaviour predictable. A primary button should communicate priority, a switch should apply a setting immediately, and a tag should describe something without looking like an action.",
      "I also treat interaction states as part of the design: focus, hover, pressed, and disabled states need the same attention as the default appearance. These principles give me a practical way to evaluate components as the library grows.",
    ],
  },
  {
    title: "How it fits into my workflow",
    underline: { file: "underline-5.svg", width: 190 },
    paragraphs: [
      "The library connects my Figma work to a working implementation. Variables exported from Figma generate the foundations used by the site, and the documentation brings component examples and usage rules together. Seeing components in the browser helps me check details that a static frame cannot fully express, including content changes, interaction, and theme behaviour.",
      "The same guidance is also published in a machine-readable format so the AI tools can reference the system’s decisions when helping with implementation.",
    ],
  },
  {
    title: "What I’m learning and what comes next",
    underline: { file: "underline-6.svg", width: 263 },
    paragraphs: [
      "Building the library has made me examine decisions that are easy to leave implicit in individual designs. A component needs a clear purpose, meaningful states, and guidance that explains its boundaries.",
      "My next priority is to test those decisions across more realistic interfaces, improve accessibility and make the documentation more interactive. I want the system to grow from repeated needs and practical feedback with each addition earning its place.",
    ],
  },
];

function sectionEl(s: Section, index: number) {
  const wrap = el("section", "overview-section");
  const id = `overview-section-${index + 1}`;
  wrap.setAttribute("aria-labelledby", id);

  const heading = el("h2", "overview-section__title text-body-large-strong");
  heading.id = id;
  const text = el("span", "overview-section__text", s.title);
  // The stroke: Figma draws it vertically and turns it -90°; so do we.
  const stroke = el("span", "overview-underline");
  stroke.setAttribute("aria-hidden", "true");
  stroke.style.setProperty("--underline-width", `${s.underline.width}px`);
  const mark = el("span", "overview-underline__mark");
  mark.style.setProperty("--underline-mask", `url("${publicUrl(`images/overview/${s.underline.file}`)}")`);
  stroke.append(mark);
  heading.append(stroke, text);

  const body = el("div", "overview-section__body");
  body.append(...s.paragraphs.map((p) => el("p", "text-body-large", p)));
  wrap.append(heading, body);
  return wrap;
}

export function renderOverview(body: HTMLElement) {
  body.append(...SECTIONS.map(sectionEl));
}
