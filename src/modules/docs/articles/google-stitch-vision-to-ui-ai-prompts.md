---
title: Vision to UI AI rules and prompt templates
summary: Agent rules and copy-ready prompts for the Stitch workflow: persona, hard blockers, output contract, and templates for extraction, generation, and review.
category: AI and design
order: 120
---

# Vision to UI AI rules and prompt templates

This article gives the rules and prompts that prime an AI agent for the Stitch vision-to-UI workflow. Copy the rules into `SKILLS.md` and `RULES.md` in your project. It is part of [Vision to UI with Google Stitch](doc:google-stitch-vision-to-ui).

## Before you start

- Read the [Midnight Emerald design system](doc:google-stitch-vision-to-ui-design-system) for the token names.
- In the prompt templates, replace each `{{...}}` placeholder with a real value.

## Agent rules

### Persona

You are a **Senior Full-Stack Architect and Design Systems Lead** who: translates visual references into semantic UI architecture; builds tokenized, whitelabel-capable component systems; implements interaction depth with predictable floating motion; and generates production-ready code that passes lint, type, and accessibility gates, in the target stack, whatever that stack may be.

### Hard blockers

Generation is **incomplete** until all of these gates pass:

1. Static analysis and type checks pass (exit code 0 or equivalent).
2. The linter reports 0 blocking violations.
3. The accessibility audit reports 0 critical or serious violations.
4. Token compliance confirms 0 raw hardcoded brand values in the component source.
5. A theme swap with a different brand pack gives the correct overrides.
6. There are no unresolved `TODO` markers in the final output (unless explicitly deferred).

### Do and do not

| Do not | Do |
| --- | --- |
| Hardcode hex colors in the component source | Refer to a design token (CSS variable or platform equivalent) |
| Hardcode spacing or radius literals | Refer to spacing and radius tokens |
| Use arbitrary z-index or depth values | Refer to named depth token constants |
| Animate `width`, `height`, `top`, or `left` | Animate only `transform` and `opacity` |
| Use non-semantic elements as controls without full keyboard and accessibility support | Use native interactive elements, or add full semantics |
| Use default or unnamed exports for components | Use named exports (or the platform equivalent) |
| Ship code that fails a quality gate | Fix all violations first |
| Run perpetual animations without a reduced-motion check | Put all infinite animations behind the reduced-motion preference of the platform |

### Output contract

Each generation run must deliver these artifacts:

1. Component source (in the format of the target stack).
2. Token mapping summary (JSON).
3. Motion behavior summary (Markdown).
4. Accessibility notes (Markdown).
5. Validation status (JSON, pass or fail for each gate).

### Stack adapter contract

The stack can change. The contracts cannot change.

| Contract | Must stay the same on all stacks |
| --- | --- |
| Token namespace | The `core.*`, `semantic.*`, `component.*` key structure |
| CSS variable names | The `--ds-{token-path}` format (web), or the equivalent on native platforms |
| Depth token values | The same numeric values, as named constants |
| Motion token values | The same durations and spring parameters |
| Quality gates | The same pass criteria, for all tools |
| Output artifacts | The same 5 deliverables |

### Information architecture patterns

1. Login and privacy-acceptance screens must use the same theme tokens as the authenticated shell.
2. Put dashboard content in tabs and components. Do not hard-wire it into one page block.
3. Grid-heavy views must have the same toolbar controls: search, reset filters, and export.
4. Status chips and urgency indicators must map to semantic palette roles (success, warning, error, info).
5. Role-gated sections must hide unavailable tabs and actions without a change to the layout rhythm.

## Prompt templates

### Vision extraction

```text
Analyze this high-fidelity UI screenshot. Return a structured layout tree in "layout-tree-v1" format.

Extract:
- Layout regions with parent-child hierarchy (stack-vertical | stack-horizontal | grid | freeform)
- Typography: font family class, size, weight, line-height
- Visual effects: border-radius, box-shadow tier (sm/md/lg), opacity
- Depth ordering: base | raised | floating | overlay
- Absolute bounds {x, y, width, height} per node
- Confidence score (0.0-1.0) per node; flag nodes below 0.82 as "uncertain: true"

Viewport: {{width}}×{{height}} at {{density}}x. Platform: {{platform}}.
Expected components (hints): {{expectedComponents}}.

Output: layout-tree-v1 JSON only. No prose outside the JSON.
```

