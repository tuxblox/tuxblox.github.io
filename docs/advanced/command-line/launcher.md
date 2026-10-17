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

## Installing and updating Roblox

Three more arguments install and update **Roblox**, not TuxBlox. They are the program behind the small window you see when Roblox has a new build to download, which was a separate `TuxBloxBootstrapper` program until 3.4.0 and is part of the launcher now.

| Argument | What it does |
|---|---|
| `--update-roblox` | Installs the channel's newest Roblox build if it is missing. Shows no window unless there is something to download |
| `--install-roblox` | Installs the Roblox version the environment describes, whether or not it is already there |
| `--preview-rbxinstaller` | Opens the download window without downloading or writing anything |

You will usually never run these yourself. The launcher runs `--update-roblox` before every launch while **Auto-Update Roblox** is on, which is the default — see [Updates](../../using-tuxblox/settings/updates.md). They are here because they are normal arguments you can pass, and because scripting an install needs them.

> [!WARNING]
> Do not run these with `sudo`. Roblox would be installed into the virtual drive as the root user, which leaves files your own account cannot write to afterwards, and every later launch fails in a way that looks like a broken install.

`--update-roblox` is the quiet one: it checks whether the channel has a newer build than the one you have and fetches it only if it is missing, showing no window when there is nothing to do. `--preview-rbxinstaller` is the opposite — it opens the window and touches nothing, which is the one to reach for if you want to see what it looks like.

Two of them on the same line is an error, and so is a stray argument after one of them, so a mistake cannot quietly change what gets written to your disk. A mistyped flag name is a different matter: it is not recognised as one of these at all, and opens the launcher window like any other unknown option.

### The environment is the argument

`--install-roblox` has no flag saying *which* Roblox to install. It reads that from five variables, which is why they are documented here rather than with the [environment variables](../environment-variables.md) that steer a launch.

| Variable | What it sets |
|---|---|
| `TUXBLOX_BOOTSTRAPPER_DOWNLOAD_SERVER` | Mirror to download from |
| `TUXBLOX_BOOTSTRAPPER_DOWNLOAD_RBXHASH` | An exact version, or blank for the newest |
| `TUXBLOX_BOOTSTRAPPER_DOWNLOAD_RBXCHANNEL` | Roblox's own release channel |
| `TUXBLOX_BOOTSTRAPPER_DOWNLOAD_APP` | `player` or `studio` |
| `TUXBLOX_BOOTSTRAPPER_INSTALL_DIR` | Where versions are installed |

> [!NOTE]
> `DOWNLOAD_RBXCHANNEL` is **Roblox's** release channel, not the TuxBlox update channel from [Updates](../../using-tuxblox/settings/updates.md). They are unrelated, and setting one does nothing to the other.

When the launcher updates Roblox before a launch it sets only two of the five — the app to fetch, and where the versions folder is — and lets the rest default. That is worth knowing if you are reproducing what it does: you need far less than the full set.

Leave `INSTALL_DIR` alone unless you mean to install somewhere unusual. Without it the folder is worked out from the launcher's own location, which on a normal install lands on the versions folder inside the virtual drive — `…/pfx/drive_c/users/<user>/AppData/Local/Roblox/Versions`, which is where TuxBlox looks. Set it explicitly if you want to be certain, and note that naming a plain path like `~/.tuxblox/roblox` installs Roblox somewhere TuxBlox will never find it.

```bash
# Fetch the newest Studio build into the folder TuxBlox already uses
TUXBLOX_BOOTSTRAPPER_DOWNLOAD_APP=studio ~/.tuxblox/TuxBloxLauncher --install-roblox
```

## Examples

```bash
# Start Studio from a script
~/.tuxblox/TuxBloxLauncher --launch-studio

# Open a place file
~/.tuxblox/TuxBloxLauncher --open-file ~/Places/MyGame.rbxl
```

> [!NOTE]
> Only one launcher **window** can be open at a time. The direct launch options above are not affected by that, so you can use them while the window is open.
