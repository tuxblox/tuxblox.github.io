# studio-mcp

`~/.tuxblox/studio-mcp`

Runs Roblox's Studio MCP server through the compatibility layer. Takes `--version` and `--help`, and passes anything else it is given to the server.

This is what you point an AI client at. Use the absolute path, since most MCP clients will not expand `~`.

> [!NOTE]
> This replaced `mcp.sh` in 2.7.0. Updating removes the old script, so a client still configured with `~/.tuxblox/mcp.sh` needs repointing at `~/.tuxblox/studio-mcp`.

See [Studio MCP](../../using-tuxblox/studio-mcp.md).