### Token normalization

```text
Normalize this raw Stitch layout tree. Map every pixel value to the nearest token in the provided scale.

Scales: spacing {{spacingScale}}, radius {{radiusScale}}, font sizes {{fontSizeScale}}, shadows {{shadowTiers}}.

Rules:
1. Snap each raw value to the nearest token step.
2. Record: raw value, snapped token name, resolved px value, snap delta.
3. If delta > 4px, add a warning to the "warnings" array.
4. Every dimension must appear; no silent discards.
5. Preserve the original confidence score.

Return: normalized layout JSON + snapLog array + warnings array.
```

### Component generation

```text
Generate a production-ready whitelabel UI component.

Source: normalized layout tree (below).
Target stack: {{stackName}}
Language / runtime: {{runtimeLanguageAndVersion}}
UI layer: {{uiLibraryOrNativePrimitives}}
Motion approach: {{motionApproach}}
Token delivery: CSS variables in the --ds-* namespace (token map below).
                If CSS variables are not supported on this platform, use: {{platformTokenAlternative}}

Requirements:
1. All colors, spacing, radius, z-index, and shadows resolve from design tokens; no hardcoded hex.
2. Use native / semantic elements before custom accessibility overrides.
3. All interactive elements must be keyboard or platform-equivalent accessible.
4. Implement entrance (initial -> enter), hover / focus lift, and idle float (floating layer only).
5. Gate idle float behind the platform's reduced-motion preference.
6. Named exports only (or platform equivalent).
7. Apply strict typing / static analysis rules for the target stack.

Normalized layout: {{normalizedLayout}}
Token map: {{tokenMap}}

Deliver: component source, token mapping JSON, motion behaviour .md, a11y notes .md, validation status JSON.
```

### Brand pack derivation

```text
Derive a semantic-token brand pack from these inputs:
- Primary brand color: {{primaryHex}}
- Accent color: {{accentHex}}
- Brand name: {{brandName}}

Rules:
1. Generate a 10-stop ramp (index 0-9) where index 5 = primaryHex.
2. Ensure WCAG AA contrast (4.5:1) between index 5 and the canvas background (#0D1117).
3. Map ramp to core.color.brand.* token keys.
4. Map accent to core.color.accent.500.
5. Include only keys that differ from the default brand pack.

Default brand pack: {{defaultBrandPack}}

Output:
1. brandPack JSON: { "id": "{{brandId}}", "name": "{{brandName}}", "overrides": { ... } }
2. Optional theme bridge adapter for {{stackName}}
```

### Quality gate review

```text
Review this component against the vision-ui quality gates.

HARD BLOCKERS: fail if any are present:
1. Raw hex color values in component source
2. Hardcoded spacing or radius literals when a token equivalent exists
3. Depth / z-index values outside the named depth token set
4. Animation of width, height, top, or left
5. Default / unnamed exports for components
6. Unsafe / untyped values without justification
7. Interactive elements not reachable via keyboard or platform accessibility
8. Perpetual animations without a reduced-motion preference check

For each violation: state the rule number, quote the offending code, provide the corrected version.
If none: respond "PASS: all quality gates satisfied."

Component source: {{componentSource}}
```

### Stack adapter

```text
Convert this component to the target stack.

Stack: {{stackName}} | Files: {{fileFormats}}
UI layer: {{uiLayer}} | State pattern: {{statePattern}}
Token delivery: resolve all design values via --ds-* CSS variables,
               or via {{platformTokenAlternative}} if CSS variables are unavailable.
Validation commands: {{validationCommands}}

Preserve: component semantics, hierarchy, token mapping, reduced-motion behaviour,
depth layering, and accessibility (labels, keyboard / platform nav, focus visibility).
Do not introduce stack-specific anti-patterns.
Return migration notes for any intentional adaptation.
```

## Related links

- [Vision to UI with Google Stitch](doc:google-stitch-vision-to-ui)
- [Antigravity motion and depth](doc:google-stitch-vision-to-ui-motion)
- [Stitch and Antigravity API reference](doc:google-stitch-vision-to-ui-api)
