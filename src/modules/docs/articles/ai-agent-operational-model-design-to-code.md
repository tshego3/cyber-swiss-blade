---
title: AI design-to-code workflows
summary: Use Open Design, Claude Design, Penpot, and local vision models to turn briefs and screenshots into DESIGN.md tokens and working UI code.
category: AI and design
order: 70
gist: 930b58773dc848ae6611132f7a4a3362
---

# AI design-to-code workflows

This article tells how to go from a design brief or a screenshot to UI code with Open Design, Claude Design, and vision models. The recommended pattern is Claude Design (explore), then Open Design (standardize), then Claude Code or Copilot (produce). It is part of the [local and hybrid AI agent operational model](doc:ai-agent-operational-model).

## Before you start

- For Open Design: Podman (or Docker), Node.js 24 or later, and pnpm. Podman needs admin rights. Ask IT to provision it, or use a shared internal host. Read the [no-admin constraint](doc:ai-agent-operational-model#operating-constraint-no-admin-rights).
- For local vision models: Ollama or llama.cpp. Read [AI agent setup and installation](doc:ai-agent-operational-model-setup).

## Open Design

Open Design (OD) is a local-first design platform. It generates HTML artifacts with a skill-driven design loop, and it connects to coding agents through the system PATH.

### Core concepts

| Concept | Description |
| --- | --- |
| Skills | Special capabilities, for example `web-prototype`, `dashboard`, `critique`. |
| Design systems | Portable `DESIGN.md` files with 9 sections: Visual Theme, Color Palette, Typography, Component Stylings, Layout, Depth/Elevation, Do's & Don'ts, Responsive, and Agent Prompt Guide. |
| Artifact-first | OD makes sandboxed HTML output. You can export it as HTML, PDF, or Markdown. |
| Agent detection | OD looks for CLI executables on the system PATH to automate the design-to-code step. |

OD finds these agents: `copilot`, `claude`, `codex`, `gemini`, `cursor-agent`, `devin`, `qwen`, `qodercli`, `deepseek`, `hermes`, `kimi`, `kiro-cli`, `kilo`, `vibe-acp`, `code`, `pi`.

### The design loop

1. **Brief:** Enter a design brief.
2. **Direction:** Complete the question form to select a design direction.
3. **Artifact:** The agent generates an HTML artifact for preview.
4. **Export:** Export the artifact for implementation in the codebase.

### Install Open Design

1. Install Podman.
   - Windows: `winget install RedHat.Podman`, then `podman machine init`, then `podman machine start`.
   - Linux: `sudo apt-get install -y podman podman-compose`.
2. Clone the repository and start the containers:

   ```bash
   git clone https://github.com/nexu-io/open-design.git
   cd open-design/deploy
   podman compose up -d
   ```

3. Open `http://localhost:7456`.

| Task | Command |
| --- | --- |
| Show logs | `podman compose logs -f` |
| Restart | `podman compose restart` |
| Stop | `podman compose down` |
| Update | `podman compose pull && podman compose up -d` |

### Add a custom design system

Create `design-systems/<brand>/DESIGN.md` and restart OD. To extract tokens, attach a screenshot to OD.

### Connect the OD MCP server

The OD MCP server gives `search_files`, `get_file`, and `get_artifact` to VS Code Copilot.

1. Copy the JSON from OD **Settings** > **MCP server** to `.vscode/mcp.json`.
2. Use prompts such as `@workspace Read DESIGN.md and create matching component`.

## Penpot

Penpot is an SVG-based alternative to Figma. Workflow: Penpot Inspect panel > tokens > `DESIGN.md` > Open Design > MudBlazor or CSS implementation.

## Claude Design

Claude Design is a canvas-based design capability in Claude Code. Call the `design` skill to draft visual designs with more than one artboard (UI mockups, screen flows, landing pages, one-pagers). Claude Code publishes the result as an Artifact.

- **Access:** Run `claude` in the project root and use `/design`, or use the Claude Code panel in VS Code.
- **Output:** `.dc.html` artboards on one pan and zoom canvas. Refine the elements visually, then export PNG or PDF.

> **NOTE:** Verify the `/design` command and the `.dc.html` output format in your Claude Code version. The source does not give a reference for them.

Usage pattern:

1. **Brief:** Describe the screen or flow to Claude Design.
2. **Draft:** Review the artboards on the canvas. Adjust the text, spacing, and colour manually.
3. **Extract:** Tell Claude Code to make a `DESIGN.md` token set from the approved artboard.
4. **Standardize:** Load the `DESIGN.md` file into Open Design for governance and reuse.
5. **Implement:** Let Claude Code generate the MudBlazor or CSS components from the tokens.

### Compare Claude Design and Open Design

| Feature | Claude Design | Open Design |
| --- | --- | --- |
| Primary focus | Fast prompt-to-UI iteration on a canvas | Design system portability (`DESIGN.md`) |
| Deployment | Runs in Claude Code and publishes an Artifact | Local-first, self-hosted |
| Integration | The same session as the coding agent | More than one agent, MCP support |
| Workflow | Exploration first | Governance and standardization first |

## Image-to-code workflows

### Vision models

- **Models:** Use **Qwen2.5-VL 3B** or **Gemma 3 (4B)** for screenshot-to-code generation. They are the best fit for 16 GB RAM.
- **Runtime:** Use **Ollama** or **llama.cpp** with the necessary vision projector (`mmproj`) for image input. For llama.cpp downloads, flags, and projector use, read [llama.cpp portable runtime](doc:ai-agent-operational-model-llama-cpp#run-a-vision-model).

Get a model:

| Source | How |
| --- | --- |
| Ollama | `ollama pull qwen2.5vl:3b`. This is the simplest way. Ollama does the download and the quantization. |
| GGUF mirrors | Download GGUF files that are not gated from community mirrors (for example `ggml-org`). You do not need Hugging Face authentication. |
| Hugging Face | Gated models need a login and license acceptance. |

### Build llama.cpp from source (CPU only, Windows)

Use the prebuilt portable binaries (`*-bin-win-cpu-x64.zip`) or `winget install llama.cpp`. Build from source only if there is no prebuilt asset:

1. Install Git, Python 3.12, and CMake.
2. Configure the build with Vulkan, CUDA, and Metal off:

   ```bash
   cmake -B build -DGGML_VULKAN=OFF -DGGML_CUDA=OFF -DGGML_METAL=OFF
   ```

3. Build the project:

   ```bash
   cmake --build build --config Release
   ```

4. Run the server:

   ```cmd
   llama-server.exe -m <model>.gguf --mmproj <mmproj>.gguf --port 8080
   ```

### Vision prompts

Basic HTML:

```text
Convert this webpage screenshot into clean responsive HTML + Tailwind CSS. Preserve layout, spacing, typography, buttons, and colors. Return only HTML code.
```

Design-system aware: put the `DESIGN.md` tokens before the prompt.

```text
You are a frontend developer. Use ONLY the design tokens below: [Insert DESIGN.md tokens]. Convert this screenshot into responsive HTML + CSS. Return only HTML code.
```

Extraction:

```text
Extract a DESIGN.md from this screenshot: list color palette, typography, spacing scale, border radius, and shadow values.
```

### Performance

- On 16 GB RAM without a GPU, do not use models larger than 7B.
- Use Q4 quantized GGUF models for the best CPU performance.
- On CPU only, generation is slow (approximately 1-3 tokens/s).

## Reconstruct a website from screenshots

| Method | Steps | Use |
| --- | --- | --- |
| A: Open Design | See the procedure below. | Recommended for governance |
| B: Claude Code vision | Drag the screenshot into the Claude Code panel (or paste it in the terminal session) > prompt for implementation > review the diff > iterate. | Fast implementation |
| C: Claude Design | Attach the screenshot to `/design` > draw the screen again as artboards > adjust on the canvas > extract tokens into `DESIGN.md` > implement with Claude Code. | Exploration |
| D: Copilot vision | Attach the screenshot to Copilot Chat > prompt for implementation > iterate. | Copilot users |
| E: Ollama vision | `ollama pull llava` > use a service to send base64 images to `/api/generate`. | The screenshot has proprietary or customer data. |
| F: Hybrid | Claude Design (structure and tokens) > Open Design (`DESIGN.md` governance) > Claude Code or Copilot agent (generation) > Open Design `critique` (validation). | Full pipeline |

Method A with Open Design:

1. Put the screenshots in order by section (`01-header.png`, and so on).
2. In OD, select `DESIGN.md` and a skill, attach the screenshot, and add a brief.
3. Complete the question form, review the artifact, and export the HTML.
4. In VS Code, Copilot or Claude Code reads `DESIGN.md` through MCP and generates the code.
5. Validate: run `dotnet watch`, take a screenshot, run the OD `critique` skill, and iterate.

> **TIP:** Use one screenshot for each section, give the component library, and extract the colors first.

## Related links

- [Open Design](https://github.com/nexu-io/open-design)
- [Penpot](https://penpot.app/)
- [MudBlazor](https://mudblazor.com/)
- [Podman](https://podman.io/)
- [pnpm](https://pnpm.io/)
- [Inter font](https://rsms.me/inter/)
- [Google Stitch vision-to-UI workflow](doc:google-stitch-vision-to-ui)
