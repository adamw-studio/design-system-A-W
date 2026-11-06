# AGENTS.md

Guidance for AI coding agents working in this repository (the A/W design system site).

## What this is

A Vite + TypeScript site that documents the A/W design system. Every design token comes from Figma:

- `tokens/figma-variables.json` — export of the **Foundation – UI 2** Figma variables (Colors, Typography, Sizing). Source of truth for values.
- `tokens/typography-rules.json` — when to use each text style (usage rules). Edit this to change guidance.
- `npm run tokens` (`scripts/build-tokens.mjs`) generates, from those two files:
  - `src/styles/tokens/{color,typography,sizing}.css` — CSS custom properties and `.text-*` classes
  - `public/tokens/typography.json` — W3C design tokens with usage rules
  - `public/llms.txt` — LLM-readable summary of all tokens

Never edit generated files by hand; change the source and re-run `npm run tokens`.

## Using the styles

Read `public/llms.txt` for the full, current token tables. The essentials:

**Typography** — always use a `.text-*` class (or its CSS variables); never hard-code `font-size`, `font-weight`, `line-height` or `letter-spacing`.

| Use for | Class |
| --- | --- |
| Onboarding / heavily branded moments (max one per view) | `.text-heading-display` |
| Primary page title | `.text-heading-large` |
| Section headings | `.text-heading-medium` |
| Card / panel headings | `.text-heading-small` |
| Multiline body text | `.text-body-large` (`-strong` for emphasis) |
| Default UI text: inputs, buttons | `.text-body-medium` (`-strong` for emphasis) |
| Avatars, badges | `.text-body-small` (`-strong` for emphasis) |

**Color** — use semantic tokens (`var(--color-text-default)`, `var(--color-bg-hover)`, …), never primitives (`--color-red-500`) or hex values in components. Dark mode applies under `[data-theme="dark"]`.

**Spacing / radius** — `var(--space-0)`…`var(--space-7)` and `var(--radius-*)`. Layout-only constants live in `src/styles/layout.css` as `--layout-*`.

## Commands

```bash
npm run dev      # dev server on http://localhost:5173
npm run build    # type-check + production build
npm run tokens   # regenerate token CSS, typography.json and llms.txt
```

The project folder name contains a colon (`A:W-DesignSystem`), which breaks npm's `.bin` PATH lookup and Vite's fs allow-list. `package.json` scripts call binaries by path and `vite.config.ts` disables `server.fs.strict` to work around it — keep those.

## Conventions

- Pages live in `src/pages/*.ts` (plain DOM, no framework) and register in `src/main.ts`; page styles in `src/styles/pages/`.
- Figma → CSS naming rules are in `scripts/token-names.mjs` and `scripts/typography.mjs`; reuse them rather than re-deriving names.
- Implement Figma frames from the Figma file, but always fill colors and type from tokens, not from hard-coded values in the frame.
