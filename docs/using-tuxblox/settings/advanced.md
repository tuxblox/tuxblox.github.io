# Advanced

One button, for looking inside the virtual drive. Nothing here changes how Roblox runs.

## Open Registry Editor

Opens the registry editor for the virtual drive, showing the Windows registry that Roblox and the compatibility layer actually read on this machine.

It opens as a tool rather than a session: it does not appear in [Sessions](../sessions.md), and closing it does not stop Roblox. Close it with nothing else running and the virtual drive closes behind you, the same way it does when a session ends.

Nothing needs this for ordinary use. It is here for following a troubleshooting step that names a registry value, and for seeing what a setting actually wrote.

> [!CAUTION]
> TuxBlox writes parts of the registry itself every time Roblox starts, so a value it manages can be written back over an edit you made by hand.

Until the virtual drive exists the button says so, since the drive is built the first time you start Roblox.
