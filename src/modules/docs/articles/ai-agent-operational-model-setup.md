---
title: AI agent setup and installation
summary: Install Ollama, Node.js, Claude Code, GitHub Copilot CLI, VS Code, and LiteLLM without admin rights, and select local models for your hardware.
category: AI and design
order: 20
---

# AI agent setup and installation

This article tells how to install the local and cloud AI agent tools on Windows, macOS, and Linux. The Windows path is the reference path for a device without admin rights. It is part of the [local and hybrid AI agent operational model](doc:ai-agent-operational-model).

## Before you start

- A user account without admin rights is sufficient for all tools except Podman. Read the [no-admin constraint](doc:ai-agent-operational-model#operating-constraint-no-admin-rights).
- 16 GB RAM minimum (recommended).
- If you cannot use the Ollama installer, use the [llama.cpp portable runtime](doc:ai-agent-operational-model-llama-cpp).

## Install on Windows without admin rights

### Ollama (local LLM runner)

1. Download `OllamaSetup.exe` from [ollama.com/download](https://ollama.com/download) and run it. It installs for the current user into `%LOCALAPPDATA%\Programs\Ollama` without elevation.
2. Ollama keeps models in `%USERPROFILE%\.ollama`. If the profile has a size limit or roams, set the `OLLAMA_MODELS` environment variable to a different folder.
3. Verify the installation: run `ollama --version`, then `ollama serve`.

> **WARNING:** Do not use `winget install Ollama.Ollama`. It can ask for elevation.

### Node.js (needed for the agent CLIs)

1. Download the Windows **.zip** build from [nodejs.org](https://nodejs.org/).
2. Extract it to `%LOCALAPPDATA%\Programs\nodejs`.
3. Add that folder to the user PATH.
4. Verify: run `node --version` and `npm --version`.

Alternative: `winget install OpenJS.NodeJS --scope user`.

### Claude Code

1. Run the official per-user install script. It puts a self-contained binary in the user profile without elevation.

   ```powershell
   irm https://claude.ai/install.ps1 | iex
   ```

2. Verify: run `claude --version`, then `claude doctor`.

Alternative: when Node.js is on the user PATH, run `npm install -g @anthropic-ai/claude-code`.

### GitHub Copilot CLI

Run `npm install -g @github/copilot`. Verify with `copilot --version`.

### Visual Studio Code

Use the **User Installer** (`VSCodeUserSetup-x64.exe`) from [code.visualstudio.com](https://code.visualstudio.com/). It installs to `%LOCALAPPDATA%\Programs\Microsoft VS Code` without elevation.

Alternative: extract the portable **.zip** build to a folder in the user profile.

### Python and LiteLLM (optional proxy layer)

1. Install Python from [python.org](https://www.python.org/) and select **Install for me only**. Alternative: `winget install Python.Python.3.12 --scope user`.
2. Install pipx and LiteLLM:

   ```powershell
   pip install --user pipx
   pipx install 'litellm[proxy]'
   ```

### PowerShell execution policy

If PowerShell blocks scripts, run this command. The `CurrentUser` scope needs no admin rights.

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### Podman (admin rights necessary)

Podman needs WSL2, and thus help from IT. Only self-hosted Open Design needs it.

```powershell
winget install RedHat.Podman
podman machine init
podman machine start
```

## Install on macOS

| Tool | Installation |
| --- | --- |
| Homebrew | `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`. A standard `/opt/homebrew` installation asks for a password. On a locked-down device, use a prefix that the user can write to. |
| Ollama | Download the `Ollama.app` DMG and drag it to `~/Applications`. This prevents an admin prompt. Alternative: `brew install ollama`. |
| Claude Code | `curl -fsSL https://claude.ai/install.sh \| bash`, or `npm install -g @anthropic-ai/claude-code`. |
| GitHub Copilot CLI | `brew install copilot-cli` or `npm install -g @github/copilot`. |
| Visual Studio Code | Download from [code.visualstudio.com](https://code.visualstudio.com/) and put it in `~/Applications`. |
| Podman | Install with Homebrew or download the official binary. Machine creation can ask for a password. |

## Install on Linux

| Tool | Installation |
| --- | --- |
| Ollama (no root) | Extract the official tarball into `~/.local` and run `~/.local/bin/ollama serve`. The script `curl -fsSL https://ollama.com/install.sh \| sh` needs `sudo` because it registers a service. |
| Claude Code | `curl -fsSL https://claude.ai/install.sh \| bash` installs to `~/.local/bin`. |
| Podman (Debian) | `sudo apt-get install -y podman podman-compose` |
| Podman (Fedora) | `sudo dnf install -y podman podman-compose` |

Rootless Podman also needs a one-time installation as root.

## Select models and hardware

Select a model that your hardware can run. This keeps the system stable.

### Hardware requirements

- **RAM:** 16 GB minimum (recommended).
- **VRAM:** Use quantized models (**Q4_K_M** or **Q5_K_M**). A 7B quantized model usually uses 4-6 GB VRAM. This leaves sufficient memory for the IDE and the operating system.

### Recommended models

| Role | Model | Use |
| --- | --- | --- |
| Coding agent | Qwen2.5-Coder 7B | Primary choice for structured code, documentation reasoning, and tool calling |
| Reasoning | DeepSeek-R1 7B/8B | Complex debugging, mathematical logic, and deep reasoning |
| Fast helper | Qwen2.5-Coder 1.5B | Simple patches, title generation, and fast iterations |
| General and image | Gemma 3/4 | Fast performance with deep context and multimodal support |

## Operate Ollama

Start the server with `ollama serve`. The endpoint is `http://localhost:11434`.

| Task | Command |
| --- | --- |
| Pull a model | `ollama pull <model_name>`, for example `ollama pull qwen2.5-coder:7b-instruct-q5_K_M` |
| List installed models | `ollama list` |
| Show loaded models | `ollama ps` |
| Remove a model | `ollama rm <model_name>` |
| Run and test a model | `ollama run <model_name>` (press `Ctrl+d` to exit) |
| Stop a model | `ollama stop <model_name>` |

To make sure that the API responds, run this command:

```bash
curl http://localhost:11434/api/generate -d '{"model": "qwen2.5-coder:7b-instruct-q5_K_M", "prompt": "Write a TS function"}'
```

GitHub Copilot BYOM (OpenAI-compatible endpoint) and Continue use the local Ollama models. Claude Code runs on Anthropic models and does not connect to Ollama.

### Memory management

- **Keep-alive:** By default, Ollama keeps a model in RAM for 5 minutes.
- **Release memory manually:** Run `ollama stop <model_name>` to get VRAM back before you start a tool that uses much memory (for example Xcode, iOS simulators, or a large Visual Studio build).

### Maintenance

- **Updates:** Update Ollama from its tray icon or run `OllamaSetup.exe` again (Windows). On macOS, run `brew upgrade ollama`. Update the agent CLIs with `claude update` and `npm update -g @github/copilot`. Do not use `winget upgrade`, because it can ask for elevation.
- **Connectivity:** If the IDE cannot connect, make sure that `ollama serve` runs.
- **CORS:** Set `OLLAMA_ORIGINS="vscode-webview://*"` to fix webview connection errors.

### Start and stop on demand

- **VS Code tasks:** Add start and stop tasks to `.vscode/tasks.json` (for example with the labels "Start Ollama" and "Stop Ollama").
- **Shell aliases:** Add aliases to the shell profile:

  ```bash
  alias aiup='nohup ollama serve >/tmp/ollama.out 2>&1 &'
  alias aidown="pkill -f 'ollama serve'"
  ```

## Set up the Claude Code CLI

1. **Install:** Use the per-user install script (no admin rights necessary), or run `npm install -g @anthropic-ai/claude-code`.
2. **Sign in:** Run `claude` and complete the browser login (Claude subscription or Anthropic Console). Alternative: set the `ANTHROPIC_API_KEY` environment variable.
3. **Verify:** Run `claude --version`. Make sure that `claude` is on the PATH with `Get-Command claude` (Windows) or `which claude` (Linux and macOS). Run `claude doctor` for a health check.

| Task | Command |
| --- | --- |
| Start an interactive session | Run `claude` in the project root. |
| Run one prompt | `claude -p "Explain the auth flow in this repository"` |
| Continue the last session | `claude --continue` |
| Select a session to resume | `claude --resume`, or `/resume` in a session |
| Select the model | `/model` in the session |
| Change between plan mode and auto-accept mode | Press `Shift+Tab`. |
| Start a clean session in the same project | `/clear` |
| Delete history | `claude project purge`. Add `--all --yes` to delete everything without the confirmation prompt. |

> **NOTE:** Verify `claude project purge` and its `--all --yes` flags with `claude --help` before you use them. They are not in the main Claude Code CLI reference.

For more Claude Code commands and VS Code use, read [IDE integrations](doc:ai-agent-operational-model-ide-integrations).

## Set up the GitHub Copilot CLI

1. **Install:** Run `npm install -g @github/copilot` (no admin rights necessary when Node.js is on the user PATH). On macOS and Linux, you can also run `brew install copilot-cli`.
2. **Sign in:** Run `copilot`, then `/login`, and complete the browser OAuth flow. Alternative: set one of the environment variables `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, or `GITHUB_TOKEN`.
3. **Verify:** Run `copilot --version`. Make sure that `copilot` is on the PATH with `which copilot` (Linux and macOS) or `Get-Command copilot` (Windows).

| Task | Command |
| --- | --- |
| Interactive mode | `copilot` |
| Direct query | `copilot "Explain how async/await works in C#"` |
| Suggest a command | `copilot suggest "find all .razor files modified today"` |
| Explain a command | `copilot explain "git rebase -i HEAD~3"` |

> **NOTE:** Dated (checked November 2026): The `suggest` and `explain` subcommands come from the `gh copilot` extension (`gh copilot suggest`, `gh copilot explain`), which GitHub retired in October 2025. The `@github/copilot` CLI does not have them. Give the request as a direct prompt, for example `copilot -p "find all .razor files modified today"`.

The CLI can sometimes return "Done." and not produce an artifact. The recommended fix is a **BYOK proxy**, for example the GitHub Models base URL `https://models.inference.ai.azure.com` with a GitHub PAT.

> **NOTE:** Dated (checked November 2026): GitHub Models moved from `https://models.inference.ai.azure.com` to `https://models.github.ai/inference`. Use the new base URL.

## Add the LiteLLM proxy layer

LiteLLM changes Ollama endpoints into OpenAI-compatible schemas. It prevents tool-calling format bugs and gives compatibility with strict schema requirements.

1. Install LiteLLM: `pipx install 'litellm[proxy]'`.
2. Run the proxy:

   ```bash
   litellm --model ollama/qwen2.5-coder:7b-instruct-q5_K_M
   ```

3. Prevent raw JSON leakage, a frequent limitation of the Ollama `/v1` adapter. Add `drop_params: true` to the `litellm_settings` section of `litellm-config.yaml`. LiteLLM then drops tool-call parameters that the model does not support, without a message.

## Add more tools (optional)

| Tool | Installation and use |
| --- | --- |
| Open WebUI | `pipx install open-webui`. A browser chat interface. Use the `--host` flag to show the UI on a local network. |
| Aider | `pipx install aider-chat`. AI pair programming in the terminal. Start it with `OLLAMA_API_BASE=http://127.0.0.1:11434 aider --model ollama/<model>`. |
| LangChain-Ollama | For custom AI automation scripts with the `langchain-ollama` and `langchain-community` packages. |

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "running scripts is disabled" (Windows) | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. |
| The CLI is not on the PATH after `npm install` | Run `npm config get prefix` and add that folder to the PATH. |
| The CLI stops working after you change the Node.js version with nvm | Install the CLI again. |
| The IDE cannot connect to Ollama | Make sure that `ollama serve` runs. |

## Related links

- [Ollama download](https://ollama.com/download)
- [Node.js](https://nodejs.org/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Python](https://www.python.org/)
- [llama.cpp portable runtime](doc:ai-agent-operational-model-llama-cpp)
- [IDE integrations](doc:ai-agent-operational-model-ide-integrations)
