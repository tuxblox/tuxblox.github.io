# TuxBloxInstaller

`~/.tuxblox/TuxBloxInstaller`

Installs TuxBlox into `~/.tuxblox`, or wherever `--dir` says, upgrading an existing install in place if it finds one, then starts the launcher.

```
Usage: TuxBloxInstaller [options]

  --dir <path>       Absolute path to install into, instead of
                     ~/.tuxblox.
  --allow-root       Allow installing as root, which is not
                     recommended.
  --headless         Report progress on the terminal instead of
                     opening a window. Needs no display.
  --nolaunch         Don't start the launcher once the install
                     finishes.
  --uninstall        Remove TuxBlox from this system instead of
                     installing it.
  --channel <name>   Release channel to install from (default: stable).
  --latest           Install the newest release on the channel
                     instead of this installer's own version.
  --version          Show the build version and exit.
  -h, --help         Show this help and exit.
```

Unknown options are an error rather than being ignored, so a typo cannot quietly change what the installer does.

`--dir` has to be an absolute path, and its parent folder has to exist. Use it with `--uninstall` too if you installed somewhere other than the default, so the uninstaller removes the right folder. It will refuse to delete a folder that does not hold a TuxBlox install.

## Which version gets installed

An installer installs the version it was built for — the one `--version` prints. You get exactly the TuxBlox that came with the installer you downloaded, no matter how long ago you downloaded it, and keeping up to date stays the launcher's job.

`--latest` installs the newest release on your channel instead. If the installer's own version is not published on the channel you picked, it says so and points you at `--latest` rather than quietly installing something else.

## Examples

```bash
# Install over SSH, with no desktop
./TuxBloxInstaller --headless --nolaunch

# Install the canary channel
./TuxBloxInstaller --channel canary

# Install the newest release instead of this installer's own version
./TuxBloxInstaller --latest

# Remove TuxBlox completely
~/.tuxblox/TuxBloxInstaller --uninstall
```
