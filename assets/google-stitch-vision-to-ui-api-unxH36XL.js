var e=`---
title: Stitch and Antigravity API reference
summary: The HTTP contracts for the Stitch analyze endpoint and the Antigravity normalize and generate endpoints, with secrets setup, an end-to-end flow, and error handling.
category: AI and design
order: 130
---

# Stitch and Antigravity API reference

The Stitch and Antigravity APIs use plain HTTP with JSON bodies. Write the client in the language of your stack. This article gives only the HTTP contracts and the configuration patterns, not an implementation in a specific language. It is part of [Vision to UI with Google Stitch](doc:google-stitch-vision-to-ui).

## Before you start

- A Stitch API key. Read [get the Stitch API key](doc:google-stitch-vision-to-ui#get-the-stitch-api-key).
- An Antigravity API key and base URL.

> **NOTE:** Verify these endpoints before you write a client. The \`/stitch/vision/analyze\`, \`/normalize\`, and \`/generate\` contracts are not in the published Stitch or Antigravity documentation. The \`localhost:3100\` base URL shows a local service. Treat the contracts as a design for your own service.

## Secrets and configuration

> **WARNING:** Do not commit API keys to source control. Use the standard secret management of your platform.

| Platform | Recommended approach |
| --- | --- |
| .NET | \`dotnet user-secrets\`, Azure Key Vault, or \`appsettings.json\` environment overrides |
| Java or Kotlin | \`.env\` and a dotenv library, or environment variables at startup |
| Python | \`.env\` and python-dotenv, or OS environment variables |
| JavaScript or Node.js | \`.env\` (git-ignored), loaded by your runtime or build tool |
| All CI/CD | Repository secrets (GitHub Actions, Azure DevOps, GitLab CI, and others) |

Set the environment variables on macOS and Linux:

\`\`\`bash
export STITCH_API_KEY=your_key_here
export STITCH_API_BASE_URL=https://stitch.googleapis.com/v1
export ANTIGRAVITY_API_BASE_URL=http://localhost:3100
export ANTIGRAVITY_API_KEY=your_key_here
\`\`\`

Windows (PowerShell):

\`\`\`powershell
$env:STITCH_API_KEY = "your_key_here"
$env:STITCH_API_BASE_URL = "https://stitch.googleapis.com/v1"
$env:ANTIGRAVITY_API_BASE_URL = "http://localhost:3100"
$env:ANTIGRAVITY_API_KEY = "your_key_here"
\`\`\`

Windows (Command Prompt):

\`\`\`cmd
set STITCH_API_KEY=your_key_here
set STITCH_API_BASE_URL=https://stitch.googleapis.com/v1
\`\`\`

## Stitch analyze endpoint

Request:

\`\`\`http
POST {STITCH_API_BASE_URL}/stitch/vision/analyze
Authorization: Bearer {STITCH_API_KEY}
Content-Type: application/json

{
  "image": "<base64-encoded PNG or public HTTPS image URL>",
  "viewport": { "width": 1440, "height": 1024 },
  "extract": ["structure", "spacing", "typography", "effects", "depth"],
  "outputFormat": "layout-tree-v1",
  "options": {
    "confidenceThreshold": 0.82,
    "snapToGrid": true,
    "gridBase": 4
  }
}
\`\`\`

Response:

\`\`\`json
{
  "version": "layout-tree-v1",
  "nodes": [
    {
      "id": "node-001",
      "type": "container",
      "bounds": { "x": 0, "y": 0, "width": 1440, "height": 600 },
      "layout": "stack-vertical",
      "children": ["node-002", "node-003"],
      "confidence": 0.94
    }
  ],
  "styles": [
    {
      "nodeId": "node-002",
      "typography": { "family": "Inter", "size": 32, "weight": 700, "lineHeight": 1.2 },
      "effects": { "radius": 16, "shadow": "md" },
      "confidence": 0.89
    }
  ],
  "depth": [
    { "nodeId": "node-003", "layer": "floating", "zIndex": 40 }
  ]
}
\`\`\`

Validate the response before you process it. Make sure that \`version === "layout-tree-v1"\`, that all nodes have \`confidence\`, and that all nodes have \`bounds\`.

## Antigravity normalize endpoint

Request:

\`\`\`http
POST {ANTIGRAVITY_API_BASE_URL}/normalize
X-Antigravity-Key: {ANTIGRAVITY_API_KEY}
Content-Type: application/json

{
  "layout": { <raw Stitch layout-tree-v1 response> },
  "tokens": { <brand-default.json content> }
}
\`\`\`

Response:

\`\`\`json
{
  "normalized": { },
  "snapLog": [
    { "path": "heroCard.padding", "raw": 23, "snapped": "spacing.6", "resolved": 24, "delta": 1 }
  ],
  "warnings": ["Snap delta > 4px at heroCard.cornerRadius (raw: 20, snapped: 16)"]
}
\`\`\`

Log all warnings. If a snap delta is more than 4 px, review it manually before you continue.

## Antigravity generate endpoint

Request:

\`\`\`http
POST {ANTIGRAVITY_API_BASE_URL}/generate
X-Antigravity-Key: {ANTIGRAVITY_API_KEY}
Content-Type: application/json

{
  "layout": { <normalized layout from /normalize> },
  "template": "<your-stack-template-name>",
  "theme": { <brand-default.json content> }
}
\`\`\`

Response:

\`\`\`json
{
  "componentSource": "<generated source code as a string>",
  "tokenMapping":    { "heroCard.bg": "#161B22", "heroCard.radius": "16px" },
  "motionSummary":   "Entrance: spring y 12→0, opacity 0→1 ...",
  "a11yNotes":       "FloatingBadge requires accessible label ...",
  "validationStatus": {
    "lint":   "pass",
    "types":  "pass",
    "tests":  "pass",
    "a11y":   "pass",
    "tokens": "pass"
  }
}
\`\`\`

The \`tokenMapping\` values in this example (\`#161B22\`, \`16px\`) are not the Midnight Emerald values. With the default brand pack, \`heroCard.bg\` resolves to \`#050A08\` and \`heroCard.radius\` resolves to \`8px\`.

> **IMPORTANT:** Examine \`validationStatus\` before you use the output. If a gate is \`"fail"\`, fix the reported problems and generate again. Do not ship the output.

## End-to-end flow

This pseudocode works for all languages:

\`\`\`text
// 1. Read image and encode to base64
imageData = base64_encode(read_file("input/reference.png"))

// 2. Call Stitch analyze
extracted = http_post(
  url     = STITCH_API_BASE_URL + "/stitch/vision/analyze",
  headers = { "Authorization": "Bearer " + STITCH_API_KEY },
  body    = {
    image: imageData, viewport: { width: 1440, height: 1024 },
    extract: ["structure","spacing","typography","effects","depth"],
    outputFormat: "layout-tree-v1",
    options: { confidenceThreshold: 0.82, snapToGrid: true, gridBase: 4 }
  }
)

// 3. Normalize
brandTokens = read_json("themes/brand-default.json")
normalized  = http_post(
  url     = ANTIGRAVITY_API_BASE_URL + "/normalize",
  headers = { "X-Antigravity-Key": ANTIGRAVITY_API_KEY },
  body    = { layout: extracted, tokens: brandTokens }
)

if normalized.warnings is not empty:
  log_warnings(normalized.warnings)   // review deltas > 4px

// 4. Generate
generated = http_post(
  url     = ANTIGRAVITY_API_BASE_URL + "/generate",
  headers = { "X-Antigravity-Key": ANTIGRAVITY_API_KEY },
  body    = { layout: normalized.normalized, template: YOUR_TEMPLATE, theme: brandTokens }
)

// 5. Gate check: halt if any gate failed
if any value in generated.validationStatus == "fail":
  log_error(generated.validationStatus)
  exit(1)

// 6. Write output
write_file("generated/HeroCard.<ext>",              generated.componentSource)
write_file("generated/HeroCard.token-map.json",     generated.tokenMapping)
write_file("generated/HeroCard.motion.md",          generated.motionSummary)
write_file("generated/HeroCard.a11y.md",            generated.a11yNotes)
\`\`\`

## Troubleshooting

| HTTP status | Meaning | Action |
| --- | --- | --- |
| 429 | Rate limited | Try again with exponential backoff (start at 1 s). |
| 503 | Service unavailable | Try again up to 3 times. Then show the error to the user. |
| 401 or 403 | Authentication failure | Examine the API key. Do not try again. |
| 400 | Bad request | Correct the request body against the schema. Do not try again. |
| 200 with a gate \`"fail"\` | Generated but not valid | Fix the gate violations and generate again. Do not ship. |

## Related links

- [Vision to UI with Google Stitch](doc:google-stitch-vision-to-ui)
- [Google Stitch](https://stitch.withgoogle.com/)
- [Google Antigravity](https://antigravity.google/)
`;export{e as default};