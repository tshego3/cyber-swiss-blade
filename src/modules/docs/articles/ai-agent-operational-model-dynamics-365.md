---
title: Dynamics 365 development with Claude Code
summary: Use Claude Code for D365 Finance and Operations (X++), Business Central (AL), and Dataverse work, with data governance rules, settings, and prompts.
category: AI and design
order: 50
---

# Dynamics 365 development with Claude Code

Claude Code supports D365 Finance and Operations (X++), Business Central (AL), and Dataverse and Power Platform development, but the integration path is different for each. F&O is built in the **Visual Studio IDE**. Business Central and Dataverse are built in **VS Code**. This article is part of the [local and hybrid AI agent operational model](doc:ai-agent-operational-model).

## Before you start

- Claude Code installed. Read [AI agent setup and installation](doc:ai-agent-operational-model-setup).
- For F&O: a cloud-hosted or Tier-1 development VM with the Finance and Operations developer tools extension in Visual Studio.
- For F&O: outbound HTTPS from the development VM to `api.anthropic.com`.

## Data governance gate

> **IMPORTANT:** Read this section first.

- Claude Code runs on cloud Anthropic models. X++ metadata, entity schemas, and customer configuration are proprietary. Read [governance, security, and compliance](doc:ai-agent-operational-model#governance-security-and-compliance).
- Do not put production data, licence keys, LCS credentials, or Dataverse connection strings in a prompt or in `CLAUDE.md`.
- Send customer PII and regulated financial records to the local Ollama path (Continue).
- Get written approval before you point Claude Code at a customer or ISV source tree.

## D365 Finance and Operations (X++) in Visual Studio

### Start the session

1. Install Claude Code for the current user:

   ```powershell
   irm https://claude.ai/install.ps1 | iex
   ```

2. Visual Studio has no Claude Code extension. Open `View` > `Terminal` and run `claude`. A separate Windows Terminal window in the same folder also works.
3. Start `claude` in the **Git repository that holds the model source**, usually `Metadata\<YourModel>\` and `Projects\`.

> **WARNING:** Do not start Claude Code in `<drive>:\AosService\PackagesLocalDirectory` (usually on `K:` or `C:`). That folder holds the full standard application. It fills the context window and uses all of the token budget. If the agent must read standard code, give the exact file name in the prompt, not the folder.

### How X++ is stored

Each element is an XML metadata file, for example `AxClass\MyClass_Extension.xml`. The X++ source is in `<Declaration>` and `<Method><Source>` CDATA blocks. Tell the agent to edit only in the CDATA and not to change the XML envelope.

### Divide the work

- **Visual Studio designers:** Create tables, forms, EDTs, enums, menu items, and security roles. The XML that the designers generate is always correct.
- **Claude Code:** Write the X++ logic: extension classes, Chain of Command wrappers, event handlers, data entities, SSRS controllers, batch classes, data upgrade scripts, and SysTest classes.
- **Reload the solution** in Visual Studio after the agent edits files. The IDE then sees the changes.

### Build and verify from the terminal

| Task | Command |
| --- | --- |
| Build the solution | `msbuild <YourSolution>.sln /p:Configuration=Debug` |
| Fix errors one at a time | `msbuild MyModel.sln 2>&1 \| claude -p "Fix only the first X++ compiler error. Preserve the CDATA structure."` |
| Best practice check | `xppbp.exe -metadata=<PackagesLocalDirectory> -all -module=<YourModel>`, run from `<PackagesLocalDirectory>\bin` |

- **Unit tests:** Let the agent write the `SysTestSuite` or `SysTestCase` class. Run it from **Test Explorer** and paste the failures into the session.
- **Database sync and packages:** Database sync (`SyncEngine.exe`) and deployable package creation are destructive or slow. Keep them as manual tasks and deny them in the settings.

### Source control

Claude Code understands Git, not TFVC. On a TFVC project, run `tf.exe checkout <file>` before the agent edits the file. If you do not, the write fails on a read-only file. Record this rule in `CLAUDE.md`.

### Configure the project

Run `/init`. Then add the facts that the agent cannot find by itself to `CLAUDE.md`:

```text
# D365 F&O Model: ContosoExtensions
- Layer: ISV. Model: ContosoExtensions. Prefix all new elements with `Contoso`.
- Never edit standard Microsoft elements. Use extensions and Chain of Command only.
- X++ lives in CDATA inside AxClass/*.xml. Do not reformat the XML.
- Build: msbuild ContosoExtensions.sln /p:Configuration=Debug
- Best practice: xppbp.exe -all -module=ContosoExtensions
- Source control is TFVC. Run `tf checkout <file>` before editing.
- Forbidden: direct SQL, select forupdate without ttsbegin, display methods on transaction tables.
```

Recommended permissions in `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(msbuild:*)",
      "Bash(xppbp.exe:*)",
      "Bash(git status)",
      "Bash(git diff:*)"
    ],
    "deny": [
      "Bash(SyncEngine.exe:*)",
      "Read(./**/*.rsp)"
    ]
  }
}
```

### Prompt examples

```text
Create a Chain of Command extension of SalesLine.insert() in @Metadata/ContosoExtensions/AxClass that stamps ContosoOriginCode from the sales header.
```

```text
Read @Metadata/ContosoExtensions/AxClass/ContosoInvoicePost.xml and list every ttsbegin without a matching ttscommit.
```

```text
Write a SysTestCase for ContosoPriceEngine covering the zero-quantity and expired-agreement paths.
```

## D365 Business Central (AL) in VS Code

Business Central is the best fit of the three. The Claude Code VS Code extension, the `AL Language` extension, and Git work together without a workaround.

1. Install `AL Language`.
2. Run `AL: Go!` to create a scaffold.
3. Open the Claude Code panel with `Ctrl+Esc`.

Rules for the agent:

- **Object IDs:** Tell the agent to use IDs from `idRanges` in `app.json`. Tell it to look for collisions in the workspace before it writes a new object.
- **Naming:** Record the mandatory affix (from `AppSourceCop.json`) in `CLAUDE.md`. If you do not, the agent generates object names that are not compliant.
- **Analyzers:** Turn on `CodeCop`, `UICop`, `PerTenantExtensionCop`, and `AppSourceCop` in `settings.json`. Then use this prompt: `Fix all AL analyzer warnings in the Problems panel. Do not suppress a rule.`
- **Build and test:** `F5` publishes to the sandbox. Let the agent write AL Test Toolkit codeunits. Run them from the Test Tool page and paste the failures into the session.

## D365 Customer Engagement and Dataverse in VS Code

| Area | How to use Claude Code |
| --- | --- |
| Plugins and custom workflow activities | These are standard C# class libraries. Claude Code works with them directly, with `dotnet build`, `dotnet test`, and FakeXrmEasy unit tests. Keep the Plugin Registration Tool step manual. |
| Power Platform CLI | Let the agent run `pac`. Useful commands: `pac auth create`, `pac solution export`, `pac solution unpack`, `pac solution pack`. |
| Solution review | Run `pac solution unpack`, so that the customizations become XML that you can review in Git. Then use this prompt: `Diff the unpacked solution against the previous commit and summarise every changed form, view, and security role.` |
| PCF controls | `pac pcf init` creates a TypeScript project. Claude Code works well on the component logic, `npm run build`, and the manifest. |
| Web resources | Install `@types/xrm`. The agent then generates type-checked `Xrm.WebApi` code and does not guess the client API. |

## Optional MCP servers

A Dataverse MCP server and an Azure DevOps MCP server are available. They can give the agent live schema and work-item context. Both change frequently. Before you run `claude mcp add`, confirm the current package and its data egress behavior with IT.

## Known limits

- There is no Claude Code plugin for the Visual Studio IDE. Use the terminal only.
- The agent cannot use the F&O designers, the Application Explorer, or the AOT. Metadata creation stays manual.
- F&O metadata files are large. Refer to single files, not to full model folders.
- The agent cannot see the runtime state of a published D365 environment. It works on the source, not on the running application.

## Related links

- [AI agent IDE integrations](doc:ai-agent-operational-model-ide-integrations)
- [Local and hybrid AI agent operational model](doc:ai-agent-operational-model)
