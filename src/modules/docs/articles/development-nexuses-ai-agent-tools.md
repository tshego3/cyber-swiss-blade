---
title: Development nexuses: AI agent tools and prompts
summary: Set up the TokenEconomizer plugin, Claude Code notifications with Telegram, and local Ollama models, and reuse prompt templates for AI agents.
category: Reference
order: 30
gist: 7d918ed092732c842802a302df4de443
---

# Development nexuses: AI agent tools and prompts

This article holds notes for AI coding agents. It covers the TokenEconomizer plugin for Claude Code, Claude Code notifications, local models with Ollama, and prompt templates.

## Before you start

| Item | Requirement |
| --- | --- |
| TokenEconomizer | Claude Code 2.1.300 to 2.1.310, Python 3.10 or later on `PATH`, and Git for Windows on Windows. |
| Linux notifications | `notify-send`. |
| Telegram hook on macOS or Linux | `jq` and `curl`. |
| Local models | Ollama and Open WebUI. |

## TokenEconomizer plugin

TokenEconomizer is a Claude Code plugin. It uses Claude Code hooks and records each session in `~/.tokeneconomizer`, with one folder for each repository.

### How it works

| Feature | Default | What it does |
| --- | --- | --- |
| Micro-skills | Off | At session end, the plugin collects facts about the repository. At the next session start, it adds these facts to the context. |
| Tool pruning | On | The plugin finds tools that stay unused for 10 prompts in 2 sessions, or for 5 sessions. It adds a `permissions.deny` rule for each tool to `.claude/settings.local.json`. The rule removes the tool from the next session. The plugin does not remove interactive tools. |
| Loop guard | On | The plugin learns the usual size of a successful turn in the repository. If a turn has repeated failures, a judge model decides if the turn is stuck. If a turn is 2.5 times the usual size, the plugin acts without the judge. |

For a stuck turn, the plugin first sends Claude a redirect. If the turn stays stuck, the plugin notifies you. It never stops the turn.

The plugin sends only summaries to a model, through your Claude Code. It never sends file contents.

### Install the plugin

1. Clone the repository. Do not move the clone after the install.

   ```bash
   git clone https://github.com/microsoft/TokenEconomizer.git
   ```

2. Add the marketplace. Use an absolute path with forward slashes.

   ```bash
   claude plugin marketplace add C:/Users/%USERNAME%/source/repos/TokenEconomizer
   ```

3. Install the plugin.

   ```bash
   claude plugin install tokeneconomizer@tokeneconomizer
   ```

4. Start Claude Code in a project.
5. Run `/tokeneconomizer:status`. If Claude Code asks for permission, select "always".
6. Run `/tokeneconomizer:toolprune refresh-catalog`. Run it again after each Claude Code update.

### Use the plugin

| Command | Effect |
| --- | --- |
| `/tokeneconomizer:status` | Shows learned data and session cost. |
| `/tokeneconomizer:toolprune` | Shows removed tools. |
| `/tokeneconomizer:toolprune restore` | Puts back removed tools. |
| `/tokeneconomizer:config` | Shows the configuration. |
| `/tokeneconomizer:config set microskills=on` | Turns on micro-skills. Add `--global` for all repositories. |

### Update the plugin

1. Run `git pull` in the clone.
2. Run `/reload-plugins`.

### Uninstall the plugin

1. Run `/tokeneconomizer:toolprune restore` in each repository.
2. Run these commands:

   ```bash
   claude plugin uninstall tokeneconomizer@tokeneconomizer
   claude plugin marketplace remove tokeneconomizer
   ```

## Claude Code notifications

Use hooks to get an operating system notification when Claude Code finishes. The hooks work with the CLI and with VS Code.

| Event | When it occurs |
| --- | --- |
| `Stop` | Claude finished its response. |
| `Notification` with the matcher `idle_prompt` | Claude waits for input. |

Use both events to get both notifications. Use `Stop` only to prevent duplicate notifications. Put the hooks in `~/.claude/settings.json`, so that they apply to all projects.

### Add the desktop notification

