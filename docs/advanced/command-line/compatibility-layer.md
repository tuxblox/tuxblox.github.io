# The compatibility layer

`~/.tuxblox/compat/main`

This is the layer itself. The launcher drives it for you, and you will rarely call it directly, but it is a normal program you can run.

```
Options:
  --help                  Show this help message
  --version               Show TuxBlox version
  --immediate             Run TuxBlox without draining the prefix, must be
                          used with the "run" argument
  --destroy               Destroys the prefix
  --allow-root            Allow running as root, which is not recommended

Arguments:
  run <executable>        Runs the specified executable
```

Options go before the executable. Anything after it is passed to the program being run, not read by the layer.

`--version` prints `2.8.0-stable`: the version, then the update channel that build came from. Every TuxBlox program answers the same way.

It needs to be told where the virtual drive is, through `TUXBLOX_PREFIX`:

```bash
TUXBLOX_PREFIX=~/.tuxblox/runtime ~/.tuxblox/compat/main --version
```

## run and --immediate

`run` starts a program and then waits for the virtual drive to empty out, meaning every Windows process inside it has exited. That is what you want for Roblox itself.

`run --immediate` skips the wait. Use it for anything that should return as soon as its own process ends, such as a helper running alongside Studio. [Studio MCP](../../using-tuxblox/studio-mcp.md) is exactly this case.

## --destroy

Deletes the virtual drive. Same effect as **Wipe prefix** in the launcher's settings, which is the friendlier way to do it.

## A trap worth knowing

A Windows executable has to live inside the virtual drive's `C:` to be runnable. Pointing `run` at an executable that sits elsewhere on your Linux filesystem fails with **exit code 139 and no output at all**, which looks exactly like a crash and is not one.

Copy it in first:

```bash
cp probe.exe ~/.tuxblox/runtime/pfx/drive_c/
~/.tuxblox/compat/main run "$HOME/.tuxblox/runtime/pfx/drive_c/probe.exe"
```

The path must be absolute. A relative one fails differently, with `wine: failed to open`.

> [!TIP]
> Read the program's output through a pipe, not a file redirect. Redirecting straight to a file gives the Windows program empty output handles and you end up with a zero byte file, which looks like the program printed nothing.
