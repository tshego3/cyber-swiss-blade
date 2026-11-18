---
title: colibri local coding model on an Apple M4 with 16 GB
summary: Install colibri and the Qwen3-Coder-30B-A3B model on a 16 GB Apple M4 Mac, and connect it to VS Code through Cline.
category: AI and design
order: 140
---

# colibri local coding model on an Apple M4 with 16 GB

This guide installs colibri on a Mac with an Apple M4 chip, 16 GB of RAM, and a 250 GB SSD. colibri runs an AI model on your Mac, not on the internet. You install one coding model and connect it to VS Code, so the model can help you with your code.

> **NOTE:** All speed and RAM values in this article come from the [colibri documentation](https://github.com/JustVugg/colibri). Nobody measured them on an M4 with 16 GB.

## Before you start

- An internet connection for the download.
- 22 GB or more of free disk space, plus space for your projects.
- VS Code, from <https://code.visualstudio.com>.

## Terms

| Term | Meaning |
| --- | --- |
| Terminal | The macOS application where you type commands. To open it, push **Cmd + Space**, type `Terminal`, then push **Return**. |
| Command | A line of text in a code box. Copy it into Terminal, then push **Return**. |
| Model | The AI. It is a set of files on your disk. |
| Server | The colibri program that runs the model. VS Code sends your questions to it. |
| Token | A small part of a word. tok/s is tokens for each second. More tok/s gives faster replies. |
| Context window | The maximum text that the model can read in one conversation, including your code. |

## The model: Qwen3-Coder-30B-A3B

The model writes and explains code. It can use tools in VS Code extensions. The download size is 19.4 GB.

The documentation gives two RAM values, 8 GB and 18 GB:

| Free RAM for the model | Result |
| --- | --- |
| Less than 8 GB | The model does not start. |
| 8 GB to 18 GB | The model runs, but slower. colibri cannot keep all of the model in RAM, so it reads some parts from the disk. |
| 18 GB or more | The model runs at the documented speed. |

Your Mac has 16 GB, and macOS, VS Code, and your browser also use this RAM. Thus the model runs on your Mac, but slower than the documented speed. Do not use the larger models in the colibri list. They need too much RAM for this Mac.

## Check the disk space

```bash
df -h ~
```

**Result:** The value in the `Avail` column is `22G` or more.

## Install the tools

1. Check for Homebrew (a tool that installs other tools):
   ```bash
   brew --version
   ```
   If you see `command not found`, go to <https://brew.sh> and do the instructions on that page.
2. Install the Apple developer tools:
   ```bash
   xcode-select --install
   ```
   A window opens. Click **Install** and wait until it is complete.
3. Install the other tools:
   ```bash
   brew install libomp git python
   ```
4. Check the Python version:
   ```bash
   python3 --version
   ```
   **Result:** The version is 3.10 or higher.

## Download colibri

```bash
git clone https://github.com/JustVugg/colibri
cd colibri
```

> **NOTE:** Run all the next commands in the `colibri` folder. If you open a new Terminal window, type `cd colibri` first.

## Install the model

```bash
./start-here.sh --model qwen3-coder-30b --no-start --no-browser
```

colibri builds its program for your Mac. Then it downloads the model to `~/colibri-models/qwen3-coder-30b`. This can take a long time. If the download stops, run the same command again. It continues from where it stopped.

## Start the server

```bash
c/coli serve --model ~/colibri-models/qwen3-coder-30b --cap 32
```

- `--cap 32` makes colibri use less RAM, so more RAM stays free for VS Code and your other tools. The documentation gives 6.5 GB of RAM with `--cap 32`.
- Keep this Terminal window open. If you close it, the server stops.
- Wait for a line similar to `[gateway] 65536 tokens of context`. Write down this number. You need it when you [connect VS Code](#connect-vs-code). Your number can be different.

## Test the server

1. Open a second Terminal window and type `cd colibri`.
2. Run this command:
   ```bash
   curl http://127.0.0.1:8000/v1/chat/completions \
     -H 'Content-Type: application/json' \
     -d '{"model":"qwen3-coder-30b-a3b-colibri","messages":[{"role":"user","content":"hi"}]}'
   ```
   **Result:** The output includes a reply from the model. The first reply can take some time.

## Connect VS Code

1. In VS Code, click the **Extensions** icon on the left side (four squares).
2. Type `Cline` and click **Install**.
3. Open Cline, then open its settings.
4. Enter these values:

| Setting | Value |
| --- | --- |
| API Provider | `OpenAI Compatible` |
| Base URL | `http://127.0.0.1:8000/v1` |
| API Key | `local` (colibri does not check the key, but Cline needs a value) |
| Model ID | `qwen3-coder-30b-a3b-colibri` |
| Context window (if Cline shows this field) | The number from [Start the server](#start-the-server) |

> **CAUTION:** Do not enter a context window that is larger than the number from the server. If you do, Cline can stop with an error.

## Daily use

| Task | Action |
| --- | --- |
| Start | Open Terminal, type `cd colibri`, then run the command from [Start the server](#start-the-server). |
| Stop | Push **Ctrl + C** in the server Terminal window. |
| Update | Stop the server, then run `git pull` and `./start-here.sh --no-start --no-browser`. |

## What to expect

- The model runs on the CPU of your Mac. It is slower than an online AI service.
- The first question in Cline is the slowest, because Cline first sends approximately 5,500 tokens of instructions. This can take some minutes. Cline can look stopped, but it is not. Wait.
- The next questions are faster.
- Ask short, specific questions, for example "Explain this function." Long tasks with many steps are very slow.
- If your Mac becomes slow, open **Activity Monitor** and click **Memory**. If the **Memory Pressure** graph is yellow or red, close applications that you do not use.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| The download stopped | Run the command from [Install the model](#install-the-model) again. |
| `needs N GB free for the download` | Make more disk space free, then install the model again. |
| `command not found` for `c/coli` | You are not in the colibri folder. Go to it (for example `cd ~/colibri`), then try again. |
| The server test fails | Make sure that the server Terminal window is open. |
| Other problems | Show the install log with `c/coli logs --install`. Ask for help at <https://github.com/JustVugg/colibri/issues> and include the last lines of the log. |

## Related links

- [colibri on GitHub](https://github.com/JustVugg/colibri)
- [AI agent operational model](doc:ai-agent-operational-model)
- [llama.cpp portable runtime](doc:ai-agent-operational-model-llama-cpp)
