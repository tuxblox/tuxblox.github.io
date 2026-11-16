# Advanced

Two buttons: one for looking inside the virtual drive, one for setting up an AI client. Nothing here changes how Roblox runs.

## Open Registry Editor

Opens the registry editor for the virtual drive, showing the Windows registry that Roblox and the compatibility layer actually read on this machine.

It opens as a tool rather than a session: it does not appear in [Sessions](../sessions.md), and closing it does not stop Roblox. Close it with nothing else running and the virtual drive closes behind you, the same way it does when a session ends.

Nothing needs this for ordinary use. It is here for following a troubleshooting step that names a registry value, and for seeing what a setting actually wrote.

> [!CAUTION]
> TuxBlox writes parts of the registry itself every time Roblox starts, so a value it manages can be written back over an edit you made by hand.

Until the virtual drive exists the button says so, since the drive is built the first time you start Roblox.

## Copy MCP Gateway Location

Puts the full path of the Studio MCP gateway on your clipboard, and shows you what it copied.

That path is the one thing an AI client needs in order to talk to Roblox Studio, and it is the step people most often get wrong, because TuxBlox does not always live in the same folder: `~/.tuxblox` is where the installer puts it by default, not a fixed location. Copying the path means never guessing at it. See [Studio MCP](../studio-mcp.md) for what to paste it into.

If it says there is nothing to copy, the gateway is not installed. Updating TuxBlox installs it.
