# The bootstrapper

`~/.tuxblox/TuxBloxBootstrapper`

Installs and updates **Roblox**, not TuxBlox. This is the program behind the small window you see when Roblox has a new build to download.

You will usually never run it yourself. The launcher runs it with `--update` before every launch while **Auto-Update Roblox** is on, which is the default — see [Updates](../../using-tuxblox/settings/updates.md). It is here because it is a normal program you can run, and because scripting an install needs it.

```
Usage: TuxBloxBootstrapper [--preview | --install | --update]

  --preview   Show the window without downloading or writing anything.
  --install   Install the Roblox version the environment describes.
  --update    Install the channel's newest version if it is missing.
              Shows no window unless there is something to download.
  --help      Show this message.
  --version   Print the TuxBlox version and exit.

Environment:
  TUXBLOX_BOOTSTRAPPER_DOWNLOAD_SERVER      Mirror to download from.
  TUXBLOX_BOOTSTRAPPER_DOWNLOAD_RBXHASH     Exact version, or blank for newest.
  TUXBLOX_BOOTSTRAPPER_DOWNLOAD_RBXCHANNEL  Roblox release channel.
  TUXBLOX_BOOTSTRAPPER_DOWNLOAD_APP         player or studio.
  TUXBLOX_BOOTSTRAPPER_INSTALL_DIR          Where versions are installed.
```

The three modes are mutually exclusive, and one of them is required. Running it with no arguments is an error rather than a no-op:

```
Nothing to do: pass --preview, --install or --update.
```

Unknown options, stray arguments, and two modes on the same line are all errors too, so a typo cannot quietly change what the bootstrapper does. That matches the installer, and it is deliberate: these are programs that write to your disk.

`--update` is the quiet one. It checks whether the channel has a newer build than the one you have and fetches it only if it is missing, showing no window when there is nothing to do. `--preview` is the opposite — it opens the window and touches nothing, which is the one to reach for if you want to see what it looks like.

## The environment is the argument

`--install` has no flag saying *which* Roblox to install. It reads that from the five variables above, which is why they are documented here rather than with the [environment variables](../../advanced/environment-variables.md) that steer a launch.

| Variable | What it sets |
|---|---|
| `TUXBLOX_BOOTSTRAPPER_DOWNLOAD_SERVER` | Mirror to download from |
| `TUXBLOX_BOOTSTRAPPER_DOWNLOAD_RBXHASH` | An exact version, or blank for the newest |
| `TUXBLOX_BOOTSTRAPPER_DOWNLOAD_RBXCHANNEL` | Roblox's own release channel |
| `TUXBLOX_BOOTSTRAPPER_DOWNLOAD_APP` | `player` or `studio` |
| `TUXBLOX_BOOTSTRAPPER_INSTALL_DIR` | Where versions are installed |

> [!NOTE]
> `DOWNLOAD_RBXCHANNEL` is **Roblox's** release channel, not the TuxBlox update channel from [Updates](../../using-tuxblox/settings/updates.md). They are unrelated, and setting one does nothing to the other.

When the launcher calls it, it sets only two of the five — the app to fetch, and where the versions folder is — and lets the rest default. That is worth knowing if you are reproducing what the launcher does: you need far less than the full set.

```bash
# Fetch the newest Studio build into the usual versions folder
TUXBLOX_BOOTSTRAPPER_DOWNLOAD_APP=studio \
TUXBLOX_BOOTSTRAPPER_INSTALL_DIR=~/.tuxblox/roblox \
~/.tuxblox/TuxBloxBootstrapper --install
```

`--version` prints the TuxBlox version, the same way every other TuxBlox program answers, because the bootstrapper ships with TuxBlox rather than being versioned alongside Roblox.