1. Open `~/.claude/settings.json`.
2. Add the block for your operating system.
3. Run `/hooks` in Claude Code.
4. Start a task and switch to a different app.

   **Result:** The notification shows.

macOS:

```json
{
  "hooks": {
    "Notification": [{
      "matcher": "idle_prompt",
      "hooks": [{
        "type": "command",
        "command": "osascript -e 'display notification \"Claude is waiting\" with title \"Claude Code\"'"
      }]
    }],
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "osascript -e 'display notification \"Claude finished\" with title \"Claude Code\"'"
      }]
    }]
  }
}
```

Linux (needs `notify-send`):

```json
{
  "hooks": {
    "Notification": [{
      "matcher": "idle_prompt",
      "hooks": [{
        "type": "command",
        "command": "notify-send 'Claude Code' 'Claude is waiting'"
      }]
    }],
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "notify-send 'Claude Code' 'Claude finished'"
      }]
    }]
  }
}
```

Windows (uses the PowerShell native toast notification):

```json
{
  "hooks": {
    "Notification": [{
      "matcher": "idle_prompt",
      "hooks": [{
        "type": "command",
        "command": "powershell -NoProfile -Command \"[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null; \\$template = [Windows.UI.Notifications.ToastTemplateType]::ToastText02; \\$xml = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent(\\$template); \\$textNodes = \\$xml.GetElementsByTagName('text'); \\$textNodes.Item(0).AppendChild(\\$xml.CreateTextNode('Claude Code')) | Out-Null; \\$textNodes.Item(1).AppendChild(\\$xml.CreateTextNode('Claude is waiting')) | Out-Null; \\$toast = [Windows.UI.Notifications.ToastNotification]::new(\\$xml); [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('WindowsPowerShell').Show(\\$toast)\""
      }]
    }],
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "powershell -NoProfile -Command \"[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null; \\$template = [Windows.UI.Notifications.ToastTemplateType]::ToastText02; \\$xml = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent(\\$template); \\$textNodes = \\$xml.GetElementsByTagName('text'); \\$textNodes.Item(0).AppendChild(\\$xml.CreateTextNode('Claude Code')) | Out-Null; \\$textNodes.Item(1).AppendChild(\\$xml.CreateTextNode('Claude finished')) | Out-Null; \\$toast = [Windows.UI.Notifications.ToastNotification]::new(\\$xml); [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('WindowsPowerShell').Show(\\$toast)\""
      }]
    }]
  }
}
```

### Send notifications to Telegram

The Telegram hook sends the Claude reply to your phone. The desktop notifications continue to work.

#### Create the bot

