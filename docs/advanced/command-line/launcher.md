# TuxBloxLauncher

Every TuxBlox program you can run from a terminal has a page here, and this one is the launcher itself.

Nothing in this section is required for normal use. It exists for scripting, for headless machines, and for people who would rather not click.

`~/.tuxblox/TuxBloxLauncher`

Run with no arguments, it opens the launcher window. With an argument, it does one specific thing and exits.

| Argument | What it does |
|---|---|
| *(none)* | Opens the launcher window |
| `--launch-studio` | Starts Roblox Studio directly, no window |
| `--launch-player` | Starts Roblox Player directly, no window |
| `--open-file <path>` | Opens a place or model file in Studio (`.rbxl`, `.rbxlx`, `.rbxm`, `.rbxmx`) |
| `roblox:…` | Starts Player with that link |
| `roblox-player:…` | Same |
| `roblox-studio:…` | Starts Studio with that link |
| `roblox-studio-auth:…` | Signs in to Studio from a website link |
| `--allow-root` | Lets TuxBlox start as the root user |

`--allow-root` can go anywhere on the line and combines with any of the others. Without it, TuxBlox run as root refuses to start and says so. With it, it prints a warning and carries on. You almost certainly do not want it: a virtual drive built by root is one your normal account cannot write to afterwards, and every later launch fails in a way that looks like a broken install.

Two more exist but are meant for TuxBlox's own use rather than yours:

| Argument | What it does |
|---|---|
| `--watch-launch player\|studio` | Starts Roblox and stays running to watch the session. Lists itself as `tuxbloxWatcher` |
| `--run-exe <path>` | What the exported desktop shortcuts use |

`--run-exe` only accepts `RobloxStudioBeta.exe` or `RobloxPlayerBeta.exe` and refuses anything else. It ignores the rest of the path and works out which Roblox to start from the filename, which is why an old shortcut keeps working after Roblox updates.

## Examples

```bash
# Start Studio from a script
~/.tuxblox/TuxBloxLauncher --launch-studio

# Open a place file
~/.tuxblox/TuxBloxLauncher --open-file ~/Places/MyGame.rbxl
```

> [!NOTE]
> Only one launcher **window** can be open at a time. The direct launch options above are not affected by that, so you can use them while the window is open.
