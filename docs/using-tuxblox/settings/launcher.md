# Launcher

How the launcher itself looks and behaves. Changes save the moment you make them, there is no Apply button.

Settings are stored in a file on disk, which [Files and Folders](../../advanced/files-and-folders.md#settingsjson) describes if you would rather edit it by hand.

## Launcher theme

**Default: System theme**

The colours TuxBlox uses. Roblox looks exactly the same whichever you pick.

| Option | What you get |
|---|---|
| System theme | Follows whether your desktop is set to light or dark, and moves with it when you change that. |
| Dark | The dark TuxBlox colours, whatever your desktop is set to. |
| Grey | The plain grey TuxBlox wore before it took the colours from tuxblox.net. |
| Light | The light TuxBlox colours, whatever your desktop is set to. |

The launcher changes the moment you pick one, so there is nothing to close and reopen. The installer and the window that updates Roblox follow your choice too, from the next time each one opens.

### Window buttons

The minimise, maximise and close buttons in the launcher's title bar use your desktop's own icons, so the window looks like the rest of your screen rather than bringing its own set. There is nothing to turn on: TuxBlox reads whichever icon set your desktop is using and follows it when you change it.

Where those icons cannot be read, TuxBlox draws its own instead, which is what older versions always did. That is the only difference you would notice, and nothing else about the window changes.

## Minimize to background

**Default: off**

Closes the launcher window once Roblox is on its way.

With it off, which is how a new install arrives, the launcher stays open and takes you to the new session's [log](../sessions.md) so you can watch what Roblox is doing. It is also still usable, which is worth having if you want to start Studio and the Player together, switch versions, or change a setting without opening it again.

Turn it on to get the older behaviour, where the window closes as soon as Roblox starts.

> **If you had TuxBlox before this setting's default changed, your setting is kept as it was.** The new default only applies to a fresh install. Nothing was changed underneath you.

Roblox is watched by a separate part of TuxBlox either way, so nothing is lost by the window going. It is still there to tell you if Roblox crashes, and it still writes the session log.

This is not a tray icon. On, the window closes; off, it stays a normal window you can use.
