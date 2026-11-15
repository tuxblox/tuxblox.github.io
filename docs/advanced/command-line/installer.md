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
  --latest           Accepted and ignored: installing the newest release
                     instead of this installer's own version.
  --version          Show the release it installs and exit.
  --component-version Show the installer's own version and exit.
  -h, --help         Show this help and exit.
```

Unknown options are an error rather than being ignored, so a typo cannot quietly change what the installer does.

`--dir` has to be an absolute path, and its parent folder has to exist. Use it with `--uninstall` too if you installed somewhere other than the default, so the uninstaller removes the right folder. It will refuse to delete a folder that does not hold a TuxBlox install.

## Which version gets installed

An installer installs the newest release on its channel. So an installer you downloaded a month ago installs what is current today, not what it shipped with, and keeping up to date after that stays the launcher's job. `--version` prints the release the installer itself came from, which is no longer the release it installs.

`--release <ver>` installs a named release instead. If that release is not published on the channel you picked, it says so and tells you to leave `--release` off, rather than quietly installing something else. `--latest` is accepted and ignored: it asks for what already happens, and is still taken so an update handed over by an older launcher keeps working.

## Examples

```bash
# Install over SSH, with no desktop
./TuxBloxInstaller --headless --nolaunch

# Install the canary channel
./TuxBloxInstaller --channel canary

# Install a named release instead of the newest
./TuxBloxInstaller --release 3.9.11.0

# Remove TuxBlox completely
~/.tuxblox/TuxBloxInstaller --uninstall
```
