---
title: Local and hybrid AI agent operational model
summary: Rules for local and cloud AI coding agents: the no-admin constraint, data governance, agent selection, cost tiers, risks, and links to the setup guides.
category: AI and design
order: 10
---

# Local and hybrid AI agent operational model

This operational model tells how a developer uses local AI agents (Ollama, llama.cpp) and cloud AI agents (GitHub Copilot, Claude Code) together on a managed workstation. Use it to select the correct agent for a task, keep proprietary data local, and control cost.

## Before you start

The model has these parts. Each part is a separate article.

| Article | Contents |
| --- | --- |
| [Setup and installation](doc:ai-agent-operational-model-setup) | Ollama, Node.js, Claude Code, Copilot CLI, VS Code, LiteLLM, model selection, and hardware |
| [llama.cpp portable runtime](doc:ai-agent-operational-model-llama-cpp) | A local LLM server without an installer |
| [IDE integrations](doc:ai-agent-operational-model-ide-integrations) | Claude Code, Copilot, and Continue in VS Code, Visual Studio, and SQL tools |
| [Dynamics 365 development](doc:ai-agent-operational-model-dynamics-365) | Claude Code with X++, AL, and Dataverse |
| [Methodology and workflows](doc:ai-agent-operational-model-methodology) | Plan and build steps, prompts, and verification |
| [Design-to-code workflows](doc:ai-agent-operational-model-design-to-code) | Open Design, Claude Design, and image-to-code |
| [Playwright web testing](doc:ai-agent-operational-model-playwright) | Automated browser tests with a coding agent |

## Operating constraint: no admin rights

This model assumes that the developer workstation is a managed corporate device with **no local administrator rights**.

- Every core tool installs into the user profile (`%LOCALAPPDATA%` or `%USERPROFILE%`). There is no UAC prompt, no `Program Files` folder, and no service registration.
- **Rule:** Use per-user installers and portable archives. Do not use `winget` without `--scope user`. Do not use MSI packages. Do not use a tool that registers a Windows service.

These items need admin rights or help from IT:

| Item | Problem | Fix |
| --- | --- | --- |
| Podman or Docker | Needs WSL2 or Hyper-V. | Ask IT to provision it, or run Open Design on a shared internal host. |
| AppLocker or WDAC | Can block unsigned executables in the user profile, also without admin rights. | Ask IT to allow the folder. |
| Corporate proxy or TLS inspection | Can stop model downloads and npm installs. | Set `HTTPS_PROXY` and `NODE_EXTRA_CA_CERTS` as IT tells you. |

## Hybrid agent selection

### Decision matrix

| Attribute | Local agent (Ollama) | Cloud agent (Copilot or Claude Code) | Selection driver |
| --- | --- | --- | --- |
| Sensitivity | Mandatory for proprietary data and PII | Strictly prohibited | Sensitivity (hard gate) |
| Complexity | Implementation and patches | High-level architecture | Complexity |
| Context size | Trimmed context packs | Full project context | Context volume |
| Cost | Free, local hardware | Subscription and API costs | Budget |

### Execution scenarios

- **Local-first:** The default for implementation, bug fixes, and proprietary code.
- **Cloud-first:** Use for first brainstorming, high-level system design with sanitized requirements, and complex architecture mapping.

### Plan in the cloud, build locally

1. **Planning:** The cloud agent breaks high-level requirements into a detailed implementation plan. It uses abstract descriptions.
2. **Execution:** The local agent generates the code and verifies that it compiles.

### Escalation path

If a local agent fails 2 times on a step, do these steps:

1. **Anonymize:** Extract the failing code, remove proprietary IDs, and make the logic abstract.
2. **Consult:** Send the anonymized snippet to the cloud agent for a high-level fix.
3. **Apply:** Adapt the cloud suggestion manually with the local agent.

## Governance, security, and compliance

Strict data boundaries are mandatory. They prevent leaks of intellectual property.

### Data classification

- **Local-only execution:** Only local LLM instances can process proprietary code, internal API keys, PII, and regulated data.
- **Cloud agents:** Use them only for sanitized, anonymized requirements or public-domain research.

Do not use a cloud agent for these tasks:

- Upload production secrets or internal credentials.
- Process customer PII or sensitive financial data.
- Generate core security modules with cloud models that are not approved.

### Credentials and secrets

- **No plaintext secrets:** Do not keep API keys or tokens as plaintext in configuration files (for example `.env` or `config.yaml`).
- **Secure storage:** Use environment variables or a secure store (macOS Keychain, Windows Credential Manager, HashiCorp Vault).
- **No commits:** Exclude all secrets from version control with `.gitignore`.

### Model governance

- **Approved model list:** Use only models that are validated for license compliance and performance (for example Qwen2.5-Coder).
- **Audit trail:** Record each significant AI-assisted architecture change in the commit message or ticket. Include the model and the human reviewer.
- **Human in the loop:** A human must review all AI-generated code. The code must pass the CI/CD lint and test gates before the merge.

## Cost management

### Cheap-first model strategy

A cheap-first model selection is mandatory. Use the lowest-cost model that can do the task.

