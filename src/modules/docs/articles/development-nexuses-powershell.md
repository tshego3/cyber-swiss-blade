---
title: Development nexuses: PowerShell scripts
summary: PowerShell commands and scripts for ports, Base64, REST loops, config files, services, user environment variables, and scheduled batch files.
category: Reference
order: 20
gist: 7d918ed092732c842802a302df4de443
---

# Development nexuses: PowerShell scripts

This article holds PowerShell commands and scripts for daily Windows development work. It also shows how to schedule a batch file with Windows Task Scheduler.

## Before you start

- Windows with PowerShell 5.1 or later.
- Some commands need administrator rights. The user environment variable script does not.

## Stop a web app by port

1. Find the process ID (PID) that listens on the port.
2. Stop the process. Replace `18056` with the PID for your port.

```powershell
# Find the PID using the port:
Get-NetTCPConnection -State Listen | Sort-Object LocalPort | Format-Table LocalAddress,LocalPort,OwningProcess
# Kill the process, replace 18056 with the PID for your port:
taskkill /F /PID 18056
```

## Convert text to Base64

The commented lines show each step. The last line does the same work in one line.

```powershell
# $text = "<text>";
# $bytes = [System.Text.Encoding]::UTF8.GetBytes($text);
# $base64 = [Convert]::ToBase64String($bytes);
# Write-Output $base64;

$text = "<text>"; $base64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($text)); Write-Output $base64;
```

This command encodes the text as UTF-16 (`Unicode`), not UTF-8. The Base64 result is different:

```powershell
[convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes("Hello world"))
```

## List file names in a folder

This script gets all file names in a folder without their extensions. It writes them as a comma-separated list.

```powershell
$folderPath = "C:\Your\Folder\Path";
$fileNames = Get-ChildItem -Path $folderPath -File | Select-Object -ExpandProperty BaseName;
$commaList = $fileNames -join ",";
Write-Output $commaList;
```

## Convert a file to and from Base64

To convert a file to a Base64 string in one line, use this command:

```powershell
[convert]::ToBase64String((Get-Content -path "your_file_path" -Encoding byte))
```

> **NOTE:** `Get-Content -Encoding byte` works in Windows PowerShell 5.1. PowerShell 7 uses `-AsByteStream`. The script below works in both.

To convert a PDF file to a Base64 string, use this script:

```powershell
# Read the binary content of the PDF file
$fileBytes = [System.IO.File]::ReadAllBytes("C:\Users\User\Downloads\Sample.pdf")

# Convert the binary content to Base64
$base64String = [Convert]::ToBase64String($fileBytes)

# Output the Base64 string
Write-Output $base64String
```

To convert a Base64 string back to a PDF file, use this script:

```powershell
# Base64 encoded string representing the PDF content
$base64String = "JVBERi0xLjUKJb/7 ..."

# Try to convert Base64 string to byte array
try {
    $pdfBytes = [System.Convert]::FromBase64String($base64String)
}
catch {
    Write-Output "Error: Unable to decode Base64 string. Details: $_"
    Exit
}

# Specify the output file path
$outputFilePath = "C:\path\to\output.pdf"

# Try to write the byte array to a PDF file
try {
    [System.IO.File]::WriteAllBytes($outputFilePath, $pdfBytes)
    Write-Output "PDF file successfully created at $outputFilePath"
}
catch {
    Write-Output "Error: Unable to write PDF file. Details: $_"
}
```

## Loop through each JSON object

This script calls an API with a bearer token. For each item in the `Operations` array, it calls a second endpoint and writes the parameter names.

1. Replace `{endpoint}` with the API address.
2. Replace the token value with your token.
3. Run the script.

