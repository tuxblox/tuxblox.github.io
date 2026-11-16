# Building From Source

> [!WARNING]
> **Most people should not do this.** A first build takes several hours and needs around 40 GB of disk. Installing normally takes about a minute and gets you the same thing. Build from source only if you want to change something.

Building has its own requirements, separate from the ones needed just to run TuxBlox.

## Requirements

| | |
|---|---|
| **Processor** | A modern x86-64 processor. More cores means a shorter wait. |
| **Memory** | 16 GB of RAM, and lower `JOBS` to match. See below. |
| **Storage** | 40 GB free |
| **Packages** | `make`, `python3`, `podman`, `curl`, `git`, `zstd`, `gcc`, `uidmap` |

Building inside WSL or a virtual machine is not supported.

A full `make` also builds the AppImage and the Flatpak at the end, and those need two more things. Neither is needed for TuxBlox itself, so install them only if you want the packaged forms, and otherwise set `TUXBLOX_NO_PACKAGES=1` to skip them:

| For | Also needs |
|---|---|
| The AppImage | `appimagetool`, `squashfs-tools` |
| The Flatpak | `flatpak`, `flatpak-builder` |

`appimagetool` is not in most distributions' repositories. It comes from the [AppImage project's own releases](https://github.com/AppImage/appimagetool/releases), and on Arch it is the `appimagetool-bin` package in the AUR. Without it the build still assembles the AppImage's contents and tells you how to run them in place, rather than failing, so you can skip it unless you want the single file.

Without `flatpak-builder` the Flatpak step stops and says so; `flatpak install flathub org.flatpak.Builder` is the other way to get it if your distribution does not package it.

The Flatpak build also pulls its runtime from Flathub the first time, which is a download of its own:

```bash
flatpak install flathub org.freedesktop.Platform//26.08 org.freedesktop.Sdk//26.08
```

See [Packaging builds](#packaging-builds) for what each one produces and the extensions the Flatpak needs before it will run.

Most of that disk is not what you built. The clone with its submodules is about 11 GB, what the build produces is about 7 GB on top of it, and podman keeps another 22 GB of container images and caches outside the repository entirely. Over repeated builds the compiler cache grows further, so leave some room.

Building the packaged forms adds to that: about 700 MB inside `build/`, and roughly 2.5 GB of Flatpak runtime, SDK and extensions outside the repository, which Flatpak shares with any other Flatpak you have.

Memory is the one that bites. Parts of the web panel need 2 to 4 GB of RAM *per parallel job* while compiling, so the right number of jobs depends on how much you have, not how many cores you have. On 32 GB, twelve jobs run out of memory and six do not. If a build dies with no error, or takes the whole machine down with it, that is what happened: lower `JOBS` and start again. Nothing already compiled is lost.

A first build is long because three large things have to be built once — the interface stack, the web panel Roblox signs in through, and the compatibility layer. Each is around an hour or more. Afterwards they are reused, and ordinary rebuilds take minutes.

> [!IMPORTANT]
> **Podman, not Docker.** Parts of the build run inside a container using `podman run --userns=keep-id`, a rootless flag Docker does not have. Docker is fine for anything else in the repository, but it will not work for these steps.

## Building

### 1. Clone the repository

```bash
git clone https://github.com/cherrypath0/tuxblox
cd tuxblox
```

### 2. Build

```bash
make
```

Do not run this with `sudo`. The build works out which package manager you have and installs anything missing, asking for your password only if it needs to.

Then wait. The first build compiles the entire compatibility layer, and the web panel Roblox uses for signing in, which is most of the time.

### Building one part

Each part is its own target, so you can rebuild just what you changed instead of everything:

| Command | What it builds |
|---|---|
| `make` | Everything |
| `make launcher` | The launcher |
| `make installer` | The installer |
| `make studio-mcp` | The Studio helper |
| `make appimage` | The installer as an AppImage. See [Packaging builds](#packaging-builds). |
| `make flatpak` | The whole of TuxBlox as a Flatpak. See [Packaging builds](#packaging-builds). |
| `make compat` | The compatibility layer |
| `make webkitgtk` | The web panel, from scratch. Hours. |
| `make webkitgtk-host` | Only the small helper that positions the web panel. Minutes. |
| `make clean` | Delete `build/` |
| `make distclean` | Also delete the interface stack and the cached sources |

Nothing is rebuilt unless something it depends on actually changed, so running `make` again after a build that already succeeded finishes in seconds.

### Build-time variables

A few things are set through the environment rather than a flag. These affect the build only — none of them mean anything to a TuxBlox that is already installed, and none belong in [Environment Variables](../advanced/environment-variables.md).

| Variable | What it does |
|---|---|
| `JOBS` | How many compile jobs to run at once, instead of one per core |
| `TUXBLOX_RM_DIST` | Delete the compatibility layer's leftover build files afterwards, freeing disk at the cost of a slower next build |
| `TUXBLOX_HEADLESS_ONLY` | Build the installer without its window, for a machine with no display |
| `TUXBLOX_DONT_INCREMENT_BUILD` | Leave the build counter where it is, so the build changes nothing in your checkout |
| `TUXBLOX_NO_PACKAGES` | Skip the AppImage and the Flatpak that a full `make` builds at the end |
| `NODIST` | Compile the compatibility layer without assembling it, as a quick check that a change still builds |

```bash
make JOBS=4
```

**Building the project as it is, with no changes of your own? Use this:**

```bash
TUXBLOX_DONT_INCREMENT_BUILD=1 make
```

Every build advances the build counter, which is line 2 of the `VERSION` file at the repository root, and that number is baked into each program as part of the release it reports. It is what makes two builds of the same sources tell themselves apart, which is worth having while you are changing something and not worth having when you are not: without it, `git status` shows `VERSION` modified after every build, and `git pull` has something to complain about.

Held that way, building the same commit twice produces the same files, byte for byte. The build takes its dates from the commit rather than the clock, and nothing it writes carries the machine it was built on.

Lowering `JOBS` is the fix if a build runs the machine out of memory. The web panel in particular needs roughly 2 to 4 GB per job while compiling, so on a 32 GB machine twelve jobs fail and six do not.

To keep settings without typing them each time, put them in `config.mk` at the repository root. It is ignored by git and read automatically:

```make
JOBS ?= 6
```

There is also `TUXBLOX_SKIP_DEPS`, but it is not for you to set: the build does its own dependency check and passes this down to each part so they do not each repeat it. It only matters if you run a part's own script, such as `./launcher/build.sh`, by hand.

### 3. Install what you built

The programs land in `build/native/`. **Use the repository's own script to install them**, rather than copying anything by hand:

```bash
./stage.sh
```

It copies the five parts into `~/.tuxblox`, refuses while a launcher from there is running, and leaves the virtual drive alone so your installed Roblox versions, logs and settings survive. `--fresh-prefix` deletes that drive instead, and `--carry-prefix` replaces it with the one under `build/`.

Copying by hand is the thing to avoid here. Only `build/native/` is yours to install: the rest of `build/` is the compiler's working space, tens of gigabytes of it, alongside the virtual drive, which can hold Roblox session cookies and does not belong in a copy of anything. `stage.sh` names the five parts one by one for that reason.

When it finishes it prints where the install is, how to start it, and anything else the build produced that it did not stage, with the command for each:

```
Staged /home/you/.tuxblox
  Version:   3.12.14.0
  Prefix:    kept
  Run:       /home/you/.tuxblox/TuxBloxLauncher
  Installer: /home/you/.tuxblox/TuxBloxInstaller

Also built not staged, each installs its own way
  Flatpak:   flatpak install --user /home/you/tuxblox/build/flatpak/repo net.tuxblox.TuxBlox
  AppImage:  /home/you/tuxblox/build/appimage/TuxBloxInstaller.AppImage
```

The `Flatpak` and `AppImage` lines appear only when you actually built those, and the Flatpak one is the whole command: see [Packaging builds](#packaging-builds) for what that install is and the 32-bit extensions it needs first.

**If all you want is to run the installer you built**, rather than staging, you do not need `stage.sh` at all. Either of these works straight out of the build, and both install TuxBlox into `~/.tuxblox` the ordinary way, so you end up with a normal install:

```bash
./build/native/TuxBloxInstaller
./build/appimage/TuxBloxInstaller.AppImage
```

No desktop shortcuts or link handlers are set up by staging, so add those yourself if you want them, or run the installer, which does it for you.

**A build of your own is not replaced by an update.** An install whose release, or any one of whose parts, is ahead of what its channel publishes was built rather than downloaded, so TuxBlox leaves it alone: it is neither updated nor repaired, and the window says **TuxBlox (Internal)** so you can tell at a glance which one you are looking at. It goes back to following the channel once the channel catches up.

## Rebuilding

Later builds are much faster, because TuxBlox reuses what it can. Only what actually changed gets compiled again, and a part whose sources are untouched is not rebuilt at all.

`build/` is kept between builds, including the virtual drive underneath it, so anything you put there stays. `make clean` removes it when you want a fresh start.

## Running what you built, in place

`build/native/` has the same shape as an install, and every part of TuxBlox looks for the others next to itself, so you can just run the launcher out of it:

```bash
./build/native/TuxBloxLauncher
```

It uses `build/runtime` as its virtual drive and `build/native/logs` for its logs, leaving any real install at `~/.tuxblox` alone. The virtual drive and the downloaded Roblox sit at `build/` itself rather than inside `build/native`, because they are the machine's state rather than any one build's output: each flavour links to them instead of keeping a second copy, and a virtual drive is well over a gigabyte.

To skip the launcher and start a program through the compatibility layer yourself:

```bash
TUXBLOX_PREFIX="$PWD/build/runtime" \
  ./build/native/compat/main run \
  "$PWD/build/runtime/pfx/drive_c/users/<your account>/AppData/Local/Roblox/Versions/version-<id>/RobloxStudioBeta.exe"
```

`<your account>` is your own username, which is what the drive names its account folder after. Replace `version-<id>` with whichever folder is actually there; Roblox picks a new name on every update, so list the `Versions` folder to see it.

A freshly built virtual drive has no Roblox in it yet. Download the official Roblox installer and run it the same way first, and it will install into that drive rather than your real one.

Two things will cost you an afternoon if you do not know them:

- The path must be absolute, and the program must sit inside `drive_c`. A program anywhere else exits instantly with no message of any kind, which looks exactly like a crash and is not one.
- Read the program's output in the terminal. Redirecting it to a file leaves the program with no output to write to, and you get an empty file.

This all uses the virtual drive inside `build/` rather than your installed one, so experiments cannot damage a working install.

## Packaging builds

A full `make` also builds two packaged forms at the end, and each has its own target:

| Command | What it produces |
|---|---|
| `make appimage` | The installer as a single AppImage file, in `build/appimage/` |
| `make flatpak` | The whole of TuxBlox as a Flatpak, in `build/flatpak/` |
| `make packages` | Both |

Set `TUXBLOX_NO_PACKAGES=1` to leave them out of a full build.

Both need a complete `make` first, because they package what that produced rather than compiling it themselves. They say so and stop if something is missing. The Flatpak also needs `flatpak-builder`, either from your distribution or as `flatpak install flathub org.flatpak.Builder`.

> [!IMPORTANT]
> **The normal install is the one to use.** These are for people who want to build or test them. A normal install updates itself, part by part, as soon as a release is published; it can reach anywhere in your home folder, so a place you save somewhere unusual still works; and it is what almost everyone runs, so it is far better tested. Nothing below is a better way to get TuxBlox, only a different one.

### The Flatpak

`make flatpak` writes a repository at `build/flatpak/repo` and prints the command to install from it. **It is not published anywhere**, so there is no Flathub entry and nothing to install from the internet; the only way to get it today is to build it yourself.

```bash
flatpak install --user ./build/flatpak/repo net.tuxblox.TuxBlox
```

The `./` matters. Given a bare `build/flatpak/repo`, Flatpak reads it as the name of a remote rather than a folder and fails with `'build' is not a valid name`. An absolute path works too, which is the form `stage.sh` prints.

It needs 32-bit libraries to run, because the virtual drive contains 32-bit programs and so does the compatibility layer. The graphics one will not download itself:

```bash
flatpak install flathub org.freedesktop.Platform.Compat.i386//26.08
flatpak install flathub org.freedesktop.Platform.GL32.default//26.08
```

The Flatpak carries a **different launcher**, built from the same sources with the parts that cannot work from a read-only `/app` left out: there is no update channel, no automatic updates toggle and no uninstall button, because `flatpak update` and `flatpak uninstall` do those jobs instead. It still updates Roblox itself. On first run it downloads the compatibility layer into its own data folder, the same way it downloads Roblox, rather than carrying a gigabyte that Flatpak could not update piece by piece.

It asks for your Desktop, Documents, Downloads, Music, Pictures and Videos folders rather than your whole home folder, so a place saved outside those is not reachable from inside the sandbox. Its settings and its virtual drive live in `~/.var/app/net.tuxblox.TuxBlox/`, entirely separate from a normal install at `~/.tuxblox`, so the two do not share anything and installing one does not disturb the other.

Roblox Studio runs under the sandbox. Roblox Player support is still in progress everywhere, not only here, so the Flatpak is no further behind on it than a normal install.

`make flatpak` leaves `build/native/TuxBloxLauncher` untouched, so the launcher that `stage.sh` installs is still the ordinary one.

### The AppImage

`make appimage` packages the installer, not TuxBlox itself: you run the AppImage, it installs TuxBlox into `~/.tuxblox` exactly as the ordinary installer does, and what you end up with is a normal install. It keeps itself out of your applications menu, since the thing you want in the menu is TuxBlox rather than its installer. Building it needs `appimagetool` and `squashfs-tools`.

## Versioning

Each part of TuxBlox carries its own version, in a `VERSION` file beside its own sources — the launcher, the installer, the compatibility layer and the rest each have one, and they are expected to differ. A part that did not change keeps the number it already had.

The version of the whole release is not typed in anywhere. It is worked out when the build is staged, from what each part's version did and from what the channels already publish, so it describes what actually changed. It has four parts:

```
MAJOR . MINOR . BUILD . PATCH
```

`BUILD` counts builds, and the build is what counts them: `make` advances it once per run, before anything is compiled, so every part of one build carries the same number. It only ever counts up and nothing resets it. Packaging a release does not advance it again; moving tested work to `canary` or `stable` is not another build of it, and a release carrying nothing but fixes keeps the same `BUILD` and moves `PATCH` instead, so `3.7.7.1` is the first fix released on top of build 7.

The `VERSION` file at the repository root holds three lines: the floor the next release must beat, that build counter, and the channel. Only line 2 moves on its own, and only when you build. Set `TUXBLOX_DONT_INCREMENT_BUILD=1` to hold it still, which is what you want when you are building the project unchanged.

What a program you built answers to `--version` comes from those lines, so it is a real release number rather than a placeholder. `--component-version` answers with that one part's own version instead.

Working out the release needs `setup.tuxblox.net` to be reachable, because that is where it reads what is already published. If you are building offline, or you want a particular number, set it yourself:

```bash
TUXBLOX_BUILD_VERSION=3.7.7.1 TUXBLOX_CHANNEL=experimental make
```

Building never contacts that server. Only packaging a release does, which is a separate step a normal clone has no reason to run.

## When a build fails

The error is printed where it happened. To keep the whole thing for reading afterwards:

```bash
make 2>&1 | tee build.log
```

A build that stops with no error at all, or takes the machine down with it, is almost always out of memory. Lower `JOBS` and try again; nothing already compiled is lost.

If you are stuck, ask in [Discord](https://tuxblox.net/discord) with that part of the output.

## Changing something

Read [Repository Structure](repository-structure.md) first, to know which half of the project you are in. The licensing split matters, and so does which folder a change belongs in.

Then read [Contributing](contributing.md) before opening a merge or pull request.
