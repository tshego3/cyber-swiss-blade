---
name: csb-design-system
description: Claude-inspired warm monochrome design system and UI rules for Cyber Swiss Blade. Use when creating or editing ANY view, component, style, layout, colour, font, icon, animation, or accessibility concern - covers tokens, light/dark themes, typography, the core UI kit (src/core/ui.ts), layout, interaction, and asset rules.
---

# Design System (Warm Paper, Monochrome)

The look is calm and editorial: paper-like warm neutrals, monochrome primary and secondary colours (ink on paper in light, paper on ink in dark), serif display type over a sans UI, and generous spacing. Colour appears only for meaning: success, warning, danger.

## Tokens (`src/styles/tokens.css`) - single source of truth

1. No hard-coded colours, fonts, radii, or shadows in module CSS. Use `var(--token)`. Exception: print styles use literal colours, because print is always light.
2. Themes follow the system, with a manual override via `data-theme` on `<html>`. Dark tokens are defined twice (media query and `[data-theme='dark']`). Keep both blocks identical.
3. Palette

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--bg` | `#faf9f5` | `#262624` | page |
| `--bg-sunken` | `#f3f2ec` | `#1f1e1d` | sidebar |
| `--surface` / `--surface-2` | `#fff` / `#f0eee6` | `#30302e` / `#393937` | cards, inputs / hover, segmented |
| `--text` / `--text-muted` | `#141413` / `#6b6a66` | `#f5f4ef` / `#b5b3ab` | body / secondary (≥ 4.5:1) |
| `--accent` | `#1f1e1d` | `#ece9e1` | primary: icons, focus ring, indicators |
| `--accent-strong` + `--on-accent` | `#1f1e1d` + `#faf9f5` | `#ece9e1` + `#1a1918` | primary buttons (≥ 14:1) |
| `--accent-text` / `--accent-soft` | `#3d3c39` / 7% ink | `#dad7ce` / 10% paper | secondary: emphasis text, tinted chips and icon tiles |
| `--success` / `--warning` / `--danger` | green / amber / red | lighter tints | status only, never decoration |

4. Do not introduce a hue for branding. Primary and secondary stay monochrome; hover states mix the accent toward `--bg`.
5. Depth comes from 1px `--border` lines plus subtle `--shadow-sm/md/lg`. No heavy borders or gradients, except the faint accent wash on the running timer.

## Typography

1. System font stacks only, with no web-font downloads (offline, zero licence questions): `--font-serif` for display and titles, `--font-sans` for UI, `--font-mono` for numbers, codes, durations, and money (tabular figures).
2. Scale: display `--text-display` (serif 400), page title `--text-xl` (serif 500), section title 15px sans 600, body 15px/1.55, meta `--text-sm`/`--text-xs`.
3. Small-caps labels: `--text-xs`, uppercase, `0.04em` tracking (stats, nav groups).

## Layout

1. Sidebar 264px on desktop. At ≤ 860px it becomes an off-canvas drawer with a sticky blurred top bar. Content max width is 1040px.
2. 4px spacing scale (`--space-*`). Card padding is 24px. Page gutter is 40px on desktop and 16px on mobile.
3. Radii: 6 / 9 / 14 / 20px (`--radius-sm`, `--radius`, `--radius-lg`, `--radius-xl`).
4. Mobile first. Check at 360, 768, and 1280px. No horizontal page scroll.

## UI Kit (`src/core/ui.ts`) - use before writing new markup

`button`, `field`, `selectControl`, `segmented`, `moduleHeader`/`pageHeader`, `tabs`, `loadingState`/`errorState`/`emptyState`, `openFormDialog`, `confirmAction`, `toast`, `dropZone`, `downloadBlob`, `copyToClipboard`. Icons come from `icon(name)` in `src/core/icons.ts`. These are hand-drawn 24px stroke paths. Add new paths there; do not import icon packages.

## Interaction

1. Transitions use `var(--duration)` (160ms) and `var(--ease)`. Hover changes background or border only; cards lift by 2px.
2. Dialogs use native `<dialog>` with `showModal`. The first field gets focus. Focus returns to `#main` if the opener is gone.
3. Destructive actions always go through `confirmAction`. Errors use `toast(..., 'error')` or an inline `.tool-status[data-tone=error]`.
4. Autosave where editing is continuous (quote editor, 500ms debounce, "All changes saved" status). Use explicit Save for settings-style forms.
5. `prefers-reduced-motion` disables animation globally (base.css).

## Accessibility

1. Use semantic elements: `nav`, `main`, `header`, `section`, `button`, `a`, `label`, `fieldset`/`legend` for segmented controls.
2. Every control has a visible label or an `aria-label`. Icon-only buttons pass `iconOnly: true` and a label.
3. One `h1` per view. Include the skip link and `:focus-visible` rings. Do not remove outlines.
4. Touch targets are ≥ 44px on coarse pointers. Text contrast is ≥ 4.5:1 in both themes.

## Assets

1. Icons and the app mark are first-party SVG paths. No AI-generated images, no stock packs, no icon libraries.
2. PWA PNG icons are rendered from `public/favicon.svg` (ink tile, paper glyph). Re-render all four PNGs whenever the SVG changes.
