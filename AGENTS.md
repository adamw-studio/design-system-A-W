# AGENTS.md

Guidance for AI coding agents working in this repository (the A/W design system site).

## What this is

A Vite + TypeScript site that documents the A/W design system. Every design token comes from Figma:

- `tokens/figma-variables.json` — export of the **Foundation – UI 2** Figma variables (Colors, Typography, Sizing). Source of truth for values.
- `tokens/typography-rules.json` — when to use each text style. Edit this to change typography guidance.
- `tokens/color-rules.json` — color rules, plus the wording each semantic token's description is built from (category + group + variant).
- `tokens/button-rules.json` — when to use each button variant (shown on the Buttons page and in `llms.txt`).
- `tokens/icons.json` — the icon catalog from Figma (Iconography), with Iconoir names, sizes and rules. Icons come from the [Iconoir](https://iconoir.com) package (`node_modules/iconoir`, a devDependency).
- `npm run tokens` (`scripts/build-tokens.mjs`) generates, from those files:
  - `src/styles/tokens/{color,typography,sizing}.css` — CSS custom properties and `.text-*` classes
  - `public/tokens/colors.json` — W3C design tokens: 70 primitives and 82 semantic tokens, light/dark values, usage descriptions
  - `public/tokens/typography.json` — W3C design tokens with usage rules
  - `public/llms.txt` — LLM-readable summary of all tokens (served at `/llms.txt`)
  - `public/icons/iconoir.svg` — sprite with just the catalog's icons

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

**Color** — use semantic tokens, never primitives (`--color-red-500`) or hex values in components. Every semantic token has a "when to use" description in `public/tokens/colors.json` and `public/llms.txt`.

- Match the category to the property: `--color-bg-*` backgrounds, `--color-text-*` text, `--color-icon-*` icons, `--color-border-*` borders.
- Groups: `default` (neutral UI), `disabled`, `danger`, `warning`, `success`. Variants: `-hover`, `-pressed`, `-secondary`, `-tertiary`, `-inverse`, `-strong`.
- Text/icons on a colored fill use the `on*` tokens, e.g. `--color-text-danger-ondanger` on `--color-bg-danger`.
- Dark mode is automatic inside `[data-theme="dark"]`; don't write separate dark styles.

**Spacing / radius** — `var(--space-0)`…`var(--space-7)` and `var(--radius-*)`. Layout-only constants live in `src/styles/layout.css` as `--layout-*`.

**Icons** — inline the sprite `public/icons/iconoir.svg` once per page (the site does it with `loadIconSprite()`), then use the Icon Shell: `<svg class="icon" aria-hidden="true"><use href="#icon-bell"></use></svg>`, sized with `icon--32`, `icon--24` (default), `icon--20`, `icon--16` or `icon--12` (`src/styles/components/icon.css`; helper `icon()` in `src/lib/icon.ts`). Only use names from `tokens/icons.json`; color icons with `--color-icon-*`. To add an icon, add it to the catalog and run `npm run tokens` (fails if Iconoir has no such icon).

**Buttons** — `<button class="button button--primary" type="button">` (variants `primary`, `secondary`, `tertiary`, `danger`, `success`), from `src/styles/components/button.css`. States (hover, pressed, focus, disabled) are built in; when to use each variant is in `tokens/button-rules.json` and `public/llms.txt`. Icon-only actions use `<button class="icon-button" aria-label="…">` from `src/styles/components/icon-button.css`. Don't restyle buttons per page.

**Motion** — Figma has no motion variables; the site's easing, durations and press scales live in `src/styles/motion.css` as `--motion-*`. Use `--motion-ease-out` for anything responding to the user, plain `ease` for color changes, keep UI transitions under 300ms, transition specific properties (never `all`), wrap hover effects in `@media (hover: hover) and (pointer: fine)`, give pressable elements an `:active` state, and drop movement (keep fades) under `prefers-reduced-motion`.

## Commands

```bash
npm run dev      # dev server on http://localhost:5173
npm run build    # type-check + production build
npm run tokens   # regenerate token CSS, colors.json, typography.json and llms.txt
```

The project folder name contains a colon (`A:W-DesignSystem`), which breaks npm's `.bin` PATH lookup and Vite's fs allow-list. `package.json` scripts call binaries by path and `vite.config.ts` disables `server.fs.strict` to work around it — keep those.

## Conventions

- Shared components live in `src/styles/components/` (imported from `src/styles/index.css`). Component doc pages build on `src/lib/docs.ts` and `src/styles/docs.css` (preview panel, sections, option lists, code blocks, rules). Every page uses the same centered content column (`--layout-content-width`) so margins match; adapt wide Figma frames to it rather than widening the page.
- Pages live in `src/pages/*.ts` (plain DOM, no framework) and register in `src/main.ts`; page styles in `src/styles/pages/`. Section links (e.g. `#colors`) redirect to their first page via `REDIRECTS` in `src/main.ts`.
- Figma → CSS naming and token resolution live in `scripts/token-names.mjs`, `scripts/colors.mjs` and `scripts/typography.mjs`; pages and the generator share them, so reuse them rather than re-deriving names or values.
- The site itself must use the system: every font, size, color, spacing and radius in `src/styles` comes from a token or `.text-*` class. Values that exist only in a Figma layout frame go in `--layout-*` constants (`src/styles/layout.css`) with a comment saying where they come from.
- Implement Figma frames from the Figma file, but always fill colors and type from tokens, not from hard-coded values in the frame.
