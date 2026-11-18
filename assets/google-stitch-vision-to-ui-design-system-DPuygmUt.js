var e=`---
title: Midnight Emerald design system
summary: The token tiers, brand packs, theme resolver, colors, typography, spacing, component specs, and MudBlazor theme rules for the Stitch whitelabel workflow.
category: AI and design
order: 100
---

# Midnight Emerald design system

Midnight Emerald is a dark-mode-first design system for scalability and clarity in all industries. It has a **Dark Noir** look that balances data-heavy dashboards with a neon-on-dark color palette. The visual language follows Material Design principles (depth and clear hierarchy) with a "Cyber-Tech" approach: deep dark surfaces, high-contrast neon typography, and purposeful color. This article is part of [Vision to UI with Google Stitch](doc:google-stitch-vision-to-ui).

The design system is **white-label ready** for enterprise scenarios. Resolve the brand tokens from runtime configuration. Do not hard-code them in individual pages.

## Three-tier token architecture

\`\`\`text
Core Tokens       : primitives: raw colors, spacing scale, radii
        |
Semantic Tokens   : roles: bg.canvas, text.primary, action.primary
        |
Component Tokens  : scoped: heroCard.bg, floatingBadge.radius
\`\`\`

Each tier refers only to the tier above it. Component code refers **only to semantic tokens**, never directly to core primitives. This makes single-swap theming possible.

### Core tokens

\`\`\`json
{
  "core": {
    "color": {
      "neutral": {
        "0":   "#E6EDF3",
        "50":  "#8B949E",
        "100": "#6E7681",
        "300": "#30363D",
        "500": "#21262D",
        "700": "#161B22",
        "900": "#0D1117"
      },
      "brand": {
        "500": "#00FF8C",
        "600": "#00CC70",
        "700": "#1A4D38"
      },
      "accent":  { "500": "#1A4D38" },
      "deep":    { "500": "#050A08" },
      "success": { "500": "#00FF8C" },
      "warning": { "500": "#FFB545" },
      "error":   { "500": "#E53935" },
      "info":    { "500": "#58A6FF" }
    },
    "spacing": {
      "0": 0,  "1": 4,  "2": 8,  "3": 12, "4": 16,
      "5": 20, "6": 24, "8": 32, "10": 40, "12": 48, "16": 64
    },
    "radius":  { "sm": 4, "md": 8, "lg": 8, "xl": 16, "pill": 999 },
    "shadow": {
      "sm": "0 1px 2px rgba(5,10,8,0.30)",
      "md": "0 6px 16px rgba(5,10,8,0.40)",
      "lg": "0 14px 30px rgba(5,10,8,0.50)"
    },
    "z": {
      "base": 0, "raised": 10, "floating": 40,
      "overlay": 70, "modal": 100, "toast": 120
    }
  }
}
\`\`\`

### Semantic tokens

\`\`\`json
{
  "semantic": {
    "color": {
      "bg.canvas":               "{core.color.neutral.900}",
      "bg.surface":              "{core.color.neutral.700}",
      "bg.deep":                 "{core.color.deep.500}",
      "bg.muted":                "{core.color.neutral.500}",
      "text.primary":            "{core.color.neutral.0}",
      "text.secondary":          "{core.color.neutral.50}",
      "text.muted":              "{core.color.neutral.100}",
      "text.inverse":            "{core.color.deep.500}",
      "border.default":          "{core.color.neutral.300}",
      "action.primary.bg":       "{core.color.brand.500}",
      "action.primary.bg.hover": "{core.color.brand.600}",
      "action.primary.text":     "{core.color.deep.500}",
      "accent.emphasis":         "{core.color.brand.700}",
      "accent.on-emphasis":      "{core.color.brand.500}"
    },
    "spacing": {
      "section.y":    "{core.spacing.6}",
      "section.x":    "{core.spacing.6}",
      "card.padding": "{core.spacing.4}",
      "control.gap":  "{core.spacing.2}",
      "inline.gap":   "{core.spacing.2}"
    },
    "radius": {
      "card":    "{core.radius.md}",
      "control": "{core.radius.md}",
      "chip":    "{core.radius.sm}"
    },
    "motion": {
      "duration.fast":    120,
      "duration.base":    180,
      "duration.slow":    260,
      "spring.stiffness": 220,
      "spring.damping":   22,
      "spring.mass":      0.9
    }
  }
}
\`\`\`

### Component tokens

\`\`\`json
{
  "component": {
    "heroCard": {
      "bg":      "{semantic.color.bg.deep}",
      "text":    "{semantic.color.text.primary}",
      "radius":  "{semantic.radius.card}",
      "padding": "{semantic.spacing.card.padding}",
      "shadow":  "{core.shadow.sm}",
      "z":       "{core.z.raised}"
    },
    "floatingBadge": {
      "bg":     "{semantic.color.accent.emphasis}",
      "text":   "{semantic.color.accent.on-emphasis}",
      "radius": "{semantic.radius.chip}",
      "z":      "{core.z.floating}"
    },
    "topNav": {
      "bg":     "{semantic.color.bg.deep}",
      "border": "{semantic.color.border.default}",
      "height": "{core.spacing.16}",
      "z":      "{core.z.raised}"
    }
  }
}
\`\`\`

## Whitelabel brand packs

A brand pack is a flat JSON override object. When you swap it, all components that alias semantic or core tokens get the new theme. The component source does not change.

Default brand pack:

\`\`\`json
{
  "id": "default",
  "name": "Midnight Emerald",
  "overrides": {
    "core.color.brand.500": "#00FF8C",
    "core.color.brand.600": "#00CC70",
    "core.color.accent.500": "#1A4D38",
    "core.color.deep.500": "#050A08"
  }
}
\`\`\`

Client brand pack example:

\`\`\`json
{
  "id": "client-a",
  "name": "Client A Amber",
  "overrides": {
    "core.color.brand.500": "#FFB545",
    "core.color.brand.600": "#E09B30",
    "core.color.accent.500": "#2D5A3D"
  }
}
\`\`\`

Midnight Emerald full Material token map:

\`\`\`yaml
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
  outline: '#30363D'
  outline-variant: '#21262D'
  primary: '#00FF8C'
  on-primary: '#050A08'
  primary-container: '#1A4D38'
  on-primary-container: '#00FF8C'
  secondary: '#1A4D38'
  on-secondary: '#E6EDF3'
  error: '#E53935'
  on-error: '#ffffff'
  success: '#00FF8C'
  warning: '#FFB545'
  info: '#58A6FF'
  app-bar: '#050A08'
  drawer-bg: '#050A08'
  divider: '#21262D'
\`\`\`

## Theme resolver algorithm

You can write this logic in all languages:

\`\`\`text
1. Flatten the three token tiers into a single dot-path map:
     "core.color.brand.500"                  -> "#00FF8C"
     "semantic.color.action.primary.bg"       -> "{core.color.brand.500}"

2. Merge brand pack overrides (overrides win on key collision).

3. Resolve aliases: for any value matching "{some.token.path}",
   replace it with the value at that path. Repeat until stable.
   Cap at 10 passes to prevent circular references.

4. Emit as CSS custom properties (web) or platform theme objects (native):
     dot-path -> CSS variable:  "core.color.brand.500" -> "--ds-core-color-brand-500"
     number   -> append "px"   (except 0, which stays "0")
     string   -> emit as-is
\`\`\`

CSS output example:

\`\`\`css
:root[data-theme="default"] {
  --ds-core-color-brand-500: #00FF8C;
  --ds-semantic-color-bg-canvas: #0D1117;
  --ds-semantic-radius-card: 8px;
  --ds-semantic-spacing-card-padding: 16px;
  --ds-component-heroCard-shadow: 0 1px 2px rgba(5,10,8,0.30);
}

:root[data-theme="client-a"] {
  --ds-core-color-brand-500: #FFB545;
  --ds-core-color-brand-600: #E09B30;
  --ds-core-color-accent-500: #2D5A3D;
  /* All semantic + component tokens that alias brand colors update automatically */
}
\`\`\`

CSS custom properties are the universal delivery format for the web. On platforms without CSS variables (native mobile, desktop applications), write the resolved token map as a platform theme object or as generated constants. Keep the same three-tier key structure.

## Authoring rules

These rules are mandatory.

| Domain | Rule |
| --- | --- |
| Colors | Resolve through \`semantic.color.*\` or \`component.*.{color-prop}\`. **No raw hex in the component source.** |
| Spacing | Resolve through \`semantic.spacing.*\`. No hardcoded literals. |
| Radius | Resolve through \`semantic.radius.*\`. |
| Z-index and depth | Use only \`core.z.*\` depth tokens. **No arbitrary numbers.** |
| Motion | Resolve the timing, spring parameters, and idle-float values through \`semantic.motion.*\`. |
| Shadows | Refer to \`core.shadow.*\`. |

## Accessibility baseline

- **Contrast:** WCAG AA minimum (4.5:1 for normal text, 3:1 for large text).
- **Focus:** Visible focus indicators on all backgrounds and depth layers.
- **Motion:** Less or no motion when the reduced-motion preference of the platform is set.
- **Semantics:** Use native elements and controls before custom ARIA overrides.
- **Heading order:** A logical hierarchy (h1, h2, h3) and a landmark structure.

## Color palette

The palette has **Midnight Emerald** at its center: a neon green on deep noir backgrounds. It is designed for long use, with high contrast where it is important and calm dark surfaces in all other areas.

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Primary | \`core.color.brand.500\` | \`#00FF8C\` | Primary actions, neon-sign highlights |
| Primary container | \`core.color.brand.700\` | \`#1A4D38\` | Secondary actions, atmospheric accents |
| Accent/Deep | \`core.color.deep.500\` | \`#050A08\` | Heavy shadows, backgrounds, deep noir typography |
| Success | \`core.color.success.500\` | \`#00FF8C\` | Alias of Primary for brand consistency |
| Warning | \`core.color.warning.500\` | \`#FFB545\` | Warning states |
| Error | \`core.color.error.500\` | \`#E53935\` | Error states |
| Info | \`core.color.info.500\` | \`#58A6FF\` | Information states |
| Surface | \`core.color.neutral.900\` | \`#0D1117\` | Main canvas and card backgrounds |
| On-surface | \`core.color.neutral.0\` | \`#E6EDF3\` | Text on dark backgrounds |
| On-surface-variant | \`core.color.neutral.50\` | \`#8B949E\` | Secondary text and icons |
| Outline | \`core.color.neutral.300\` | \`#30363D\` | Borders and dividers |

### Surface tiers

Use tonal layers to separate dense areas before you use hard borders.

| Tier | Value | Usage |
| --- | --- | --- |
| Surface (base canvas) | \`#0D1117\` | Main application background |
| Surface container low | \`#161B22\` | Workspace sections |
| Surface container high | \`#1C2128\` | Nested regions |
| Surface container lowest | \`#050A08\` | Cards |

> **NOTE:** Verify the surface tier values. This table gives Surface container low as \`#161B22\`, but the Material token map gives \`surface-container-low: '#0D1117'\` and \`surface-container: '#161B22'\`.

Atmospheric rules:

- Use **tonal separation first**. Section boundaries come from changes in the surface tier.
- Use 1 px borders only as secondary support, where accessibility or dense table scanning needs them.
- Keep the color tokens in one central place, controlled by configuration. Do not use one-off color constants on individual pages.

## Typography

- **Font family:** 'Public Sans'
- **Base font size:** 14px (optimized for data-heavy dashboard layouts)

The scale gives a clear vertical rhythm. Headlines use tighter letter spacing and heavier weights for immediate hierarchy. Body text uses the 14px base size with a generous line height for readability. Controls use uppercase and wider letter spacing to make UI elements different from static content.

| Level | Size | Weight | Line height | Letter spacing | Usage |
| --- | --- | --- | --- | --- | --- |
| H1 | 32px | Bold (700) | 1.2 | -0.01em | Page titles |
| H2 | 24px | Semi-bold (600) | 1.3 | None | Section headers |
| H3 | 20px | Medium (500) | 1.4 | None | Card titles |
| Body 1 | 14px | Regular (400) | 1.6 | None | Standard text |
| Body 2 | 12px | Regular (400) | 1.6 | None | Secondary information, table content |
| Button | 14px | Semi-bold (600) | Not set | 0.05em | Uppercase or Title Case |
| Caption | 12px | Regular (400) | Not set | 0.02em | Labels and metadata |

## Layout and spacing

The layout uses a **12-column fluid grid** on an **8px base unit**.

| Token | Value | Usage |
| --- | --- | --- |
| \`xs\` | 4px | Compact spacing for dense layouts |
| \`sm\` | 8px | Minimal spacing |
| \`md\` | 16px | Standard padding for cards and containers |
| \`lg\` | 24px | Gutters and large section gaps |
| \`xl\` | 40px | Large section spacing |

- **Containers:** All dashboard widgets and cards snap to the 8px grid.
- **Rhythm:** The internal card padding is 16px (\`md\`). The section gutters are 24px (\`lg\`).
- **Density:** For data-heavy views, the vertical spacing can decrease to 4px (\`xs\`).

Density strategy:

- **Desktop-first:** Give priority to workstation efficiency.
- **Tablet and mobile:** Keep the responsive behavior and the information hierarchy.
- **High-density views:** Use compact row spacing with stronger headings and clear action placement.

## Elevation and depth

**Ambient shadows** and tonal layers make the hierarchy. Do not use heavy black shadows. Use soft, diffused shadows tinted with Accent/Deep (\`#050A08\`) at 5-10% opacity.

| Level | Shadow | Usage |
| --- | --- | --- |
| 0 (flat) | None | Main background, flat surfaces |
| 1 (low) | \`core.shadow.sm\` | Dashboard cards, data containers |
| 2 (medium) | \`core.shadow.md\` | Interactive elements on hover |
| 3 (high) | \`core.shadow.lg\` | Modals, dropdowns, FABs |

> **NOTE:** Verify the shadow opacity. The text gives 5-10% opacity, but the \`core.shadow\` tokens use 30%, 40%, and 50% (\`rgba(5,10,8,0.30)\` to \`rgba(5,10,8,0.50)\`).

## Shapes and border radius

A **rounded** shape language makes the industrial look of a dashboard softer.

| Element | Radius | Token |
| --- | --- | --- |
| Cards and data grids | 8px (0.5rem) | \`semantic.radius.card\` |
| Buttons (primary) | 4-6px | \`semantic.radius.control\` |
| Buttons (ghost or secondary) | pill (999px) | \`core.radius.pill\` |
| Form inputs | 8px | \`semantic.radius.control\` |
| Chips and badges | 4px | \`core.radius.sm\` |

> **NOTE:** Verify the primary button radius. This table gives 4-6px, but \`semantic.radius.control\` resolves to \`core.radius.md\` (8px). Add a separate token, or change the value, so that the token and the spec agree.

## Regional formatting and data presentation

Use the same regional formatting in all modules. Each deployment can configure these settings: locale, time zone, currency, and date format.

1. Always show financial values as localized currency.
2. Use one shared formatter for operational dates (created, due, start).
3. Make the due-date urgency states (overdue, due today, upcoming) visually different.

## Component specs

### App bar (header)

- **Background:** Accent/Deep (\`#050A08\`).
- **Text and icons:** Primary (\`#00FF8C\`).
- **Elevation:** 4 (MudBlazor standard).
- **Features:** Brand logo on the left. Search bar (optional), theme toggle, notifications, and user profile on the right.
- **White-label:** Support runtime logo changes (\`companyLogoLight\` and \`companyLogoDark\`).

### Navigation drawer (sidebar)

- **Width:** 240px.
- **Style:** Flat, with a border on the right.
- **Background:** Accent/Deep (\`#050A08\`). This gives strong structural contrast against the surfaces.
- **Active state:** A left border indicator (4px wide) in Primary (\`#00FF8C\`) and a subtle background highlight.
- **Text color:** Light text (\`#E6EDF3\`) on the dark background for contrast.
- **Nav links, default:** Text color \`#8B949E\`, transparent background.
- **Nav links, active:** Text color Primary (\`#00FF8C\`), background color Primary at 10% opacity. A left border accent is optional.

### Data tables and MudDataGrid

- **Header:** Dark surface background (\`#161B22\`) with uppercase typography.
- **Rows:** Do not use alternating "zebra" stripes. Use subtle 1px dividers in the neutral color (\`#21262D\`).
- **Selection:** Use a light tint of Primary Container (\`#1A4D38\` at 10% opacity) for selected rows.
- **Density:** 'Compact' or 'Default', as the data volume requires.
- **Status chips:** Small, rounded chips with functional colors and a tinted background (for example 'Paid' = green or Primary tint).

### Cards and surfaces

- Standard cards have a dark surface, elevation 1, and a 1px border in the outline color (\`#30363D\`) to show the edges on dark backgrounds.
- **Border radius:** 8px.
- **Padding:** 24px (standard), 16px (compact).

> **NOTE:** Verify the standard card padding. This spec gives 24px, but the \`card.padding\` token and the layout rhythm give 16px (\`md\`).
- **Tone first:** Use contrast between the card tone and the background tone before you add hard borders.

### Buttons

| Type | Style |
| --- | --- |
| Primary | Filled. Background Primary (\`#00FF8C\`), dark text (\`#050A08\`). Elevation 1, and elevation 2 on hover. |
| Secondary | Outlined. Border Primary (\`#00FF8C\`), text Primary (\`#00FF8C\`). Transparent background. |
| Accent | Filled. Background Primary Container (\`#1A4D38\`), light text (\`#E6EDF3\`). For critical or unique actions. |

Button radius: 4px to 6px.

### Form fields

- Use the "Outlined" variant for MudTextField and form inputs.
- When the field has focus, the label uses Primary Container (\`#1A4D38\`) as clear visual feedback.

> **WARNING:** \`#1A4D38\` on \`#0D1117\` has a contrast ratio of approximately 1.9:1. This fails WCAG AA (4.5:1 for text). Select a lighter focused label color, for example from the brand ramp, and check the contrast.
- Error states use the semantic red (\`#E53935\`) for the border and the helper text.
- Standard input height: 40px. Padding: 12px. Border radius: 8px.

### Empty, loading, and feedback states

- Each data-heavy page must have explicit empty states.
- Use the same loading placeholders or skeletons for cards and grid regions.
- Use MudSnackbar and MudAlert for system feedback, with the semantic colors.

For the motion and depth specs of \`FloatingBadge\` and \`HeroCard\`, read [Antigravity motion and depth](doc:google-stitch-vision-to-ui-motion).

## MudBlazor runtime theme

### Mandatory requirements

1. Use \`MudThemeProvider\` with a light and a dark \`MudTheme\` variant.
2. Get the brand values from configuration (\`appsettings.json\` or equivalent), not from hard-coded literals.
3. Save and restore the theme mode preference in browser storage (\`localStorage\` or \`sessionStorage\`).
4. Register \`MudThemeProvider\` and \`MudSnackbarProvider\` at the application root (\`App.razor\` or the root layout).
5. Use the MudBlazor palette, typography, and spacing tokens in components. Do not use inline styles for core surfaces and text.
6. Do not put external CSS frameworks over the MudBlazor core token composition.

### Theme service responsibilities

1. Load the active tenant or customer branding.
2. Build the light and dark \`MudTheme\` objects from the runtime brand inputs.
3. Give the current theme mode and the toggle behavior.
4. Save and restore the mode preference.
5. Send change notifications, so that the shared layout and components refresh together.

### Suggested settings contract

| Setting | Type |
| --- | --- |
| \`companyLogoLight\` | string |
| \`companyLogoDark\` | string |
| \`primaryColor\` | string |
| \`accentColor\` | string |
| \`surfaceColor\` | string |
| \`isDarkModeDefault\` | bool |

## Stack adapter notes

The token contracts and quality gates are the same for all stacks. The theme bridge, the motion system, and the reduced-motion check are different.

| Stack | Token delivery | Motion approach | Reduced-motion check |
| --- | --- | --- | --- |
| React or Next.js | CSS custom properties on \`:root\` | Motion (Framer Motion), CSS transitions, or GSAP | \`window.matchMedia("(prefers-reduced-motion: reduce)")\` |
| Vue or Nuxt | CSS custom properties on \`:root\` | CSS transitions, GSAP, or Motion Vue | The same CSS media query through a composable |
| Angular | CSS custom properties, or an Angular CDK theme | Angular Animations API or GSAP | CSS media query through a service or the CDK |
| .NET Blazor (WASM or Server) | CSS custom properties injected through JS interop, or a MudBlazor theme object | Blazor.Animate or CSS transitions | CSS media query evaluated on render |
| ASP.NET MVC or Razor Pages | CSS custom properties in the shared layout | CSS transitions, or a JS animation library from a CDN | CSS \`@media\` query |
| .NET MAUI | Resource dictionaries merged at the application level | Platform animation APIs | \`UIAccessibility.isReduceMotionEnabled\` (iOS) or OS accessibility flags (Android, Windows) |
| WPF or WinUI | Resource dictionaries | Storyboard or VisualStateManager | \`SystemParameters.ClientAreaAnimation\` (WPF) or \`UISettings.AnimationsEnabled\` (WinUI) |
| SwiftUI | \`@Environment\` key or a custom \`EnvironmentKey\` | \`.animation()\` modifier, \`withAnimation\` | \`UIAccessibility.isReduceMotionEnabled\` |
| Jetpack Compose | \`MaterialTheme\` or a custom \`CompositionLocal\` | \`animate*AsState\`, \`Transition\` APIs | \`LocalAccessibilityManager\` or \`ANIMATOR_DURATION_SCALE\` |

The \`--ds-*\` CSS variable names are the canonical convention for the web. For other platforms, write the resolved token map as a strongly typed theme object in your language. Keep the three-tier hierarchy (\`core\`, \`semantic\`, \`component\`).

## Related links

- [Vision to UI with Google Stitch](doc:google-stitch-vision-to-ui)
- [Antigravity motion and depth](doc:google-stitch-vision-to-ui-motion)
- [MudBlazor](https://mudblazor.com/)
- [WCAG AA contrast requirements](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum)
- [Motion (Framer Motion) docs](https://motion.dev/docs/react)
- [Blazor.Animate](https://github.com/mikoskinen/Blazor.Animate)
`;export{e as default};