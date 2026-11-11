# Launcher

How the launcher itself looks and behaves. Changes save the moment you make them, there is no Apply button.

Settings are stored in a file on disk, which [Files and Folders](../../advanced/files-and-folders.md#settingsjson) describes if you would rather edit it by hand.

## Language

**Default: System language**

The language TuxBlox's own windows are written in. Roblox is unaffected: it has its own language setting, and TuxBlox never touches it.

| Option | What you get |
|---|---|
| System language | Follows your desktop. TuxBlox reads the usual locale settings and uses the closest language it ships; English if it ships none of them. |
| English | |
| Português (Brasil) | |
| Español | |

Each language is listed in its own language, so you can find yours without being able to read the current one.

The choice applies the next time TuxBlox starts, so the window you are looking at stays in the language it opened in. The installer and the window that updates Roblox follow the same choice.

Not everything is translated yet. Anything a language has no translation for is shown in English rather than left blank, so a part-finished language is usable rather than broken.

> If you would like to see TuxBlox in a language it does not have yet, the translations are ordinary `.po` files and a new one is all it takes. [Contributing](../../development/contributing.md) has the details.

## Launcher theme

**Default: System theme**

The colours TuxBlox uses. Roblox looks exactly the same whichever you pick.

| Option | What you get |
|---|---|
| System theme | Follows whether your desktop is set to light or dark, and moves with it when you change that. |
| Dark | The dark TuxBlox colours, whatever your desktop is set to. |
| Grey | The plain grey TuxBlox wore before it took the colours from tuxblox.net. |
| Light | The light TuxBlox colours, whatever your desktop is set to. |
| Christmas | The dark colours taken deeper and made see-through, with snow falling behind the window. Only offered until 6 January. |

The launcher changes the moment you pick one, so there is nothing to close and reopen. The installer and the window that updates Roblox follow your choice too, from the next time each one opens.

### Christmas

Christmas is a one-off for this winter. It appears in the list from 9 November 2026 until the end of 6 January 2027, and it is never turned on for you -- you pick it like any other theme.

Once the season is over the option disappears from the list. If you were using it, TuxBlox goes back to **System theme** on its own, so nothing looks broken. The snow is drawn behind the window's contents and stops entirely while the launcher is minimised or hidden.

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