```powershell
# URL of the JSON endpoint
$url1 = "{endpoint}"
$url2Prep = "{endpoint}/{Operation}"

# Bearer token provided in a variable (replace with actual token)
$token = "tyJ0eX..."

# Headers including the Authorization token
$headers = @{
    "Authorization" = "Bearer $token"
}

# Send request to the API endpoint and retrieve JSON response
try {
    $response = Invoke-RestMethod -Uri $url1 -Headers $headers -Method Get -ContentType "application/json"
    
    # Check if the response contains the "Services" array
    if ($response.Operations -is [array]) {
        foreach ($operation in $response.Operations) {
            Write-Output "METHODNAME: " $operation.Name

            $url2 = $url2Prep.Replace("{Operation}", $operation.Name)
            $url2Result = Invoke-RestMethod -Uri $url2 -Headers $headers -Method Get -ContentType "application/json"

            if ($url2Result.Parameters -is [array]) {
                Write-Output "PARAMETERNAMES:"

                foreach ($parameter in $url2Result.Parameters) {
                    Write-Output $parameter.Name
                }
            }
        }
    } else {
        Write-Output "Error: No 'Services' array found in the response."
    }
}
catch {
    Write-Output "Error retrieving data from API: $_"
}
```

> **NOTE:** The comment and the error message say `Services`, but the script checks the `Operations` property.

## Update the Web.config file

This script changes the value of the `ida:RedirectUri` key in `appSettings`.

```powershell
# Load the Web.config file
[xml]$webConfig = Get-Content 'C:\inetpub\wwwroot\WebApp\Web.config'

# Find the appSettings key to update
$appSetting = $webConfig.configuration.appSettings.add | Where-Object { $_.key -eq 'ida:RedirectUri' }

# Update the value
$appSetting.value = 'https://www.endpoint.com/'

# Save the changes back to the Web.config file
$webConfig.Save('C:\inetpub\wwwroot\WebApp\Web.config')
```

## Update the appsettings.json file

This script changes `RedirectUri` and `Active` in `appsettings.json`. `$true` is the correct Boolean value in PowerShell.

```powershell
# Read the JSON file
$json = Get-Content -Path "C:\inetpub\wwwroot\WebApp\appsettings.json" -Raw | ConvertFrom-Json;

# Update the value
$jsonValue = "https://www.endpoint.com/";
$json.RedirectUri = $jsonValue;
$json.Active = $true; # Note: $true is the correct boolean value in PowerShell

# Save the updated JSON back to the file
$json | ConvertTo-Json -Depth 32 | Set-Content -Path "C:\inetpub\wwwroot\WebApp\appsettings.json";
```

## Start, stop, and restart a service

Use these commands to manage a Windows service on a remote computer. Replace `serverone.local.co.za` and `ServiceName` with your values.

```powershell
# Get service status:
Get-Service -ComputerName serverone.local.co.za -Name ServiceName

# Restart service:
Get-Service -ComputerName serverone.local.co.za -Name ServiceName | Restart-Service -Force

# Stop service:
Get-Service -ComputerName serverone.local.co.za -Name ServiceName | Stop-Service -Force

# Start service:
Get-Service -ComputerName serverone.local.co.za -Name ServiceName | Start-Service
```

## Move user environment variables between Windows machines

The `UserEnv.ps1` script exports and imports the variables in `HKCU:\Environment` only. It needs no administrator rights and no UAC prompt. It needs PowerShell 5.1 or later.

### Export the variables

1. Run `.\UserEnv.ps1 -Export -Path .\user-env.json`.
2. Read the JSON file before you send it. The file can hold API keys.

The export keeps `%USERPROFILE%` as a token. It does not expand it.

### Import the variables

1. To preview the changes, run `.\UserEnv.ps1 -Import -Path .\user-env.json -WhatIf`.
2. To write the changes, run `.\UserEnv.ps1 -Import -Path .\user-env.json`.
3. Open a new shell to use the variables.

The import does these things:

- It merges `Path` and `PSModulePath`. It replaces all other variables.
- It shows a warning if a value holds the old machine name or the old profile path.
- It broadcasts `WM_SETTINGCHANGE`, so you do not have to log off.

### Options

| Option | Use |
| --- | --- |
| `-Exclude NAME1,NAME2` | Skip these variables. Works with export and import. |
| `-Include NAME1,NAME2` | Import these variables only. |
| `-Overwrite` | Replace `Path` and `PSModulePath`. Do not merge them. |

### Limits

- `Path` can hold `C:\Users\<name>\` entries. These entries break on a machine with a different user name. Edit the JSON file first and use `%USERPROFILE%\`.
- The script ignores `HKLM`. `HKLM` needs administrator rights.

### UserEnv.ps1

```powershell
<#
.SYNOPSIS
    Export, import and self-sign per-user environment variables. No admin rights, no UAC.

