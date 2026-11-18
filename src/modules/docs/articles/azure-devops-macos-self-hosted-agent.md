---
title: macOS Azure DevOps self-hosted agent
summary: Install, configure, and run an Azure DevOps self-hosted agent on an Intel or Apple Silicon Mac, and fix MSBuild and JDK demands.
category: DevOps and tools
order: 10
---

# macOS Azure DevOps self-hosted agent

A self-hosted agent on macOS gives you control of the build environment. Use it for iOS or macOS tasks (for example, Xcode builds) that need specific versions or tools.

## Before you start

- A Mac with macOS 11.0 (Big Sur) or later.
- The **Agent Pool Administrator** permission in your Azure DevOps organization.
- A personal access token (PAT) with the **Agent Pools (Read & Manage)** scope. See [Create a personal access token](#create-a-personal-access-token).

The 4.x agent is the standard agent for Azure DevOps Services. It supports Intel (x64) and Apple Silicon (ARM64) Macs.

> **NOTE:** Dated (checked November 2026): The 4.x agent supports macOS 13 (Ventura), 14 (Sonoma), 15 (Sequoia), and 26 (Tahoe) on x64 and ARM64. Only the 3.x agent for Azure DevOps Server 2022 supports macOS 11 (Big Sur) and 12 (Monterey).

> **NOTE:** The commands in this article use the Intel package `vsts-agent-osx-x64-4.266.2.tar.gz`. On Apple Silicon, the package name is `vsts-agent-osx-arm64-<version>.tar.gz`. Use the file name of the package that you download.

## Create a personal access token

1. In Azure DevOps, go to **User Settings** (top right) > **Personal access tokens**.
2. Select **+ New Token**.
3. Select **Show all scopes** at the bottom.
4. Select the scope **Agent Pools (Read & Manage)**.
5. Copy the token immediately. You cannot see it again.

## Download the agent

1. Sign in to your Azure DevOps organization (`https://dev.azure.com/{your-org}`).
2. Go to **Organization Settings** (bottom left) > **Agent pools**. The direct URL is `https://dev.azure.com/{your-org}/_settings/agentpools`.
3. Select the **Default** pool (or create a new pool).
4. Select the **Agents** tab, then select **New agent**.
5. Select **macOS** and your architecture:
   - **x64**: Intel Macs.
   - **ARM64**: Apple Silicon (M1, M2, M3, M4) Macs.
6. Select **Download**.

## Install the agent

Open **Terminal** on the Mac and run these commands.

1. Clear the extended attributes on the tar file:

   ```bash
   xattr -c ~/Downloads/vsts-agent-osx-x64-4.266.2.tar.gz
   ```

2. Create the agent directory:

   ```bash
   mkdir ~/my-agent && cd ~/my-agent
   ```

3. Unpack the agent. Use the file name of the package that you downloaded.

   ```bash
   tar zxvf ~/Downloads/vsts-agent-osx-x64-4.266.2.tar.gz
   ```

## Configure the agent

1. Run the configuration script. It asks for the values interactively.

   ```bash
   ./config.sh
   ```

2. Enter these values at the prompts:

   | Prompt | Value |
   | --- | --- |
   | Server URL | `https://dev.azure.com/{your-organization}` |
   | Authentication type | Press `Enter` (the default is PAT). |
   | Personal access token | Paste the PAT that you created. |
   | Agent pool | Press `Enter` (the default is `Default`). |
   | Agent name | A name that is easy to identify (for example, `Mac-Mini-01`). |
   | Work folder | Press `Enter` (the default is `_work`). |

## Run the agent

You can run the agent in 2 modes.

### Run in interactive mode

Use this mode for tests. The agent runs in your terminal. If you close the terminal, the agent stops.

```bash
./run.sh
```

### Run as a service

This is the recommended mode. The agent starts automatically when the Mac starts and runs in the background.

```bash
# Install the service
./svc.sh install
# Start the service
./svc.sh start
```

## Use the agent in a pipeline

In your `azure-pipelines.yml` file, make sure that the `pool` block has the name of the pool where you registered the Mac. In the `Agent.Name` demand, use the agent name that you entered in `config.sh`:

```yaml
pool:
  name: 'Default'
  demands:
  - Agent.Name -equals Mac-M3-Build-01 # Targets your specific machine
```

## Manage the agent

| Action | Command |
| --- | --- |
| Show the status | `./svc.sh status` |
| Stop the agent | `./svc.sh stop` |
| Start the agent | `./svc.sh start` |
| Remove the agent | `./svc.sh uninstall`, then `./config.sh remove` |

- **Updates**: Agents usually update automatically. To start an update manually, right-click the pool in Azure DevOps and select **Update all agents**.
- **Xcode versions**: If you build iOS apps, install the correct Xcode version on the Mac. The agent detects Xcode automatically as a capability.

## Troubleshooting

### No agent satisfies the MSBuild and JDK demands

MAUI or Android pipelines can show this error:

```text
##[error]No agent found in pool Default satisfies both of the following demands: MSBuild, JDK
```

On macOS (especially Apple Silicon), the agent does not always register these capabilities, also when the tools are installed.

- **MSBuild demand**: Modern .NET (MAUI) uses the `dotnet` CLI. The `MSBuild` demand is often a legacy check that macOS agents do not claim by default.
- **JDK demand**: Tasks like `AndroidSigning@3` automatically add a hidden demand for `JDK`.

To fix the error, add the capabilities manually in the Azure DevOps portal. You do not have to change your code.

1. In Azure DevOps, go to **Organization Settings** > **Agent pools**.
2. Select your pool (for example, `Default`) and select the **Agents** tab.
3. Select your agent (for example, `Mac-M3-Build-01`) and go to the **Capabilities** tab.
4. Select **Add capability** and add these capabilities:

   | Key | Value (example) |
   | --- | --- |
   | `MSBuild` | `/usr/local/share/dotnet/dotnet` |
   | `JDK` | `/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home` |

> **TIP:** If the capability does not define a path, you can usually use `True` as the value.

### Developer cannot be verified

If macOS shows a "Developer cannot be verified" message, run this command:

```bash
xattr -rd com.apple.quarantine ~/my-agent
```

## Related links

- [Deploy a build and release agent on macOS](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/osx-agent?view=azure-devops&tabs=IP-V4)
- [Download and configure the agent](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/osx-agent?view=azure-devops&tabs=IP-V4#download-and-configure-the-agent)
- [Register an agent using a personal access token (PAT)](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/personal-access-token-agent-registration?view=azure-devops)
