var e=`---
title: AI agent methodology and workflows
summary: The plan and build method for AI coding agents: shared skill files, task decomposition, the Claude Code step sequence, prompt budgets, and verification gates.
category: AI and design
order: 60
---

# AI agent methodology and workflows

The plan and build method breaks work into small, verified steps. It prevents hallucinations and keeps the codebase stable. This article is part of the [local and hybrid AI agent operational model](doc:ai-agent-operational-model).

## Before you start

- Claude Code or GitHub Copilot is set up. Read [AI agent IDE integrations](doc:ai-agent-operational-model-ide-integrations).
- A build command for the project, for example \`dotnet build\`.

## Set up shared agent skills

Use one central skills folder. GitHub Copilot and Claude Code then use the same source of truth.

| Path | Contents |
| --- | --- |
| \`.agents/\` | The canonical source. |
| \`.agents/rules/global-rules.md\` | System-wide instructions and general constraints. |
| \`.agents/skills/project-expert.md\` | Specialized logic and architecture knowledge. |
| \`.agents/skills/design-system.md\` | UI and UX standards and branding rules. |
| \`.github/copilot-instructions.md\` | A symlink or a copy of \`global-rules.md\`. |
| \`.github/skills/\` | A symlink or a copy of \`.agents/skills/\`. |
| \`CLAUDE.md\` (root) | A symlink or a copy of \`global-rules.md\`. Loaded in every session. |
| \`.claude/skills/\` | A symlink or a copy of \`.agents/skills/\`. |
| \`.claude/agents/\` | Subagent definitions for review, SQL, and design tasks. |
| \`.claude/commands/\` | Reusable slash commands, for example \`/plan-feature\` and \`/compliance-check\`. |

How each agent uses the files:

- **GitHub Copilot** indexes \`.github/copilot-instructions.md\` and the \`.github/skills/\` folder. The technical details move to skill files, so the main instructions use fewer tokens.
- **Claude Code** loads \`CLAUDE.md\` automatically and loads skills when it needs them. Call a skill or a subagent by name, for example "Review this with the code-reviewer subagent". Keep \`CLAUDE.md\` short and put the details in skill files.

## Analyze and decompose the task

### Classify the scope

| Scope | Size |
| --- | --- |
| MICRO | One method change |
| LOCAL | One class or file |
| CROSS | 2-5 files, interfaces, DI, or controllers |
| SYSTEM | More than 5 files. You must break it into smaller tasks. |

### Map the affected components

For each task, make a map of the files and tag each file with an action:

| Tag | Meaning |
| --- | --- |
| MODIFY | The internal logic of the file changes. |
| CREATE | A new file. |
| READ-ONLY | A dependency or reference. The agent does not change it. |
| RAG-REQUIRED | A file with more than 200 lines. Summarize it. Do not load it fully. |

Use this prompt to start the map:

\`\`\`text
Using #codebase, list all files and interfaces involved in [goal]. Output as a flat dependency list only. No code.
\`\`\`

### Retrieve by symbol

Retrieve by symbol, not by file. Use this order:

1. Target interfaces (signatures only).
2. The header and the public signatures of the target class.
3. The signatures of the called dependencies (services injected through the constructor).
4. Only the methods that change (full body).
5. Related DTOs and models (properties only).

### Implement from the bottom up

1. **Data layer:** Repository interfaces and implementations.
2. **Domain and application layer:** Service interfaces and implementations.
3. **Infrastructure:** Mapping, validators, and external integrations.
4. **API layer:** Controller actions and request and response models.
5. **DI wiring:** The final registration in the dependency injection container.

### Define each task

Each task must have a **pre-condition** (the state that you verify before you start) and a **done condition** (a measurable result).

Example implementation plan for a pagination feature:

| Step | Pre-condition | Done condition |
| --- | --- | --- |
| 1. ADD \`IProductRepository.GetPagedAsync\` signature | \`IProductRepository\` is loaded in the context pack. | The interface compiles with the new method signature. |
| 2. IMPLEMENT \`ProductRepository.GetPagedAsync\` | Step 1 is verified. The EF DbContext column names are confirmed. | The implementation compiles. The query uses Skip/Take. |
| 3. ADD \`IProductService.GetPagedAsync\` signature | The \`PagedResult\` shape is confirmed in the context pack. | The interface compiles and matches the repository return type. |
| 4. IMPLEMENT \`ProductService.GetPagedAsync\` | Steps 1-3 are verified. The \`IMapper\` profile is confirmed. | The service compiles, calls the repository, and maps the result. |
| 5. ADD \`ProductsController.GetPaged\` action | Step 4 is verified. The routing convention is confirmed. | The controller compiles, uses \`[FromQuery]\`, and returns \`IActionResult\`. |
| 6. REGISTER DI (if there are new types) | All of the steps above are verified. | The build is clean, with no missing registration warnings. |

## Run the tasks

Do one task at a time. Do not put more than one unverified step in one prompt.

The Claude Code sequence in summary:

1. **Initialize:** Start Claude Code in the project root and run \`/init\` to generate or refresh \`CLAUDE.md\`.
2. **Analyze:** Create a scaffold for a new project, or examine the existing architecture to understand the dependencies.
3. **Plan:** Change to **plan mode** (\`Shift+Tab\`), describe the feature, and generate a detailed implementation plan.
4. **Persist:** Save the plan in a dedicated location for later reference.
5. **Decompose:** Split the plan into focused task files, one for each phase.
6. **Execute:** Implement one phase at a time in a new session (\`/clear\`). This prevents context bloat and hallucinations.
7. **Verify:** Use error stack traces and special subagents to debug and refine until the feature works fully.

## Claude Code walkthrough

### Initialize the project environment

Prompt template:

\`\`\`text
Summarize the current workspace root and key projects, confirm the build command, and report readiness to proceed.
\`\`\`

1. Create a project folder, or go to an existing folder.
2. Start Claude Code from the project root: run \`claude\`, or open the Claude Code panel in VS Code.
3. Run \`/init\` one time for each repository to create \`CLAUDE.md\`.
4. Use **Shift+Tab** to change between plan mode and auto-accept mode.

### Scaffold or analyze the structure

Prompt template:

\`\`\`text
Analyze this existing repository architecture, list major projects/dependencies, and highlight constraints that affect implementation order.
\`\`\`

- **New project:** Change to build mode and tell the agent to create a scaffold from a template (for example ".NET Web API project in this directory").
- **Existing project:** Tell the agent to review the architecture, the project files, and the dependencies.

### Generate the implementation plan

Prompt template:

\`\`\`text
In plan mode, create a phased implementation plan for <feature_name> focused only on code completion. Define scope, dependencies, risks, and implementation tasks. Do not write code. Acceptance criteria for each phase is that the code is complete. Defer all live testing and runtime verification until all implementation tasks are finished.
\`\`\`

1. Clear the session context with \`/clear\`.
2. Change to **plan mode** and describe the feature (for example "create a detailed implementation plan for a local chat service integration").
3. If the model starts to write code, stop it. Keep it on the plan only.

### Save the plan

Prompt template:

\`\`\`text
Store the approved plan as markdown under plans with a clear filename and include date, scope, and assumptions.
\`\`\`

1. Change back to **build mode**.
2. Tell the agent to save the plan (for example "Please store this plan in a plans folder").

### Break the plan into task files

Prompt template:

\`\`\`text
Split the main plan into phase task files under plans/tasks with actionable code completion tasks and dependencies. Acceptance criteria is complete once the code for the task is finished. Do not include live testing or runtime verification; these will be completed after all implementation tasks are done.
\`\`\`

1. Start a new session with \`/clear\`.
2. Load the plan file into the session context.
3. Tell the agent to split the plan into separate files in a \`tasks\` subfolder. Each file is one phase with detailed tasks and acceptance criteria.

### Implement one phase at a time

Prompt template:

\`\`\`text
Implement only <phase_name> from its task file, keep changes minimal and scoped, then report completed items and remaining blockers. However for <specific> source code, create a markdown file containing the required changes, with full code blocks using diff.
\`\`\`

1. Start a new session for each phase. This prevents context bloat.
2. For each phase, load the main plan file and the task file of the phase.
3. Tell the agent to implement only one phase (for example "Implement phase one only").

### Debug, verify, and refine

Prompt template:

\`\`\`text
Run verification for changed areas, capture exact errors, fix root causes only, and report final pass/fail with evidence.
\`\`\`

1. Run the application after all phases are complete.
2. Copy the exact stack traces or console errors into Claude Code for a fix.
3. Use agent skills (for example a browser skill in headed mode) for end-to-end verification.
4. After verification, update the acceptance criteria status in each phase task file.

### Run the compliance check

This is the final gate. Prompt template:

\`\`\`text
Run a final compliance check against repository engineering rules and relevant project skills, list any gaps, and apply minimal fixes before completion.
\`\`\`

1. Make sure that the code agrees with \`.github/copilot-instructions.md\` and \`CLAUDE.md\`.
2. Use the related project skills (for example \`project-expert\`, \`gold-standard-state\`, \`design-system\`) to verify the architecture, the rendering pattern, and the UI rules.
3. Make sure that the security and dependency checks are complete for the changed areas.

## Optimize prompts for local agents

### Context pack

Keep a trimmed context pack with these items:

| Item | Contents |
| --- | --- |
| Goal | One sentence that describes the feature |
| Files involved | The affected files and their purpose |
| Interfaces | Method signatures only |
| Target class summary | Header, dependencies, and public methods |
| Dependency snippets | Specific signatures from the called services |
| Dependency map | The call chain, for example Controller > Service > Repository |

### Chopped prompt format

Give each prompt this structure:

| Part | Budget | Contents |
| --- | --- | --- |
| \`[SYSTEM]\` | 150 tokens maximum | Role (for example "C# Expert") and constraints (for example "Patch-style only, no prose") |
| \`[CONTEXT]\` | 1,200 tokens maximum | The trimmed context pack for the current step |
| \`[TASK]\` | 300 tokens maximum | The exact step, the target method, and the constraints |

Constraints: keep the existing signatures, do not change constructors, and return only the changed method body.

Token budget targets: total prompt 3,200 tokens maximum, context pack 1,200 tokens maximum, code payload 1,600 tokens maximum.

### Prompt templates

Add a method:

\`\`\`text
You are a C# expert. Output only the new method body. No class wrapper. Context: [class] implements [interface]. Constructor injects: [deps]. Task: Implement [signature]. Constraints: use async/await, call [dep.Method], return [type]. Output: method body only.
\`\`\`

Fix an error:

\`\`\`text
You are a C# expert. Fix only the error below. Output corrected method body only. Error: [paste error]. Current method: [paste body]. Fix only what causes this error.
\`\`\`

Class skeleton:

\`\`\`text
You are a C# expert. Output a C# class file skeleton only. Class: [Name] in namespace [NS]. Implements: [Interface]. Constructor injects: [Deps]. Methods to stub: [list]. Output: complete file.
\`\`\`

DI registration:

\`\`\`text
You are a C# expert. Output one DI registration line only. Register: [Concrete] as [Interface]. Lifetime: Scoped. Pattern: services.AddScoped<IFoo, Foo>().
\`\`\`

## Verify the work

### Compilation gate

After each \`[VERIFY-REQUIRED]\` step, run the build command (for example \`dotnet build\`). If the build fails, stop. This is a hard stop.

### Self-review

Use a high-reasoning model to verify these items:

- The interface signatures match.
- The async/await pattern is correct.
- Null and empty values are handled.
- The calls to dependency methods are correct.

### Dependency safety checks

After a \`CROSS\` scope change, verify these items:

- The constructor injection matches the DI registration.
- The DTO properties match the mapping profiles.
- The controller routes do not conflict with existing routes.
- The \`[FromQuery]\` and \`[FromBody]\` attributes match the client contracts.

### Interface contract check

Use \`ripgrep\` to find all implementations of a changed interface. Make sure that each one is updated.

### Iteration loop

While there are steps in the plan, do these steps:

1. Load the current step.
2. Trim the context pack to 1,200 tokens maximum.
3. Make the prompt (3,200 tokens maximum in total).
4. Apply the patch.
5. Update the context pack.
6. If the step is \`[VERIFY-REQUIRED]\`, run the build.
7. Do the self-review.
8. Mark the step \`[DONE]\` and load the next step.

Rules for the loop:

- **Scope creep:** If one step changes more than 2 files, stop. Split the step into subtasks and do the analysis again.
- **Context drift:** Read the original goal again every 3 steps.
- **Dead-end recovery:** If a local model gives unusable output after 2 new prompts, send that task to a cloud agent. Then go back to the local model for mechanical edits.

### Task completion criteria

- All plan steps have the mark \`[DONE]\`.
- The build passes with zero errors and zero new warnings.
- All changed interfaces have confirmed implementations.
- All new public methods have an XML doc comment, at least at the signature level.
- The context pack is archived, for example in \`.vscode/ai-context/[task-name].md\`.

## Related links

- [Local and hybrid AI agent operational model](doc:ai-agent-operational-model)
- [AI agent IDE integrations](doc:ai-agent-operational-model-ide-integrations)
`;export{e as default};