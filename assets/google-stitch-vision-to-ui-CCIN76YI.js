var e=`---
title: Vision to UI with Google Stitch
summary: A stack-agnostic workflow that turns a reference image into tokenized, whitelabel UI components with Google Stitch and Antigravity, from extraction to quality gates.
category: AI and design
order: 90
---

# Vision to UI with Google Stitch

This guide tells how to change reference images into production-ready, whitelabel UI components with Google Stitch and the Antigravity platform. It works with all languages and frameworks, for example React, .NET Blazor, Vue, Angular, SwiftUI, and Jetpack Compose.

## Before you start

The workflow has these parts. Each part is a separate article.

| Article | Contents |
| --- | --- |
| Vision to UI with Google Stitch (this article) | Architecture, image extraction, implementation workflow, quality gates |
| [Midnight Emerald design system](doc:google-stitch-vision-to-ui-design-system) | Token tiers, brand packs, theme resolver, visual specification, component specs, MudBlazor theme |
| [Antigravity motion and depth](doc:google-stitch-vision-to-ui-motion) | Floating UI, depth tokens, motion tokens, reduced motion |
| [AI rules and prompt templates](doc:google-stitch-vision-to-ui-ai-prompts) | Agent persona, hard blockers, output contract, prompts |
| [Stitch and Antigravity API reference](doc:google-stitch-vision-to-ui-api) | Secrets, HTTP contracts, end-to-end flow, errors |

Requirements for the MCP workflow:

| Requirement | macOS and Linux | Windows |
| --- | --- | --- |
| Git | Preinstalled, or from the package manager | [git-scm.com](https://git-scm.com/) |
| Chromium browser | From the package manager or [chromium.org](https://www.chromium.org/) | [chromium.org](https://www.chromium.org/) |
| Antigravity access | [antigravity.google](https://antigravity.google/) | [antigravity.google](https://antigravity.google/) |

The Stitch MCP CLI installs with the MCP server connection. You do not have to install a separate runtime before you connect.

## Architecture

### Pipeline

\`\`\`text
Reference Image -> Stitch Vision -> Raw Layout/Style JSON
    -> Token Normalizer -> Component Generator -> Theme Resolver -> Production Component
\`\`\`

Each stage is a separate step that you can replace. The inputs and outputs are plain JSON. No stage needs a specific runtime, language, or framework.

### Core principles

| Principle | Meaning |
| --- | --- |
| Token-first | Each UI value comes from a named token, never from a hardcoded literal. |
| Semantic naming | Code refers to role-based tokens (\`text.primary\`), not to primitives (\`neutral.900\`). |
| Single-swap theming | When you replace one \`brandPack.overrides\` object, all components get the new theme. |
| Deterministic generation | The same image and the same tokens give the same output. Ambiguity gives \`TODO\` markers, not silent guesses. |
| Motion with intent | Animation supports the hierarchy. It always obeys \`prefers-reduced-motion\` (or the platform equivalent). |
| Stack-agnostic | JSON and HTTP define the token contracts, API shapes, and quality gates. You select the implementation language. |
| Clarity over decoration | Use whitespace and alignment to define the structure, not heavy borders or shadows. |
| Contextual feedback | Use the primary color to show progress or successful actions. |
| Information density | Balance whitespace with data access. Use dense modes for tables and lists where necessary. |
| Consistency | Buttons, inputs, and chips must have the same border radii and padding on all screens. |
| Depth and hierarchy | Use elevation levels to guide the attention of the user and to show the visual hierarchy. |
| Color semantics | Use functional colors (success, warning, error, info) the same way in all components. |
| Runtime theming | Tokens control branding and theme mode, and one central place manages them. |

### File structure

The extensions are examples. Use the conventions of your target stack.

\`\`\`text
vision-ui/
├── input/
│   ├── reference.png               # Source UI screenshot
│   └── meta.json                   # Viewport + platform hints
├── extracted/
│   ├── stitch-layout.raw.json
│   └── stitch-styles.raw.json
├── normalized/
│   ├── layout.normalized.json
│   └── tokens.resolved.json
├── themes/
│   ├── brand-default.json
│   └── brand-client-a.json
├── generated/
│   └── <ComponentName>.<ext>       # Output in your stack's format
└── src/
    ├── design/
    │   ├── tokens.<ext>            # Core + semantic + component tokens
    │   ├── theme-resolver.<ext>    # Token -> CSS variable resolver
    │   └── motion-tokens.<ext>     # Spring/duration/float values
    └── components/
        ├── floating-badge.<ext>
        └── hero-card.<ext>
\`\`\`

## Extract the UI from an image

Google Stitch uses **Gemini 2.5 Pro** to generate full website front ends from one reference image. The output has page sections, a design system with light and dark mode, color palettes, and font customization. Always select the **Pro model** for the best fidelity.

> **NOTE:** Verify the current Stitch model in the Stitch model picker. Google updates the Gemini model that Stitch uses.

### Prepare the input

| File | Required | Purpose |
| --- | --- | --- |
| \`input/reference.png\` | Yes | UI screenshot (desktop: \`1440×1024\`, mobile: \`390×844\`) |
| \`input/meta.json\` | No | Viewport dimensions, platform target, density |

To find references, use Pinterest (search for \`web design inspiration portfolio\` or \`SaaS web design\`), Dribbble, Behance, or Awwwards.

Image checklist:

- [ ] Normalize the image to a known viewport.
- [ ] Keep the alpha channels where shadows have a meaning.
- [ ] Remove watermarks, cursors, and chrome that is not part of the UI.
- [ ] Make sure that the text is legible at 1× scale.

\`meta.json\` schema:

\`\`\`json
{
  "viewport": { "width": 1440, "height": 1024 },
  "platform": "web",
  "density": 2,
  "expectedComponents": ["HeroCard", "TopNav", "FloatingBadge"]
}
\`\`\`

### Generate the design in Stitch

1. Give Stitch the reference image and this prompt:

   \`\`\`text
   Replicate this web design as an image. Also insert design system.
   \`\`\`

   **Result:** Stitch generates the visual layout and a \`design.md\` file with colors, fonts, and modes that you can change.

2. To get a different result, use **Regenerate**. To examine alternatives, use **Variations** > **Refine**.
3. When the desktop design is final, click the design and enter "Create a mobile version for it."

### Request the extraction targets

Request structured output for 4 layers:

| Layer | What to extract |
| --- | --- |
| Structure | Regions, containers, parent-child hierarchy, layout type (stack, grid, freeform) |
| Spacing | Margins, paddings, gaps, alignment anchors, baseline rhythm |
| Typography | Font family, size, line height, weight, letter spacing |
| Effects | Radii, borders, shadows, blur, transparency, depth order |

Recommended extraction prompt:

\`\`\`text
Return a normalized layout tree with absolute bounds, inferred auto-layout constraints, text styles, and depth layers. Include confidence scores per element and ambiguity notes for uncertain regions. Output format: \`layout-tree-v1\`.
\`\`\`

### Map pixels to tokens

Region classification:

| Visual pattern | Mapped component |
| --- | --- |
| Horizontal bar at the top edge | \`TopNav\` |
| Repeated card blocks in a grid | \`CardGrid\` or \`List\` |
| Badge, heading, and action cluster | \`Hero\` variant |
| Overlapping decorative shapes | Antigravity floating layer (see [Antigravity motion and depth](doc:google-stitch-vision-to-ui-motion)) |

**Token snapping:** Snap each raw pixel value to the nearest token step. Keep the audit trail:

\`\`\`json
{ "raw": 13, "snapped": "spacing.3", "resolved": 12, "delta": 1 }
\`\`\`

Constraint conversion:

| Source pattern | Responsive constraint |
| --- | --- |
| Left and right pinned | Fluid width with max-width |
| Centered in the parent | Centered with flexbox or \`margin: auto\` |
| Free floating position | Absolute in a bounded relative parent |
| Card with a fixed width | Min-width and max-width clamp |

**Confidence fallback:** If the extraction confidence is less than \`0.82\`, write a \`TODO\` marker. Do not generate code from low-confidence data without a marker. Example comment pattern (for all languages):

\`\`\`text
// AUTO-GENERATED: confidence: 0.71
// TODO: Verify component boundary. Stitch was uncertain about this region.
// Render a placeholder with attribute: data-todo="verify-boundary"
\`\`\`

## Select the implementation path

- If you use Antigravity and Stitch, use the [MCP workflow](#use-the-mcp-workflow-with-antigravity). It is automated.
- If you do not use them, use the [CLI or API workflow](#use-the-cli-or-api-workflow). It has manual steps.

## Use the CLI or API workflow

These steps are the same for all languages and operating systems. All 4 steps use the same JSON contracts. Only the shell syntax is different.

> **NOTE:** Verify that the \`vision-ui\` CLI exists in your toolchain. It is not a published Google tool. Treat these commands as a template for your own wrapper around the API.

### Extract the layout from the reference image

macOS and Linux:

\`\`\`bash
vision-ui analyze \\
  --input input/reference.png \\
  --meta input/meta.json \\
  --output-layout extracted/stitch-layout.raw.json \\
  --output-styles extracted/stitch-styles.raw.json
\`\`\`

Windows (PowerShell):

\`\`\`powershell
vision-ui analyze \`
  --input input\\reference.png \`
  --meta input\\meta.json \`
  --output-layout extracted\\stitch-layout.raw.json \`
  --output-styles extracted\\stitch-styles.raw.json
\`\`\`

You can also call the HTTP API directly in all languages: \`POST {STITCH_API_BASE_URL}/stitch/vision/analyze\`. Read [Stitch analyze endpoint](doc:google-stitch-vision-to-ui-api#stitch-analyze-endpoint).

### Normalize the raw extraction

macOS and Linux:

\`\`\`bash
vision-ui normalize \\
  --layout extracted/stitch-layout.raw.json \\
  --tokens themes/brand-default.json \\
  --output normalized/layout.normalized.json
\`\`\`

Windows (PowerShell):

\`\`\`powershell
vision-ui normalize \`
  --layout extracted\\stitch-layout.raw.json \`
  --tokens themes\\brand-default.json \`
  --output normalized\\layout.normalized.json
\`\`\`

Examine the snap deltas in the output. If a delta is more than 4 px, verify it manually.

### Generate the component

macOS and Linux:

\`\`\`bash
vision-ui generate \\
  --input normalized/layout.normalized.json \\
  --template <your-stack-template> \\
  --theme themes/brand-default.json \\
  --output generated/HeroCard.<ext>
\`\`\`

Windows (PowerShell):

\`\`\`powershell
vision-ui generate \`
  --input normalized\\layout.normalized.json \`
  --template <your-stack-template> \`
  --theme themes\\brand-default.json \`
  --output generated\\HeroCard.<ext>
\`\`\`

### Validate the component

Run the equivalent checks of your stack. All checks must pass before the component is done.

| Check | Purpose |
| --- | --- |
| Static analysis or type check | No type errors |
| Linter | No style violations |
| Unit and integration tests | All specs pass |
| Accessibility audit | No critical or serious violations |
| Token compliance | No raw hex or hardcoded brand values in the component source |

Then verify manually:

- [ ] Keyboard or platform accessibility navigation works from start to end.
- [ ] The reduced-motion preference stops all oscillation.
- [ ] A theme swap gives the correct brand colors.

## Use the MCP workflow with Antigravity

This path automates the full pipeline. Stitch generates the design, and Antigravity writes the code. Video walkthrough: [Google Stitch to Antigravity, full workflow](https://www.youtube.com/watch?v=FLQWXRzKMS4).

Export options from Stitch:

| Method | Best for |
| --- | --- |
| MCP server (recommended) | Automated end-to-end work, no manual code handling |
| Code to clipboard | Fast paste for single-page designs |
| Copy prompt | Exports Stitch instructions for a landing page |
| AI Studio preview | Tests before you commit |
| Figma zip | Design handoff |

### Get the Stitch API key

1. Open [stitch.withgoogle.com](https://stitch.withgoogle.com/) in Chromium.
2. Go to **Settings** > **API Key** > **Create API Key**.
3. Copy the key. You need it in the next procedure.

> **WARNING:** Do not commit the API key to source control. Keep it in the secret management of your platform. Read [secrets and configuration](doc:google-stitch-vision-to-ui-api#secrets-and-configuration).

### Connect the Stitch MCP server

1. Open [antigravity.google](https://antigravity.google/).
2. Go to **Agent Panel** > **(⋯)** > **MCP Servers** > **View Raw Config**.
3. Add the Stitch server:

   \`\`\`json
   {
     "mcpServers": {
       "stitch": {
         "serverUrl": "https://stitch.googleapis.com/mcp",
         "headers": { "X-Goog-Api-Key": "YOUR-API-KEY" }
       }
     }
   }
   \`\`\`

4. Restart Antigravity.
5. Go to **⋯** > **MCP Servers** > **Manage MCP Servers**.

   **Result:** Stitch shows with the tools \`get_projects\`, \`list_projects\`, \`get_screens\`, and \`get_design_system\`.

   > **NOTE:** Verify the tool names in **Manage MCP Servers**. The list has both \`get_projects\` and \`list_projects\`, and the Stitch MCP tool set can change.

> **TIP:** Turn on **User Settings** > **Permissions** > **Always proceed**. This prevents repeated permission prompts during code generation.

### Declare the stack before you generate

If you add the components to an **existing project**, give Antigravity the stack context before you generate anything:

\`\`\`text
I have an existing <stack> project.
Generate components in <component-format> using <ui-library or native primitives>.
Use CSS variables in the --ds-* namespace for all design tokens.
Do not generate code outside this stack.
Place business logic in the project's standard architecture pattern.
\`\`\`

### Generate from Stitch

Use these prompts in Antigravity:

\`\`\`text
# List your projects
MCP Stitch list projects

# Get screens for your project
MCP Stitch get screens for project <project-id>

# Generate all screens as a website
list all screens and make a website

# Target a specific stack
Take screen 1 from project <project-id> and generate a component for <stack>.
Use my project's conventions and --ds-* CSS variables for theming.

# Generate the design system bridge
Also generate a theme bridge that maps the Stitch design system
to my runtime theme layer and --ds-* CSS variables.
\`\`\`

Then do these steps:

1. Copy the generated components into your target folders.
2. Add or update the theme bridge, so that the \`--ds-*\` tokens (or the platform equivalents) resolve at runtime.
3. Change the names, namespaces, and import paths to agree with your architecture.
4. Run your build, test, and lint pipeline.

To deploy (optional), use these prompts:

\`\`\`text
connect Netlify through MCP
host the website on Netlify
\`\`\`

## Quality gates

### Pre-production gates

| Gate | Pass criteria |
| --- | --- |
| 1. Static analysis | The type checker exits without errors. |
| 2. Lint | 0 blocking violations |
| 3. Tests | All specs pass. |
| 4. Keyboard or platform navigation | Full navigation, no traps |
| 5. Color contrast | WCAG AA (4.5:1 normal text, 3:1 large text) |
| 6. Reduced motion | Perpetual animations are off. Entrances collapse. |
| 7. Token compliance | 0 raw hex or hardcoded brand values in the component source |
| 8. Theme swap | Visual verification with 2 or more brand packs |

### Failure recovery

| Failure | Symptom | Recovery |
| --- | --- | --- |
| Ambiguous component boundary | Confidence is less than 0.82. | Write a placeholder and a \`TODO\` annotation. |
| Typography mismatch | The size does not match a token tier. | Snap to the nearest tier. Keep the source value in the metadata. |
| Floating collisions on resize | An element covers a primary action at a narrow viewport. | Apply collision constraints. Hide ornaments below 640 px. |
| Theme drift | There is raw hex in the component source. | Replace it with a design token reference. |
| Motion jank | The code animates properties that cause layout recalculation. | Animate only \`transform\` and \`opacity\`. |

### Delivery checklist

Setup:

- [ ] The API keys are stored securely and are not committed to source control.
- [ ] The secret storage is in the ignore file of the repository.
- [ ] The Stitch MCP server is connected and its tools are verified (if you use Antigravity).

Tokens and theming:

- [ ] All token references are validated (no unresolved aliases).
- [ ] There are no hardcoded brand values in the component source.
- [ ] The theme bridge resolves the tokens at runtime (CSS variables on the web, a platform theme on native platforms).
- [ ] The theme swap is verified with 2 or more brand packs.

Component quality:

- [ ] The component is responsive: desktop, tablet, and mobile.
- [ ] Keyboard or platform accessibility navigation works from start to end.
- [ ] The reduced-motion preference stops all oscillation.
- [ ] All quality gates pass (static analysis, lint, tests, accessibility, contrast).
- [ ] Floating depth layers refer to named depth token constants.

Documentation:

- [ ] The token mapping summary is committed with the component.
- [ ] The motion behavior summary is committed with the component.

### Implementation guardrails

1. Keep the visual tokens in one central place, controlled by configuration.
2. Use the typography scale. Do not use ad hoc font sizes.
3. Use this guide as the baseline for all new web UI screens.
4. If references conflict, the runtime brand configuration and this guide have priority.

## Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| The wrong framework is generated | The stack context prompt is too vague. | Run again with an explicit stack and file format. |
| Components show without the theme | The theme bridge is missing. | Map the runtime theme values to the \`--ds-*\` tokens. |
| \`--ds-*\` variables are missing at runtime | The token output is mounted too late. | Write the token variables at the application root or in the document head. |
| Layout drift on small screens | The constraints were converted too literally. | Map them again to responsive constraints. |
| Motion is not smooth | The code animates properties that cause layout recalculation. | Animate only \`transform\` and \`opacity\`. |
| The wrong background color is generated | The AI read the design incorrectly. | Use a prompt such as "The background color needs to be black." |
| MCP calls fail sometimes | Permissions or network | Turn on persistent permissions. Examine the proxy and firewall. |

## Glossary

| Term | Definition |
| --- | --- |
| Token | A named design value (for example \`spacing.4 = 16px\`) that you use in place of a hardcoded number. |
| Semantic token | A role-based token (for example \`text.primary\`). It is an alias of a core primitive and shows the intent. |
| Whitelabel | The same product UI with a different brand for each client. You get it when you swap a token override set. |
| Antigravity | The AI IDE and platform from Google ([antigravity.google](https://antigravity.google/)). This guide also uses the name for a design concept: floating UI composition. |
| Stitch extraction | The conversion of the visual structure of an image into layout and style data that a machine can read. |
| MCP | Model Context Protocol. It connects tools (Stitch, Netlify) to Antigravity for automated workflows. |
| Confidence score | The certainty of the model for an inferred element (0.0-1.0). A value below \`0.82\` starts a fallback. |
| Brand pack | A JSON file with token overrides for one client brand. |
| Token snapping | The rounding of a raw pixel value to the nearest step in the token scale. |
| Theme bridge | Stack-specific code that maps the resolved token JSON to CSS custom properties or a platform theme object. |

## Related links

- [Google Antigravity](https://antigravity.google/): the AI IDE and platform
- [Google Stitch](https://stitch.withgoogle.com/): image-to-UI generation
- [Video: Stitch to Antigravity walkthrough](https://www.youtube.com/watch?v=FLQWXRzKMS4)
- [WCAG AA contrast requirements](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum)
- [axe-core accessibility engine (web)](https://github.com/dequelabs/axe-core)
- [Motion (Framer Motion) docs](https://motion.dev/docs/react)
- [MudBlazor (.NET component library)](https://mudblazor.com/)
- [Blazor.Animate](https://github.com/mikoskinen/Blazor.Animate)
- [bUnit (Blazor testing)](https://bunit.dev/)
- [Netlify (free hosting)](https://www.netlify.com/)
- [Pinterest (design inspiration)](https://www.pinterest.com/)
- [AI design-to-code workflows](doc:ai-agent-operational-model-design-to-code)
`;export{e as default};