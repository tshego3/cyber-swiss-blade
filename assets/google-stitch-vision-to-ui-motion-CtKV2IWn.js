var e=`---
title: Antigravity motion and depth
summary: The floating UI rules, depth tokens, motion tokens, required motion states, reduced-motion contract, and FloatingBadge and HeroCard behavior specs.
category: AI and design
order: 110
---

# Antigravity motion and depth

"Antigravity" in the design sense means intentional floating composition: UI elements that look free of the rigid grid flow but stay accessible and predictable. This article gives the behavior contract for floating UI and motion. Implement it with the animation library or system of your stack. It is part of [Vision to UI with Google Stitch](doc:google-stitch-vision-to-ui).

## Before you start

- The motion and depth values are tokens. Read the [Midnight Emerald design system](doc:google-stitch-vision-to-ui-design-system).
- For the motion library and the reduced-motion API of each stack, read the [stack adapter notes](doc:google-stitch-vision-to-ui-design-system#stack-adapter-notes).

## Floating element rules

- Use absolute positioning in a bounded relative parent.
- Keep at least one anchor relation (center, edge offset), so that items stay stable when the viewport changes size.
- Define exclusion zones around primary actions to prevent overlap collisions.
- A floating element must not hide or block a primary action at any viewport size.

## Depth tokens

Always use tokens for z-index and depth, never raw numbers. Define depth as named constants in your stack:

\`\`\`text
depth.base     = 0
depth.raised   = 10
depth.floating = 40
depth.overlay  = 70
depth.modal    = 100
depth.toast    = 120
\`\`\`

These values are the same as the \`core.z.*\` tokens.

## Motion tokens

Keep these values as named constants in the token layer of your stack. Refer to them in all animation code. Do not hardcode durations or spring values.

\`\`\`text
motion.duration.fast    = 120ms    (hover, press)
motion.duration.base    = 180ms    (standard transitions)
motion.duration.slow    = 260ms    (deliberate entrances)

motion.spring.stiffness = 220
motion.spring.damping   = 22
motion.spring.mass      = 0.9

motion.float.y.from     = 0px
motion.float.y.to       = -4px
motion.float.period     = 4s
\`\`\`

Physics-based spring ranges:

| Parameter | Range | Default |
| --- | --- | --- |
| \`stiffness\` | 180-260 | 220 |
| \`damping\` | 18-26 | 22 |
| \`mass\` | 0.7-1.1 | 0.9 |

Motion recipes:

| Recipe | Behavior |
| --- | --- |
| Float idle | Translate Y between 0 and -4px, period 4 s, ease in-out, repeat without end. |
| Entrance | Y: 12 to 0, opacity: 0 to 1, spring transition, stagger by depth layer. |
| Lift on hover | Y: -4px, scale: 1.01, larger shadow, duration 120 ms maximum. |

## Required motion states

Each floating component must have these 3 states:

| State | Behavior |
| --- | --- |
| Initial | opacity: 0, translateY: 12px, scale: 0.99 |
| Enter | opacity: 1, translateY: 0, scale: 1. Spring transition with the token values. |
| Hover or focus | translateY: -4px, scale: 1.01. Duration: \`motion.duration.fast\`. |

### Idle float

Floating decorative elements also move all the time between \`float.y.from\` and \`float.y.to\`, on a \`float.period\` cycle with ease-in-out.

> **IMPORTANT:** Put this animation behind the reduced-motion preference of the platform. When the user requests reduced motion, the element must stay static.

## Reduced-motion contract

Each component with animation must examine the reduced-motion preference of the platform:

\`\`\`text
IF platform indicates reduced motion is preferred:
    disable idle float entirely
    show element at final state immediately (no entrance animation)
    retain interaction feedback only if duration ≤ 120ms
ELSE:
    run full animation suite
\`\`\`

When the user requests reduced motion, stop the perpetual oscillation and collapse the entrance stagger.

| Platform or stack | Reduced-motion API |
| --- | --- |
| Web (CSS) | \`@media (prefers-reduced-motion: reduce)\` |
| Web (JS) | \`window.matchMedia("(prefers-reduced-motion: reduce)")\` |
| .NET MAUI or WPF | OS accessibility flags through \`SystemParameters\` |
| iOS or SwiftUI | \`UIAccessibility.isReduceMotionEnabled\` |
| Android | \`Settings.Global.ANIMATOR_DURATION_SCALE == 0\` |

## Animation rules

1. **Animate only \`transform\` (translate, scale) and \`opacity\`.** Do not animate \`width\`, \`height\`, \`top\`, \`left\`, or a property that causes layout recalculation.
2. Put all perpetual animations behind the reduced-motion preference.
3. Interaction feedback on critical controls must complete in **250 ms** maximum.
4. Floating elements with interactive behavior must have an accessible label.
5. Assign depth from the depth token constants, never from a raw number.
6. Record the layer assignment in a component comment.

## FloatingBadge behavior spec

Use this spec when you implement \`FloatingBadge\` in a stack:

\`\`\`text
Positioning:
  - Absolute, anchored to top-right of parent
  - Parent must have relative / bounded positioning
  - Depth: depth.floating

Styling (resolve from tokens):
  - Background:    component.floatingBadge.bg
  - Text color:    component.floatingBadge.text
  - Border radius: semantic.radius.chip (pill)
  - Accessible label required

Motion:
  - Applies: Initial -> Enter -> Hover states (see Required motion states)
  - Idle float on inner content element (see Idle float)
  - Reduced-motion: static position, no oscillation
\`\`\`

> **NOTE:** Verify the badge radius. \`semantic.radius.chip\` resolves to 4px (\`core.radius.sm\`), not to a pill. For a pill shape, use \`core.radius.pill\` (999px).

## HeroCard behavior spec

\`\`\`text
Positioning:
  - In document flow (not floating), depth: depth.raised
  - Contains FloatingBadge as an absolute child

Styling (resolve from tokens):
  - Background:    component.heroCard.bg
  - Padding:       semantic.spacing.card.padding
  - Border radius: semantic.radius.card
  - Shadow:        component.heroCard.shadow
  - Heading color: semantic.color.text.primary
  - Body color:    semantic.color.text.secondary

Motion:
  - Entrance only (Initial -> Enter)
  - No idle float on the card itself
\`\`\`

## Related links

- [Vision to UI with Google Stitch](doc:google-stitch-vision-to-ui)
- [Midnight Emerald design system](doc:google-stitch-vision-to-ui-design-system)
- [Motion (Framer Motion) docs](https://motion.dev/docs/react)
- [Blazor.Animate](https://github.com/mikoskinen/Blazor.Animate)
`;export{e as default};