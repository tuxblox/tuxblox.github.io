# Launcher Flags

What these decide is visible in the launcher window. None of them changes what is installed; they decide what the launcher offers and what it does in the background.

| Flag | Default | What it decides |
|---|---|---|
| `tbxFlagDisablePlayerButton` | `true` | Whether the Roblox Player button on the Home screen does anything. It is switched off for everybody while [Player support is still being worked on](../../getting-started/faq.md#does-roblox-player-work), and this is how it becomes live for everybody on the day it is ready. Set it to `false` to turn the button on early; it is not expected to work. |
| `tbxFlagEnableRobloxNextVersionDownload` | `true` | Whether the [Versions](../../using-tuxblox/versions.md) tab offers **Next**, the Roblox version Roblox has uploaded but not released. It is the one option that can stop working without warning, because the version behind it can be withdrawn, so it is worth being able to withdraw the option too. |
| `tbxFlagDisableGeoTool` | `false` | Whether the notification telling you which part of the world a Roblox server is in runs at all. Switching it off stops the lookup as well as the notification. |
| `tbxFlagDisableCrashTelemetry` | `false` | Whether a crash report is ever sent. Switching it off takes the whole feature away, the **Report** button included — a switch that stopped the automatic send but left a button that still sent one would not be a way to stop reports arriving. |
| `tbxFlagEnableExperimentalLinuxIntegration` | `false` | Whether Roblox's files are kept in [the folders your desktop already uses](../files-and-folders.md) instead of all together the way Windows programs do it. Experimental, and off until you turn it on. |

Your own settings still apply on top. Switching the server location notification on here does not switch it on for somebody who turned it off in Settings — a flag can take a feature away, but it does not make a choice on your behalf.
