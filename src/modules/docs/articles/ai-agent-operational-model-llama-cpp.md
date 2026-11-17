---
title: llama.cpp portable runtime
summary: Download, configure, test, and connect the llama.cpp portable server as a local OpenAI-compatible endpoint, without an installer or admin rights.
category: AI and design
order: 30
gist: 930b58773dc848ae6611132f7a4a3362
---

# llama.cpp portable runtime

`llama.cpp` is the inference engine that Ollama wraps. The official release has prebuilt, self-contained binaries: nothing installs, no registry keys change, and no service registers. This article is part of the [local and hybrid AI agent operational model](doc:ai-agent-operational-model).

Use llama.cpp in these conditions:

- Per-user installers are blocked, or AppLocker blocks the Ollama installer.
- You need a runtime on a locked-down VM, a jump host, or a USB drive.
- You need a specific quantization, a raw GGUF file, or a vision projector that Ollama does not publish.
- You need direct control of the context size, the GPU layer offload, and the batch size.

## Before you start

- A user-writable folder, for example `%LOCALAPPDATA%\Programs\llamacpp`.
- For gated Hugging Face repositories, a token in the `HF_TOKEN` user environment variable.
- Documentation: [llama.app/docs/introduction](https://llama.app/docs/introduction) is the primary reference. It has **Getting Started** (Installation, Introduction, Quickstart), **Usage** (CLI tools, server, web UI, API reference), and **Tools** (benchmarking, quantization, evaluation). The source repository is [github.com/ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp).

> **NOTE:** Verify that `llama.app` is the official llama.cpp documentation site before you trust it. If you are not sure, use the README files in the GitHub repository.

## Download the correct build

1. Open the **Releases** page of `ggml-org/llama.cpp` and open the latest `b####` build.
2. Select the asset for the platform and the accelerator:

   | Platform | Asset |
   | --- | --- |
   | Windows CPU (safe default) | `llama-b####-bin-win-cpu-x64.zip` |
   | Windows NVIDIA | `llama-b####-bin-win-cuda-*-x64.zip` **and** the matching `cudart-llama-bin-win-cuda-*.zip`. Extract both into the same folder, or the server does not start. |
   | Windows AMD or Intel GPU | `llama-b####-bin-win-vulkan-x64.zip` |
   | macOS Apple Silicon | `llama-b####-bin-macos-arm64.zip` (Metal is built in) |
   | Linux | `llama-b####-bin-ubuntu-x64.zip` |

3. If the release shows older CPU variants (`avx2`, `avx512`, `noavx`), select `avx2`. Current CPU packages find the CPU features at runtime.

Alternative on Windows: `winget install llama.cpp`. It can ask for elevation, so use the zip.

## Set up the folder

1. Extract the zip to a stable, user-writable path, for example `%LOCALAPPDATA%\Programs\llamacpp`.
2. Keep the models in a sibling folder, for example `%LOCALAPPDATA%\Programs\llamacpp\models`. GGUF files are large. If the profile has a size limit, use a drive that does not roam.
3. Add the folder to the **user** PATH, so that you can call the binaries from all terminals.

Important binaries in the package:

| Binary | Use |
| --- | --- |
| `llama-server` | The OpenAI-compatible HTTP server and web UI. The IDE tools use this binary. |
| `llama-cli` | One-shot or interactive chat in the terminal. Use it to prove that a model loads. |
| `llama-bench` | Tokens-per-second benchmark for sizing decisions. |
| `llama-mtmd-cli` | Multimodal (vision) CLI. It replaces the old `llava-cli`. |
| `llama-quantize`, `llama-tokenize`, `llama-perplexity`, `llama-gguf-split` | Model utilities. |

## Get a model

**Automatic (recommended):** Give a Hugging Face repository and a quantization. The server downloads the file one time and caches it.

```cmd
llama-server -hf bartowski/Qwen2.5-Coder-7B-Instruct-GGUF:Q5_K_M --port 8080
```

- The cache is in `%LOCALAPPDATA%\llama.cpp` on Windows and in `~/.cache/llama.cpp` on macOS and Linux.
- Gated repositories need a token. Set `HF_TOKEN` in the user environment.

**Manual:** Download the `.gguf` file from the model card and give `-m <path>`. Use the `ggml-org` and `bartowski` mirrors, because they are not gated.

**Split models:** For a model that has files such as `...-00001-of-00003.gguf`, point `-m` at the **first** shard. Do not merge the files unless you need one file.

Quantization guide for 16 GB RAM:

| Quantization | Use |
| --- | --- |
| `Q4_K_M` | The balanced default |
| `Q5_K_M` | Better quality at a higher cost |
| `Q8_0` | Only for small models and embeddings |

## Start the server

Minimum command:

```cmd
llama-server -m models\qwen2.5-coder-7b-instruct-q5_k_m.gguf --port 8080
```

Production-style command for a coding model:

```cmd
llama-server ^
  -m models\qwen2.5-coder-7b-instruct-q5_k_m.gguf ^
  --alias qwen2.5-coder ^
  --host 127.0.0.1 --port 8080 ^
  -c 16384 ^
  -ngl 99 ^
  -t 8 ^
  --jinja ^
  --api-key local-dev-key
```

| Flag | Meaning |
| --- | --- |
| `-m` | Model path. `-hf` downloads from Hugging Face instead. |
| `--alias` | The model name that clients see. Set it, because Continue and Copilot BYOM show it. |
| `-c` | Context size in tokens. `0` reads the model default. If the server runs out of memory, decrease this value first. |
| `-ngl` | Number of layers offloaded to the GPU. Use `99` for "as many as fit" and `0` for CPU only. |
| `-t` | CPU threads. Use the number of physical cores, not logical cores. |
| `--jinja` | Applies the chat template of the model. **Necessary for tool calling** from agent clients. |
| `--api-key` | Clients must send a bearer token. Use it when the server binds to an address other than `127.0.0.1`. |
| `-np` | Parallel request slots. Increase it only if 2 tools send queries to the server at the same time. |
| `--flash-attn on`, `--cache-type-k q8_0` | Decrease KV cache memory on long contexts. |

- **Environment variables** (for a launcher script): `LLAMA_ARG_MODEL`, `LLAMA_ARG_PORT`, `LLAMA_ARG_HOST`, `LLAMA_ARG_CTX_SIZE`, `LLAMA_ARG_N_GPU_LAYERS`.
- **Endpoint:** `http://localhost:8080`. The OpenAI-compatible base URL is `http://localhost:8080/v1`.

> **NOTE:** One process serves one model. Ollama changes models on demand, but `llama-server` does not. For a second model, run a second server on port `8081`, or use the third-party `llama-swap` proxy if IT approves it.

## Test and verify the server

| Check | Command or action | Expected result |
| --- | --- | --- |
| Binary | `llama-server --version` | The build number and the detected backend |
| Health | `curl http://localhost:8080/health` | `{"status":"ok"}` when the model is loaded. HTTP 503 while it loads. |
| Model list | `curl http://localhost:8080/v1/models` | The `id` is the same as the `--alias` value. |
| Web UI | Open `http://localhost:8080` in the browser. | The built-in chat page works. This proves that the model, the template, and the tokenizer work. |
| Runtime state | `curl http://localhost:8080/props` | The loaded model, the context size, and the template. `/slots` shows the context use for each slot. |

Chat completion with bash and curl:

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer local-dev-key" \
  -d '{"model":"qwen2.5-coder","messages":[{"role":"user","content":"Write a C# method that reverses a string."}],"max_tokens":128}'
```

Chat completion with PowerShell:

```powershell
$body = @{
  model    = "qwen2.5-coder"
  messages = @(@{ role = "user"; content = "Write a C# method that reverses a string." })
} | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri http://localhost:8080/v1/chat/completions -Method Post -ContentType "application/json" -Body $body
```

Terminal smoke test without the server:

```cmd
llama-cli -m models\qwen2.5-coder-7b-instruct-q5_k_m.gguf -p "Explain a C# record in one sentence." -n 64 -no-cnv
```

Throughput benchmark:

```cmd
llama-bench -m models\<model>.gguf -p 512 -n 128
```

Record the prompt-eval rate and the token-generation rate before you use a model every day.

**Tool-calling check:** With `--jinja` set, send a request that has a `tools` array. Make sure that the response returns `tool_calls` and not JSON in the message text. If this check fails, the chat template is wrong, not the model.

**Acceptance criteria:** The health check returns `ok`, `/v1/models` shows the alias, a chat completion returns text, and `llama-bench` shows a usable generation rate. Connect the IDE tools only after all of these pass.

## Connect the clients

Point each client at `http://localhost:8080/v1`, not at the Ollama URL `http://localhost:11434/v1`.

| Client | Configuration |
| --- | --- |
| Continue | Set the provider to `openai`, `apiBase: http://localhost:8080/v1`, and `model` to the `--alias` value. If you set `--api-key`, give `apiKey`. |
| GitHub Copilot BYOM | Use the **OpenAI Compatible** provider and include the full `/v1` suffix. |
| LiteLLM | `litellm --model openai/<alias> --api_base http://localhost:8080/v1`. Keep `drop_params: true` in `litellm_settings`. Read [LiteLLM proxy layer](doc:ai-agent-operational-model-setup#add-the-litellm-proxy-layer). |
| Aider | `aider --model openai/<alias> --openai-api-base http://localhost:8080/v1 --openai-api-key local-dev-key` |
| Claude Code | Not applicable. Claude Code runs on Anthropic models and does not use a local endpoint. |

## Run an embeddings server for Continue

Continue uses embeddings for codebase indexing. Run a second, small server for embeddings only.

1. Start the server:

   ```cmd
   llama-server -hf nomic-ai/nomic-embed-text-v1.5-GGUF:Q8_0 --embedding --pooling mean --port 8081
   ```

2. Test it:

   ```bash
   curl http://localhost:8081/v1/embeddings -H "Content-Type: application/json" -d '{"input":"test"}'
   ```

   **Result:** The response has a vector array.

3. Point the Continue `embed` role at `http://localhost:8081/v1`.

## Run a vision model

A vision model needs the model **and** its projector (`mmproj`).

```cmd
llama-server -m models\qwen2.5-vl-3b-instruct-q4_k_m.gguf --mmproj models\mmproj-qwen2.5-vl-3b-f16.gguf --port 8080
```

The `-hf` form downloads the projector automatically:

```cmd
llama-server -hf ggml-org/Qwen2.5-VL-3B-Instruct-GGUF --port 8080
```

To test, send a base64 image in an `image_url` content block, or use the CLI:

```cmd
llama-mtmd-cli -m <model> --mmproj <mmproj> --image shot.png -p "Describe the layout."
```

For prompts, read [image-to-code workflows](doc:ai-agent-operational-model-design-to-code#image-to-code-workflows).

## Manage the server lifecycle

Start in the background (PowerShell):

```powershell
Start-Process -WindowStyle Hidden llama-server -ArgumentList '-m','models\model.gguf','--port','8080'
```

Stop the server with `Get-Process llama-server | Stop-Process`. On macOS and Linux, use `pkill -f llama-server`.

> **NOTE:** There is no keep-alive management. The model stays in memory until the process stops. Stop the server manually before a large Visual Studio build.

Shell aliases (PowerShell):

```powershell
function aiup { Start-Process -WindowStyle Hidden llama-server -ArgumentList '-m',"$env:LOCALAPPDATA\Programs\llamacpp\models\model.gguf" }
function aidown { Get-Process llama-server -ErrorAction SilentlyContinue | Stop-Process }
```

- **VS Code tasks:** Add "Start llama.cpp" and "Stop llama.cpp" entries to `.vscode/tasks.json`, the same as the Ollama tasks.
- **Updates:** Download the newer `b####` zip and extract it over the folder. The models do not change, because they are outside the folder.

## Compare with Ollama

| llama.cpp limit | Details |
| --- | --- |
| No model registry | You select and track GGUF files, quantizations, and projectors manually. |
| No model swap | There is no on-demand model change and no keep-alive timer. One process serves one model. |
| No auto-update | There is also no tray icon. |

In exchange, llama.cpp has no installation footprint, gives exact control of each runtime flag, and gives the newest engine builds on the release day.

## Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| AppLocker or WDAC blocks the binaries | The binaries are not signed. | Ask IT to allow the folder, or run the runtime on a shared internal host. |
| SmartScreen warning | The binary comes from the internet. | Select "More info", then "Run anyway". Or run `Unblock-File .\llama-server.exe`. |
| A DLL is missing at start | The CUDA build needs the matching `cudart` zip in the same folder. | Extract the `cudart` zip into the folder. If the error names a VC++ runtime DLL, use the CPU build. |
| The port is in use | Another process uses port 8080. | Run `netstat -ano \| findstr :8080`, then select a different port with `--port`. |
| Out of memory, or the process stops during load | The model and context are too large. | Decrease `-c` first. Then use a smaller quantization. Then decrease `-ngl`. |
| Very slow generation | The accelerator build is wrong. | Look at the backend in the startup log. If a CUDA build shows `CPU`, the driver or `cudart` is missing. |
| Garbled or repeated output | The server does not apply the chat template. | Add `--jinja`, or give an explicit `--chat-template`. |
| HTTP 404 from a client | The base URL does not have the `/v1` suffix. | Add `/v1` to the base URL. |
| Model-not-found error | The `model` field in the request is not the same as `--alias`. | Use the `--alias` value in the client. |
| CORS errors from a VS Code webview | The webview calls the server directly. | Bind to `127.0.0.1` and connect through the extension, or run LiteLLM in front of the server. |

## Related links

- [llama.cpp](https://github.com/ggml-org/llama.cpp)
- [llama.cpp releases (portable binaries)](https://github.com/ggml-org/llama.cpp/releases)
- [llama.cpp server docs](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md)
- [llama.cpp docs (llama.app)](https://llama.app/docs/introduction)
- [Hugging Face GGUF models](https://huggingface.co/models?library=gguf)
- [AI agent setup and installation](doc:ai-agent-operational-model-setup)