1. In Telegram, open [t.me/BotFather](https://t.me/BotFather) and send `/newbot`.
2. Enter a name, for example `Dev Alerts`.
3. Enter a username that ends in `bot`, for example `dev_alerts_1234_bot`.
4. Copy the token. Keep it private. If the token leaks, send `/token` to BotFather.

#### Get your chat ID

1. Open your bot in Telegram, press **/start**, and send `hi`.
2. In PowerShell, run this command. Replace `<TOKEN>` with your token.

   ```powershell
   (Invoke-RestMethod "https://api.telegram.org/bot<TOKEN>/getUpdates").result[0].message.chat.id
   ```

3. Copy the number. If no number shows, send the bot one more message and run the command again.

#### Save the token and chat ID

On Windows, run these commands:

```cmd
setx TELEGRAM_BOT_TOKEN "<TOKEN>"
setx TELEGRAM_CHAT_ID "<CHAT_ID>"
```

On macOS or Linux, add these lines to `~/.zshrc` or `~/.bashrc`:

```bash
export TELEGRAM_BOT_TOKEN="<TOKEN>"
export TELEGRAM_CHAT_ID="<CHAT_ID>"
```

Close and open the terminal and VS Code again.

#### Save the script

On Windows, save this script as `~/.claude/hooks/telegram.ps1`:

```powershell
[Console]::InputEncoding = [Text.Encoding]::UTF8
$in = [Console]::In.ReadToEnd() | ConvertFrom-Json
foreach ($n in "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID") {
  if (-not [Environment]::GetEnvironmentVariable($n)) {
    [Environment]::SetEnvironmentVariable($n, [Environment]::GetEnvironmentVariable($n, "User"))
  }
}
$text = $in.last_assistant_message
if (-not $text) { $text = $in.message }
if (-not $text) { $text = 'Claude finished' }
$project = Split-Path -Leaf $in.cwd
$text = "[$project] $text"
if ($text.Length -gt 4000) { $text = $text.Substring(0, 4000) }
$body = @{ chat_id = $env:TELEGRAM_CHAT_ID; text = $text } | ConvertTo-Json
try {
  Invoke-RestMethod -Method Post `
    -Uri "https://api.telegram.org/bot$($env:TELEGRAM_BOT_TOKEN)/sendMessage" `
    -ContentType 'application/json; charset=utf-8' `
    -Body ([Text.Encoding]::UTF8.GetBytes($body)) | Out-Null
} catch { }
exit 0
```

On macOS or Linux, save this script as `~/.claude/hooks/telegram.sh`. Then run `chmod +x ~/.claude/hooks/telegram.sh`.

```bash
#!/usr/bin/env bash
text=$(jq -r '"[" + (.cwd | split("/") | last) + "] " + (.last_assistant_message // .message // "Claude finished") | .[0:4000]')
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
  --data-urlencode "text=${text}" > /dev/null
