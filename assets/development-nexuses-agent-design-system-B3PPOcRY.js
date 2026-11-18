var e=`---
title: Agent design system: Midnight Emerald MudBlazor admin dashboard
summary: The UI and UX standards skill file for AI agents: design tokens, colors, typography, spacing, components, and MudBlazor runtime theming rules.
category: Reference
order: 70
---

# Agent design system: Midnight Emerald MudBlazor admin dashboard

This article is the content of the skill file \`.agents/skills/design-system.md\`. AI agents (GitHub Copilot and Google AntiGravity) read it as the UI and UX standard for MudBlazor screens. Copy the file or make a symbolic link to it under \`.github/skills/\`. The folder layout and setup are in [Agent global rules](doc:development-nexuses-agent-global-rules), and the code patterns are in [Agent project skill](doc:development-nexuses-agent-project-skill).

## Design tokens

The file starts with this YAML front matter. It holds all color, typography, radius, and spacing tokens.

\`\`\`yaml
---
name: Midnight Emerald MudBlazor Admin Dashboard
colors:
  surface: '#0D1117'
  surface-dim: '#080C0F'
  surface-bright: '#161B22'
  surface-container-lowest: '#050A08'
  surface-container-low: '#0D1117'
  surface-container: '#161B22'
  surface-container-high: '#1C2128'
  surface-container-highest: '#21262D'
  on-surface: '#E6EDF3'
  on-surface-variant: '#8B949E'
  inverse-surface: '#E6EDF3'
  inverse-on-surface: '#0D1117'
  outline: '#30363D'
  outline-variant: '#21262D'
  surface-tint: '#00FF8C'
  primary: '#00FF8C'
  on-primary: '#050A08'
  primary-container: '#1A4D38'
  on-primary-container: '#00FF8C'
  inverse-primary: '#1A4D38'
  secondary: '#1A4D38'
  on-secondary: '#E6EDF3'
  secondary-container: '#0D2818'
  on-secondary-container: '#00FF8C'
  tertiary: '#1A4D38'
  on-tertiary: '#E6EDF3'
  tertiary-container: '#0D2818'
  on-tertiary-container: '#00FF8C'
  error: '#E53935'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#00FF8C'
  primary-fixed-dim: '#00CC70'
  on-primary-fixed: '#050A08'
  on-primary-fixed-variant: '#1A4D38'
  secondary-fixed: '#1A4D38'
  secondary-fixed-dim: '#0D2818'
  on-secondary-fixed: '#E6EDF3'
  on-secondary-fixed-variant: '#1A4D38'
  tertiary-fixed: '#1A4D38'
  tertiary-fixed-dim: '#0D2818'
  on-tertiary-fixed: '#E6EDF3'
  on-tertiary-fixed-variant: '#1A4D38'
  background: '#0D1117'
  on-background: '#E6EDF3'
  surface-variant: '#161B22'
  success: '#00FF8C'
  warning: '#FFB545'
  info: '#58A6FF'
  app-bar: '#050A08'
  drawer-bg: '#050A08'
  divider: '#21262D'
typography:
  h1:
    fontFamily: Public Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  h2:
    fontFamily: Public Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  h3:
    fontFamily: Public Sans
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.4'
  body-1:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
  body-2:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.6'
  button:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '600'
    letterSpacing: 0.05em
  caption:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '400'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
---
\`\`\`

## Brand identity and visual language

The design system is for an admin dashboard. It is dark mode first, and it works for all industries. It uses the structural patterns of the MudBlazor UI framework with a custom noir color palette.

- The style is "Dark Noir": deep dark surfaces with neon text and highlights on dark backgrounds.
- The visual language follows Material Design principles: depth and a clear hierarchy.
- The "Cyber-Tech" approach decreases visual noise. Use deep dark surfaces, high-contrast neon typography, and color only where it has a purpose.
- The design system is white-label ready for enterprise use. Get the brand tokens (logo, primary, accent, surface, and dark mode default) from runtime configuration, for example \`appsettings.json\`. Do not hard-code them in pages.

## Color palette

The palette uses Midnight Emerald, a neon green, on deep noir backgrounds. Use high contrast only where it is necessary. Use dark surfaces in all other areas, for long periods of use.

### Primary colors

| Token | Value | Use |
| --- | --- | --- |
| Primary | \`#00FF8C\` | A neon green. Primary actions and "neon sign" highlights. |
| Primary Container | \`#1A4D38\` | A desaturated, dark forest green. Secondary actions and subtle accents. |
| Accent/Deep | \`#050A08\` | Almost black, with a small green tint. Heavy shadows, backgrounds, and deep noir typography. |

### Functional colors

| Token | Value | Use |
| --- | --- | --- |
| Success | \`#00FF8C\` | Alias of Primary, for brand consistency. |
| Warning | \`#FFB545\` | Warning states. |
| Error | \`#E53935\` | Error states. |
| Info | \`#58A6FF\` | Information states. |

### Neutral palette

| Token | Value | Use |
| --- | --- | --- |
| Surface | \`#0D1117\` | Card and paper backgrounds (deep dark). |
| Background | \`#0D1117\` | Main application background. |
| App Bar | \`#050A08\` | The header. It uses the Accent/Deep color for the noir identity. |
| Drawer/Nav | \`#050A08\` | Sidebar background. |
| Divider | \`#21262D\` | Dividers. |

### Extended semantic colors

| Token | Value | Use |
| --- | --- | --- |
| Outline | \`#30363D\` | Borders and dividers. |
| On-Surface | \`#E6EDF3\` | Text on dark backgrounds. |
| On-Surface-Variant | \`#8B949E\` | Secondary text and icons. |

### Tokenized surface tiers

Use tonal layers to separate dense dashboard areas. Use them before you add hard borders.

| Tier | Value | Use |
| --- | --- | --- |
| Surface | \`#0D1117\` | Base canvas. |
| Surface Container | \`#161B22\` | Workspace sections. |
| Surface Container High | \`#1C2128\` | Nested regions. |
| Surface Container Lowest | \`#050A08\` | Cards. |

### Atmospheric rules

- Use tonal separation first. Make section boundaries mainly with changes in surface tier.
- Use 1px borders only as secondary support, where accessibility or dense tabular scanning needs them.
- Keep color tokens central and driven by configuration. Do not use color constants for one page only.

## Typography

| Property | Value |
| --- | --- |
| Font family | \`'Public Sans'\` |
| Base font size | 14px (for data-heavy dashboard layouts) |

The scale gives a clear vertical rhythm.

- Headlines use tighter letter spacing and heavier weights. This gives an immediate hierarchy.
- Body text uses the 14px base (0.875rem) with a large line height. This keeps long reports easy to read.
- Controls use uppercase styling and more letter spacing. This makes UI elements different from static content.

| Style | Size and weight | Use | Line height or letter spacing |
| --- | --- | --- | --- |
| H1 | 32px, Bold | Page titles | Line height 1.2 |
| H2 | 24px, Semi-bold | Section headers | Line height 1.3 |
| H3 | 20px, Medium | Card titles | Line height 1.4 |
| Body 1 | 14px, Regular | Standard text | Line height 1.6 |
| Body 2 | 12px, Regular | Secondary information, table content | Line height 1.6 |
| Button | 14px, Semi-bold | Uppercase or Title Case | Letter spacing 0.05em |
| Caption | 12px, Regular | Labels and metadata | Letter spacing 0.02em |

## Layout and spacing

The layout uses a 12-column fluid grid on an 8px base unit.

- **Containers:** Align all dashboard widgets and cards to the 8px grid.
- **Rhythm:** Set the internal padding of standard cards to 24px (lg) and of compact cards to 16px (md). Set the gap between major layout sections (gutters) to 24px (lg).
- **Density:** For data-heavy views such as the MudDataGrid, you can decrease the vertical spacing to 4px (xs). This shows more information and keeps it clear.

### Spacing scale

| Token | Value | Use |
| --- | --- | --- |
| xs | 4px | Compact spacing for dense layouts. |
| sm | 8px | Minimal spacing. |
| md | 16px | Padding for compact cards and containers. |
| lg | 24px | Gutters and major section gaps. |
| xl | 40px | Large section spacing. |

### Density strategy

- **Desktop first:** Make workstation use efficient for operations teams.
- **Tablet and mobile:** Keep the responsive behavior and the information hierarchy.
- **High-density views:** Use compact row spacing together with stronger headings and a clear position for actions.

## Elevation and depth

Use ambient shadows and tonal layers to make the hierarchy. Do not use heavy black shadows. Use soft, diffused shadows with an Accent/Deep (\`#050A08\`) tint at a low opacity (5-10%).

| Level | Use |
| --- | --- |
| Level 0 (Flat) | The main background and flat surfaces. |
| Level 1 (Low) | Standard dashboard cards and data containers. It gives a small lift from the background. |
| Level 2 (Medium) | Interactive elements on hover (buttons, clickable cards). |
| Level 3 (High) | Only modals, dropdowns, and floating action buttons (FABs). |

With this approach, the most important information and the interactive elements look nearest to the user.

## Shapes and border radius

The design system uses a rounded shape language. This makes the industrial look of a dashboard softer.

- **Cards and data grids:** Use an 8px (0.5rem) corner radius. This agrees with the base spacing unit.
- **Buttons:** Primary buttons use a radius of 4px (the \`sm\` token). Secondary "ghost" buttons can use a pill shape (full rounding) to show a different action type.
- **Form inputs:** Use the 8px radius on input fields. This keeps all interactive surfaces the same.
- **Small elements:** Chips and badges use a 4px radius.

## Components and elements

### App bar (header)

- **Background:** Accent/Deep (\`#050A08\`).
- **Text and icons:** Primary (\`#00FF8C\`).
- **Elevation:** 4 (MudBlazor standard).
- **Features:** The brand logo on the left. A search bar (optional), a theme toggle, notifications, and the user profile on the right.
- **White label:** Support logo changes at runtime (\`companyLogoLight\` / \`companyLogoDark\`).

### Navigation drawer (sidebar)

- **Width:** 240px.
- **Style:** Flat, with a border on the right.
- **Background:** Accent/Deep (\`#050A08\`). This gives strong structural contrast against surfaces.
- **Default nav link:** Light text color (\`#E6EDF3\`) for contrast on the dark background, transparent background.
- **Active nav link:** Text color Primary (\`#00FF8C\`) and a background of Primary at 10% opacity. Add a left border indicator (4px wide) in Primary (\`#00FF8C\`).

### Data tables and data grids (MudDataGrid)

- **Header:** Dark surface background (\`#161B22\`), bold, uppercase typography.
- **Rows:** Do not use alternating "zebra" striping. Use thin 1px dividers in the Neutral color (\`#21262D\`) on a dark background.
- **Selection:** Use a light tint of Primary Container (\`#1A4D38\` at 10% opacity) for selected rows.
- **Density:** Use 'Compact' or 'Default', as the data volume requires.
- **Status chips:** Use small, rounded chips with functional colors and a tinted background (for example, 'Paid' = Green/Primary tint).

### Cards and surfaces

- **Border radius:** 8px.
- **Elevation:** Use a dark surface, Elevation 1, and a 1px border in the outline color (\`#30363D\`) to show the edges on dark backgrounds.
- **Padding:** 24px (lg) for standard cards, 16px (md) for compact layouts.
- **Tone first:** Use tone contrast between card and background before you add hard borders.

### Buttons

| Type | Style |
| --- | --- |
| Primary | Filled. Background Primary (\`#00FF8C\`), dark text (\`#050A08\`). Elevation 1, and Elevation 2 on hover. |
| Secondary | Outlined. Border Primary (\`#00FF8C\`), text Primary (\`#00FF8C\`), transparent background. |
| Accent | Filled. Background Primary Container (\`#1A4D38\`), light text (\`#E6EDF3\`). For critical or special actions. |

Use a radius of 4px (the \`sm\` token).

### Form fields

- Use the "Outlined" variant for MudTextField and other form inputs.
- When a field has focus, show the label in Primary Container (\`#1A4D38\`). This gives clear visual feedback.

> **NOTE:** Verify the contrast of the focused label. Primary Container (\`#1A4D38\`) on the dark surfaces (\`#0D1117\`, \`#161B22\`) is probably below the WCAG 4.5:1 ratio for text. Primary (\`#00FF8C\`) is a possible replacement.
- For error states, use the semantic red (\`#E53935\`) for the border and the helper text.
- Use a standard input height of 40px, a padding of 12px, and a border radius of 8px.

### Empty, loading, and feedback states

- Give every data-heavy page an explicit empty state.
- Use the same loading placeholders (skeletons) for all cards and grid regions.
- Use MudSnackbar and MudAlert for system feedback. Align them to the semantic colors.

## MudBlazor theme implementation (runtime branding)

### Non-negotiable requirements

1. Use \`MudThemeProvider\` with a light and a dark \`MudTheme\` variant.
2. Get brand values from configuration (\`appsettings.json\` or equivalent). Do not use hard-coded literals.
3. Save and restore the theme mode preference in browser storage (\`localStorage\` or \`sessionStorage\`).
4. Register \`MudThemeProvider\` and \`MudSnackbarProvider\` at the app root (\`App.razor\` or the root layout).
5. Use MudBlazor palette, typography, and spacing tokens in components. Do not use inline styles for core surfaces and text.
6. Do not put external CSS frameworks on top of the MudBlazor core tokens.

### Theme service responsibilities

1. Load the branding of the active tenant or customer.
2. Build the light and dark \`MudTheme\` objects from the runtime brand inputs.
3. Expose the current theme mode and the toggle behavior.
4. Save and restore the mode preference.
5. Publish change notifications, so that the shared layout and components refresh together.

### Suggested settings contract

| Setting | Type |
| --- | --- |
| \`companyLogoLight\` | string |
| \`companyLogoDark\` | string |
| \`primaryColor\` | string |
| \`accentColor\` | string |
| \`surfaceColor\` | string |
| \`isDarkModeDefault\` | bool |

## Regional formatting and data presentation

Use the same regional formatting in all modules. Make these settings configurable for each deployment:

1. Locale.
2. Time zone.
3. Currency.
4. Date format.

Formatting requirements:

1. Always show financial values as localized currency.
2. Use one shared formatter for operational dates (created, due, start).
3. Make due-date urgency states (overdue, due today, upcoming) visually different.

## Information architecture patterns

1. Use the same theme tokens on the login and privacy-acceptance screens as in the authenticated shell.
2. Put dashboard content in tabs and components. Do not hard-wire it into one page block.
3. Give all grid-heavy views the same toolbar controls: search, reset filters, and export.
4. Map status chips and urgency indicators to semantic palette roles (success, warning, error, info).
5. In role-gated sections, hide the tabs and actions that are not available. Do not break the layout rhythm.

## Implementation guardrails

1. Keep visual tokens central and driven by configuration.
2. Use this typography scale. Do not use ad hoc font sizes.
3. Use this document as the baseline for all new MudBlazor web UI screens.
4. If references conflict, the runtime brand configuration and this document have priority.

## Design principles

1. **Clarity over decoration:** Use whitespace and alignment to make the structure. Do not use heavy borders or shadows.
2. **Contextual feedback:** Use the primary color to show progress or successful actions.
3. **Information density:** Balance whitespace with access to data. Use the MudBlazor 'Dense' property for tables and lists where necessary.
4. **Consistency:** Give buttons, inputs, and chips the same border radius and padding on all screens.
5. **Depth and hierarchy:** Use elevation levels to guide the attention of the user and to show the visual hierarchy.
6. **Color semantics:** Use the functional colors (success, warning, error, info) the same way in all components, so that interactions are predictable.
7. **Runtime theming:** Make branding and theme mode behavior token-driven and managed in one place.

## Related links

- [Agent global rules](doc:development-nexuses-agent-global-rules)
- [Agent project skill](doc:development-nexuses-agent-project-skill)
`;export{e as default};