| Tier | Models | Use |
| --- | --- | --- |
| Tier 0 (free) | Local Ollama models (for example Qwen2.5-Coder 7B) | The default for 90% of implementation tasks |
| Tier 1 (discounted, lightweight) | Lightweight cloud models (for example Claude Haiku 4.5, or a small model in the Copilot model picker) | Routine refactoring, unit test generation, and documentation |
| Tier 2 (premium, frontier) | Frontier models (for example Claude Opus 5, Claude Sonnet 5) | Only for first system architecture, complex bug resolution, and dead-end recovery |

### Model selection examples

| Task | Recommended model | Reason |
| --- | --- | --- |
| Add a simple field to a DTO | Local (for example Qwen2.5-Coder) | Low complexity, no sensitive logic |
| Write unit tests for a service | Lightweight (for example Claude Haiku 4.5) | Repeated structure, basic logic |
| Routine code patches and refactors | Lightweight (for example Claude Haiku 4.5) | High frequency, low-risk edits |
| Design a new microservice API | Frontier (for example Claude Opus 5 or Sonnet 5) | Needs high-level architecture reasoning |
| First system decomposition | Frontier (for example Claude Opus 5 or Sonnet 5) | Complex mapping of requirements to structure |
| Fix a non-deterministic race condition | Frontier (for example Claude Opus 5 or Sonnet 5) | Needs deep reasoning and edge-case analysis |
| Dead-end recovery after failed local attempts | Frontier (for example Claude Opus 5 or Sonnet 5) | Gets past logic blocks when local models fail |
| Generate boilerplate for a new project | Local (for example Qwen2.5-Coder) | Mechanical task, much code |

### Cost control in the tools

- **Copilot model picker:** In the Copilot Chat panel, change to a smaller, cheaper model for tasks that are not critical.
- **Token budget:** Do not use the chat for simple edits. Use **Inline Chat** (`Ctrl+I`) with a lightweight model. This keeps context overhead and token cost low.
- **Claude Code:** Use `/model` to change to a cheaper model for mechanical steps. Use `/cost` to see the session spend. Use `/compact` or `/clear` to stop context carry-over.

### Cloud agent token awareness

- **Prompt efficiency:** Use symbol-level retrieval. Use summaries for files with more than 200 lines.
- **Context pruning:** Remove completed steps and snippets from the context pack immediately.
- **Model switching:** Change from a frontier model to a discounted model when the high-level architecture direction is set.
- **Artifact reuse:** Keep sanitized architecture patterns in a local library. Then you do not pay cloud tokens to generate them again.

### Local optimization

- **Resource tuning:** Use only the Q4_K_M or Q5_K_M quantizations for 7B models.
- **Stability:** Do not load more than one model at the same time. This keeps the IDE stable.

## Risks and mitigations

| Risk | Scenario | Mitigation |
| --- | --- | --- |
| Hallucinations | The model suggests methods or libraries that do not exist. | Put the real interface signatures in the context pack. |
| Context drift | The model loses the original goal. | Read the goal again every 3 steps. Remove context that is not related. |
| Full file rewrites | The model replaces the full file and does not patch it. | Use inline selection (`Ctrl+I`) to force patch-style output. |
| DI misses | The model forgets the dependency injection registration. | Make DI registration an explicit task and a mandatory build gate. |

Operational constraints:

- **Hardware bound:** Performance depends on unified memory or RAM. Do not use local models when the system load is high.
- **Human in the loop:** AI agents are assistants. A human must verify every line of code, and the code must compile.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Slow completions | Use Q4_K_M quantizations. Decrease `max_tokens` in the extension settings. Decrease the number of open IDE windows. |
| Connection failures | Make sure that `ollama serve` runs. Make sure that the endpoint and the model name match exactly. For Copilot, make sure that the URL includes the `/v1/chat/completions` suffix. |
| High memory use | Run `ollama stop <model>` or `pkill -f 'ollama serve'` to release system RAM. |
| CORS errors | Set the environment variable `OLLAMA_ORIGINS="vscode-webview://*"` and restart the Ollama service. |

> **NOTE:** Verify the URL format that your Copilot version expects. This table says to include `/v1/chat/completions`, but the [llama.cpp client setup](doc:ai-agent-operational-model-llama-cpp#connect-the-clients) uses the `/v1` base URL. Copilot BYOM endpoint settings changed between releases.

## Related links

- [Open Design](https://github.com/nexu-io/open-design)
- [Penpot](https://penpot.app/)
- [MudBlazor](https://mudblazor.com/)
- [Ollama](https://ollama.com/)
- [llama.cpp](https://github.com/ggml-org/llama.cpp)
- [llama.cpp releases (portable binaries)](https://github.com/ggml-org/llama.cpp/releases)
- [llama.cpp server docs](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md)
- [llama.cpp docs (llama.app)](https://llama.app/docs/introduction)
- [Hugging Face GGUF models](https://huggingface.co/models?library=gguf)
- [GitHub Copilot](https://github.com/features/copilot)
- [Blazor SSR](https://learn.microsoft.com/aspnet/core/blazor/)
- [Podman](https://podman.io/)
- [pnpm](https://pnpm.io/)
- [Claude Code](https://claude.com/claude-code)
- [Claude Docs](https://docs.claude.com/en/docs/claude-code/overview)
- [Continue](https://continue.dev/)
- [Inter font](https://rsms.me/inter/)
- [Playwright](https://playwright.dev/)
- [Playwright MCP server](https://github.com/microsoft/playwright-mcp)