exit 0
```

#### Add the hook

In `~/.claude/settings.json`, add the Telegram line under each desktop line. Keep the desktop lines. `<DESKTOP COMMAND>` is the command from your operating system block above.

```json
{
  "hooks": {
    "Notification": [{
      "matcher": "idle_prompt",
      "hooks": [
        { "type": "command", "command": "<DESKTOP COMMAND>" },
        { "type": "command", "command": "powershell -NoProfile -ExecutionPolicy Bypass -File \"$HOME/.claude/hooks/telegram.ps1\"", "shell": "powershell" }
      ]
    }],
    "Stop": [{
      "hooks": [
        { "type": "command", "command": "<DESKTOP COMMAND>" },
        { "type": "command", "command": "powershell -NoProfile -ExecutionPolicy Bypass -File \"$HOME/.claude/hooks/telegram.ps1\"", "shell": "powershell" }
      ]
    }]
  }
}
```

On macOS or Linux, use `"command": "~/.claude/hooks/telegram.sh"` for the Telegram lines.

#### Test the hook

1. Open a new terminal.
2. Run the command for your operating system.

   Windows (PowerShell):

   ```powershell
   '{"cwd":"C:/demo","last_assistant_message":"Test"}' | powershell -NoProfile -ExecutionPolicy Bypass -File "$HOME/.claude/hooks/telegram.ps1"
   ```

   macOS or Linux:

   ```bash
   echo '{"cwd":"/demo","last_assistant_message":"Test"}' | ~/.claude/hooks/telegram.sh
   ```

   **Result:** The bot sends `[demo] Test`. The command itself shows no output.

## Run models locally with Ollama

Use these commands to run local models with Ollama and Open WebUI.

```bash
ollama serve # Access server at http://localhost:11434/
# Pass the prompt as an argument
ollama run deepseek-coder:6.7b "Write a TypeScript function that adds two numbers."
# Start the Open WebUI server
open-webui serve --host 192.168.1.102 --port 8080 # Access server at http://192.168.1.102:8080/
# Generate Git commit message, use the Continue extension command @Git Diff to send the git diff to your local LLM.
#   @Git Diff Write a simple commit message summarizing the modifications
# List running models
ollama ps
# Stop individual running model
ollama stop deepseek-r1:7b-qwen-distill-q4_K_M
# Or stop all running models
ollama stop all
# Verify nothing is running
ollama ps
# Launch opencode
ollama launch opencode --model qwen2.5-coder:7b-instruct-q4_K_M
```

To write a Git commit message with the local model, use the Continue extension command `@Git Diff`. It sends the Git diff to the local model. Example prompt: `@Git Diff Write a simple commit message summarizing the modifications`.

## Prompt templates

Replace the text in square brackets with your values.

### Administration

- Generate a Git commit message based on the changes. Do not include file paths or em dashes. Use standard Git style.
- Based on the git commits, generate a paragraph describing what I worked on yesterday in the first person. Use a balanced tone that is both technical and business-friendly, ensuring it matches the project context. Do not include file paths or em dashes, and keep it concise.

### Rephrase text

- Please rephrase the following using professional business language: '[Your Text Here]'.
- Rephrase the following technical requirement, deliver the output as a one-liner/single paragraph: '[Your Text Here]'.
- Please refine the grammar and phrasing of the following text while maintaining the original context and striking a professional yet approachable balance between a casual and diplomatic tone.
- Rephrase the following technical requirement for [Target Audience]: '[Your Text Here]', focusing on [Clarity/Professionalism/Technical Detail] and deliver the output as a [one-liner/single paragraph].
- Develop a high-performance, editable '[ComponentTypeName]' component with two-way data binding and integrate it into the existing Form Ecosystem (Editor and Renderer), ensuring all existing and unused variables are preserved within the schema.
- Please summarize the following text into a concise narrative. Refine the grammar and phrasing to ensure the tone is professional yet approachable - striking a balance between casual and diplomatic. Ensure the original context remains intact while improving clarity and flow.
- Provide a one-liner or short paragraph summary of the following text in 255 characters or less. Use a professional but approachable tone that is both casual and diplomatic. Focus on high-level impact and ensure the grammar is polished.

### Debugging

- Identify root cause of null reference exception in [file/class/method].
- Trace performance bottleneck in [function/module] and suggest optimizations.
- Detect memory leaks in [component/service].
- Analyze incorrect output in [algorithm/function] and propose fix.
- Locate unhandled exceptions in [workflow/process].

### Refactoring

- Refactor [class/module] to improve readability and maintainability.
- Extract reusable methods from [function/block].
- Simplify nested conditionals in [method/function].
- Convert procedural code in [file] to object-oriented design.
- Replace duplicated logic in [modules] with shared utility.

### Code feature generation for OOP and data-driven code

- Generate new class [ClassName] implementing [Interface/BaseClass].
- Create data-driven service for [entity] with CRUD operations.
- Implement repository pattern for [database/entity].
- Add unit tests for [class/method] using [framework].
- Generate DTOs for [entity] with mapping from domain models.

### MVVM

- Create ViewModel for [UI component] with observable properties.
- Bind ViewModel commands to [UI control] actions.
- Implement data validation in [ViewModel].
- Generate model class for [entity] with property change notifications.
- Connect ViewModel to [service/repository] for data retrieval.

### UI controls with data binding

- Generate data-bound list control for [entity collection].
- Create form with two-way binding to [ViewModel].
- Implement dynamic dropdown bound to [data source].
- Add grid control with sorting and filtering bound to [collection].
- Generate reusable custom control with dependency properties.

### Common boilerplate

- Create configuration file template for [environment].
- Generate logging setup for [application/service].
- Add authentication middleware boilerplate for [framework].
- Create unit test project structure for [solution].
- Generate API controller template for [entity/resource].

## Troubleshooting

### TokenEconomizer does not work

Run the doctor command:

```bash
~/.tokeneconomizer/bin/te doctor
```

### The Telegram message does not arrive

Run this command in PowerShell to see the error:

```powershell
Invoke-RestMethod "https://api.telegram.org/bot$env:TELEGRAM_BOT_TOKEN/sendMessage?chat_id=$env:TELEGRAM_CHAT_ID&text=hello"
```

| Status code | Cause |
| --- | --- |
| `401` | The token is wrong. |
| `400` | The chat ID is wrong. |

## Related links

- [Claude Code hooks](https://code.claude.com/docs/en/hooks)
- [Agent global rules for .NET 10 Blazor SSR](doc:development-nexuses-agent-global-rules)
- [Development nexuses](doc:development-nexuses)