.DESCRIPTION
    Reads HKCU:\Environment directly, so REG_EXPAND_SZ values stay unexpanded
    (%USERPROFILE%\... stays a token and does not bake in the old machine's path).
    Import writes the same value kinds back and broadcasts WM_SETTINGCHANGE, so new
    processes see the change without a logoff.
    Sign creates a per-user code-signing certificate for an AllSigned policy.

.EXAMPLE
    .\UserEnv.ps1 -Export -Path .\user-env.json

.EXAMPLE
    .\UserEnv.ps1 -Import -Path .\user-env.json -WhatIf
    .\UserEnv.ps1 -Import -Path .\user-env.json

.EXAMPLE
    # AllSigned blocks this file too, so load it in memory the first time:
    powershell -NoProfile -Command "& ([scriptblock]::Create((Get-Content -Raw .\UserEnv.ps1))) -Sign"

.NOTES
    Scope is the current user only. The script never writes HKLM.
#>
[CmdletBinding(DefaultParameterSetName = 'Export', SupportsShouldProcess = $true)]
param(
    [Parameter(ParameterSetName = 'Export', Mandatory = $true)]
    [switch]$Export,

    [Parameter(ParameterSetName = 'Import', Mandatory = $true)]
    [switch]$Import,

    [Parameter(ParameterSetName = 'Sign', Mandatory = $true)]
    [switch]$Sign,

    [Parameter(ParameterSetName = 'Export')]
    [Parameter(ParameterSetName = 'Import')]
    [string]$Path = "$env:USERPROFILE\Downloads\user-env.json",

    # Import: replace list variables (Path, PSModulePath) instead of merging them.
    [Parameter(ParameterSetName = 'Import')]
    [switch]$Overwrite,

    # Import: write these names only.
    [Parameter(ParameterSetName = 'Import')]
    [string[]]$Include,

    # Export/Import: never touch these names.
    [Parameter(ParameterSetName = 'Export')]
    [Parameter(ParameterSetName = 'Import')]
    [string[]]$Exclude = @(),

    # Sign: files to sign. Defaults to this script.
    [Parameter(ParameterSetName = 'Sign')]
    [string[]]$Script,

    # Sign: certificate subject.
    [Parameter(ParameterSetName = 'Sign')]
    [string]$Subject = "CN=$env:USERNAME PowerShell Self-Signed",

    # Sign: certificate lifetime in years.
    [Parameter(ParameterSetName = 'Sign')]
    [int]$Years = 5
)

$ErrorActionPreference = 'Stop'
$ListVars = @('Path', 'PSModulePath')

function Resolve-Full ([string]$p) {
    if ([IO.Path]::IsPathRooted($p)) { $p } else { Join-Path (Get-Location).Path $p }
}

function Send-EnvChange {
    if (-not ('Win32.NativeMethods' -as [type])) {
        Add-Type -Namespace Win32 -Name NativeMethods -MemberDefinition @'
[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
public static extern IntPtr SendMessageTimeout(
    IntPtr hWnd, uint Msg, UIntPtr wParam, string lParam,
    uint fuFlags, uint uTimeout, out UIntPtr lpdwResult);
'@
    }
    $result = [UIntPtr]::Zero
    [void][Win32.NativeMethods]::SendMessageTimeout(
        [IntPtr]0xffff, 0x1A, [UIntPtr]::Zero, 'Environment', 0x0002, 5000, [ref]$result)
}

function Invoke-Export {
    $key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey('Environment')
    if (-not $key) { throw 'HKCU:\Environment not found.' }

    $vars = @()
    try {
        foreach ($name in $key.GetValueNames()) {
            if ([string]::IsNullOrEmpty($name)) { continue }
            if ($Exclude -contains $name) { continue }
            $vars += [pscustomobject]@{
                Name  = $name
                Kind  = $key.GetValueKind($name).ToString()   # String | ExpandString | MultiString
                Value = $key.GetValue($name, $null,
                            [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
            }
        }
    }
    finally { $key.Close() }

    $payload = [pscustomobject]@{
        ExportedAt    = (Get-Date).ToString('o')
        SourceMachine = $env:COMPUTERNAME
        SourceUser    = "$env:USERDOMAIN\$env:USERNAME"
        SourceProfile = $env:USERPROFILE
        Scope         = 'User'
        Variables     = $vars
    }

    $full = Resolve-Full $Path
    $payload | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $full -Encoding UTF8
    Write-Host "Exported $($vars.Count) user variables to $full"
}

function Invoke-Import {
    $full = Resolve-Full $Path
    if (-not (Test-Path -LiteralPath $full)) { throw "File not found: $full" }

    $payload = Get-Content -LiteralPath $full -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($payload.Scope -ne 'User') { throw "Unexpected scope in file: $($payload.Scope)" }
    Write-Host "Source: $($payload.SourceUser) on $($payload.SourceMachine) at $($payload.ExportedAt)"

    $key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey('Environment', $true)
    if (-not $key) { throw 'Cannot open HKCU:\Environment for write.' }

    $changed = 0
    try {
        foreach ($v in $payload.Variables) {
            if ($Exclude -contains $v.Name) { continue }
            if ($Include -and ($Include -notcontains $v.Name)) { continue }

            $kind = [Microsoft.Win32.RegistryValueKind]$v.Kind
            $new  = $v.Value
            $old  = $key.GetValue($v.Name, $null,
                        [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)

            if (($ListVars -contains $v.Name) -and -not $Overwrite -and $old) {
                $have = @($old -split ';' | Where-Object { $_ })
                $add  = @($new -split ';' | Where-Object { $_ -and ($have -notcontains $_) })
                if (-not $add) { Write-Verbose "$($v.Name): no new entries."; continue }
                $new = (($have + $add) -join ';')
                Write-Host "$($v.Name): appending $($add.Count) entry(ies)."
            }

            if ($null -ne $old -and $old -eq $new) { Write-Verbose "$($v.Name): unchanged."; continue }

            if ($new -is [string]) {
                if ($payload.SourceProfile -and $new -like "*$($payload.SourceProfile)*") {
                    Write-Warning "$($v.Name) contains the source profile path: $($payload.SourceProfile)"
                }
                if ($new -like "*$($payload.SourceMachine)*") {
                    Write-Warning "$($v.Name) contains the source machine name: $($payload.SourceMachine)"
                }
            }

            if ($PSCmdlet.ShouldProcess("HKCU:\Environment\$($v.Name)", "Set [$kind] = $new")) {
                $key.SetValue($v.Name, $new, $kind)
                $changed++
            }
        }
    }
    finally { $key.Close() }

    if ($changed -gt 0 -and -not $WhatIfPreference) {
        Send-EnvChange
        Write-Host "Imported $changed variable(s). Open a new shell to use them."
    }
    else {
        Write-Host "No changes written."
    }
}

function Invoke-Sign {
    $targets = $Script
    if (-not $targets) {
        $self = if ($PSCommandPath) { $PSCommandPath } else { Join-Path (Get-Location).Path 'UserEnv.ps1' }
        $targets = @($self)
    }

    $cert = Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert |
            Where-Object { $_.Subject -eq $Subject -and $_.NotAfter -gt (Get-Date) } |
            Select-Object -First 1

    if (-not $cert) {
        $cert = New-SelfSignedCertificate -Subject $Subject `
                                          -Type CodeSigningCert `
                                          -KeyUsage DigitalSignature `
                                          -KeyAlgorithm RSA -KeyLength 2048 `
                                          -CertStoreLocation Cert:\CurrentUser\My `
                                          -NotAfter (Get-Date).AddYears($Years)
        if (-not $cert) { Write-Host 'WhatIf: no certificate created. Nothing signed.'; return }
        Write-Host "Created certificate $($cert.Thumbprint)"
    }
    else {
        Write-Host "Reusing certificate $($cert.Thumbprint)"
    }

    # Trust the certificate for this user only. Both stores live under HKCU.
    foreach ($storeName in 'Root', 'TrustedPublisher') {
        $store = New-Object Security.Cryptography.X509Certificates.X509Store($storeName, 'CurrentUser')
        $store.Open('ReadWrite')
        if (-not $store.Certificates.Find('FindByThumbprint', $cert.Thumbprint, $false).Count) {
            $store.Add($cert)
            Write-Host "Added certificate to CurrentUser\$storeName"
        }
        $store.Close()
    }

    foreach ($file in $targets) {
        $full = (Resolve-Path -LiteralPath $file).Path
        Unblock-File -LiteralPath $full
        $result = Set-AuthenticodeSignature -FilePath $full -Certificate $cert `
                                            -HashAlgorithm SHA256 -IncludeChain All
        Write-Host "$($result.Status.ToString().PadRight(10)) $full"
        if ($result.Status -ne 'Valid') { Write-Warning $result.StatusMessage }
    }

    Write-Host 'Done. Sign again after every edit. One changed character breaks the signature.'
}

switch ($PSCmdlet.ParameterSetName) {
    'Export' { Invoke-Export }
    'Import' { Invoke-Import }
    'Sign'   { Invoke-Sign }
}
```

## Schedule a batch file with Task Scheduler

Use Windows Task Scheduler to run a batch file automatically.

1. Put the batch file (`.bat`) in a safe location. If you move or delete the file, the task does not run.
2. Press `Win + R` to open the Run dialog box.
3. Type `taskschd.msc` and press Enter.

   **Result:** Task Scheduler opens.
4. In the menu bar, select `Action` > `Create Basic Task`.
5. Type a name and a description for the task. Select `Next`.
6. Select when the task starts: Daily, Weekly, Monthly, One time, When the computer starts, When I log on, or When a specific event is logged. Select `Next`.
7. Select `Start a program`. Select `Next`.
8. Select `Browse`, go to the batch file, and select `Open`.
9. Read the summary and select `Finish`.
10. If the batch file needs administrator rights, do these steps:
    1. Right-click the task and select `Properties`.
    2. On the `General` tab, select `Run with highest privileges`.
    3. Select `OK`.

**Result:** The batch file runs on the schedule that you set.

## Troubleshooting

### UserEnv.ps1 is not digitally signed

The execution policy blocks the script. Use one of these fixes:

| Fix | Effect |
| --- | --- |
| `Get-ExecutionPolicy -List` | Shows the scope that has a value. Run it first. |
| `Unblock-File .\UserEnv.ps1` | Clears the internet mark on the file. |
| `Set-ExecutionPolicy -Scope Process Bypass -Force` | Allows scripts in this window only. |
| `Set-ExecutionPolicy -Scope CurrentUser Bypass -Force` | Allows scripts for your account. To undo, set the policy to `Undefined`. |
| `powershell -NoProfile -ExecutionPolicy Bypass -File .\UserEnv.ps1 -Export` | Runs the script with no policy change. |

### The policy is AllSigned

Sign the script. The policy also blocks the script that does the signing, so load the script in memory:

```powershell
powershell -NoProfile -Command "& ([scriptblock]::Create((Get-Content -Raw .\UserEnv.ps1))) -Sign"
```

The script puts the certificate in `Cert:\CurrentUser\My`, `Root`, and `TrustedPublisher`. The certificate is per user and needs no elevation. Sign the script again after each edit. One changed character breaks the signature.

### MachinePolicy or UserPolicy has a value

A Group Policy Object (GPO) locks the policy. Pipe the script into PowerShell:

```powershell
Get-Content -Raw .\UserEnv.ps1 | powershell -NoProfile -Command "& ([scriptblock]::Create($input)) -Export"
```

## Related links

- [Convert file to Base64 string format (Microsoft)](https://docs.microsoft.com/en-us/previous-versions/troubleshoot/winautomation/process-development-tips/text-manipulation/convert-file-to-base64-string-format)
- [PowerShell Base64 encoding (ShellGeek)](https://shellgeek.com/powershell-base64-encoding/#:~:text=In%20the%20above%20PowerShell%20script%20to%20convert%20string,encoded%20string%20and%20prints%20it%20on%20the%20console)
- [Development nexuses](doc:development-nexuses)
- [Development nexuses: command reference](doc:development-nexuses-command-reference)
