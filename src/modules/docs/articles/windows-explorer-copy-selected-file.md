---
title: Copy the selected File Explorer file path to the clipboard
summary: A C# sample that finds the file selected in an open Windows File Explorer window and copies its path to the clipboard.
category: Systems and setup
order: 30
---

# Copy the selected File Explorer file path to the clipboard

This C# sample reads the selected item in open Windows File Explorer windows and puts its full path on the clipboard. Use it in a Windows desktop tool that must act on the file that the user selected in File Explorer.

## Before you start

Add these references to the project:

| Reference | Type | Use |
| --- | --- | --- |
| Microsoft Shell Controls And Automation (`Shell32`) | COM | `FolderItems`, `FolderItem`, `IShellFolderViewDual2` |
| Microsoft Internet Controls (`SHDocVw`) | COM | `ShellWindows`, `InternetExplorer` |
| PresentationCore (namespace `System.Windows`) | Assembly | `Clipboard` (WPF) |

## Code

```csharp
// Add reference Com -> `Microsoft Shell Controls And Automation` and `Microsoft Internet Controls`
// and System.Windows & PresentationCore for Clipboard
foreach (SHDocVw.InternetExplorer window in new SHDocVw.ShellWindows())
{
    var filename = Path.GetFileNameWithoutExtension(window.FullName).ToLower();
    if (filename.ToLowerInvariant() == "explorer")
    {
        Shell32.FolderItems items = ((Shell32.IShellFolderViewDual2)window.Document).SelectedItems();
        foreach (Shell32.FolderItem item in items)
        {
            Clipboard.SetText(item.Path);
            break;
        }
    }
}
```

## How to use it

1. Add the references from [Before you start](#before-you-start).
2. Add `using System.IO;` for `Path` and `using System.Windows;` for `Clipboard`.
3. Put the code in a method, for example the click handler of a button.
4. Select a file in File Explorer and run the code.

   **Result:** The clipboard contains the full path of the selected file.

## How it works

- `ShellWindows` returns all open shell windows. The list can also contain Internet Explorer windows.
- The code reads the name of the process file from `window.FullName`. It continues only if the name is `explorer`.
- `IShellFolderViewDual2.SelectedItems()` returns the selected items in that File Explorer window.
- The `break` stops the inner loop after the first selected item. Thus the code copies only one path for each window.
- `Clipboard.SetText` needs an STA thread. In a console app, mark `Main` with `[STAThread]`.
- If more than one File Explorer window has a selection, each window overwrites the clipboard. The clipboard keeps the path from the last window.
