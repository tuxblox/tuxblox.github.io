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

Most of that disk is not what you built. The clone with its submodules is about 11 GB, what the build produces is about 7 GB on top of it, and podman keeps another 22 GB of container images and caches outside the repository entirely. Over repeated builds the compiler cache grows further, so leave some room.

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

```bash
make JOBS=4
```

Lowering `JOBS` is the fix if a build runs the machine out of memory. The web panel in particular needs roughly 2 to 4 GB per job while compiling, so on a 32 GB machine twelve jobs fail and six do not.

To keep settings without typing them each time, put them in `config.mk` at the repository root. It is ignored by git and read automatically:

```make
JOBS ?= 6
```

There is also `TUXBLOX_SKIP_DEPS`, but it is not for you to set: the build does its own dependency check and passes this down to each part so they do not each repeat it. It only matters if you run a part's own script, such as `./launcher/build.sh`, by hand.

### 3. Install what you built

Everything lands in `build/`. To use it:

```bash
mkdir -p ~/.tuxblox
cp -a build/* ~/.tuxblox/
~/.tuxblox/TuxBloxLauncher
```

This does not set up desktop shortcuts or link handlers, so add those yourself if you want them.

A build installed this way still gets normal updates, which will replace it. Switch to the `experimental` channel, or skip updates, if you want to keep your own build.

## Rebuilding

Later builds are much faster, because TuxBlox reuses what it can. Only what actually changed gets compiled again, and a part whose sources are untouched is not rebuilt at all.

`build/` is kept between builds, including the virtual drive underneath it, so anything you put there stays. `make clean` removes it when you want a fresh start.

## Running what you built, in place

`build/` has the same shape as an install, and every part of TuxBlox looks for the others next to itself, so you can just run the launcher out of it:

```bash
./build/TuxBloxLauncher
```

It uses `build/runtime` as its virtual drive and `build/logs` for its logs, leaving any real install at `~/.tuxblox` alone.

To skip the launcher and start a program through the compatibility layer yourself:

```bash
TUXBLOX_PREFIX="$PWD/build/runtime" \
  ./build/compat/main run \
  "$PWD/build/runtime/pfx/drive_c/users/<your account>/AppData/Local/Roblox/Versions/version-<id>/RobloxStudioBeta.exe"
```

`<your account>` is your own username, which is what the drive names its account folder after. Replace `version-<id>` with whichever folder is actually there; Roblox picks a new name on every update, so list the `Versions` folder to see it.

A freshly built virtual drive has no Roblox in it yet. Download the official Roblox installer and run it the same way first, and it will install into that drive rather than your real one.

Two things will cost you an afternoon if you do not know them:

- The path must be absolute, and the program must sit inside `drive_c`. A program anywhere else exits instantly with no message of any kind, which looks exactly like a crash and is not one.
- Read the program's output in the terminal. Redirecting it to a file leaves the program with no output to write to, and you get an empty file.

This all uses the virtual drive inside `build/` rather than your installed one, so experiments cannot damage a working install.

## Versioning

Each part of TuxBlox carries its own version, in a `VERSION` file beside its own sources — the launcher, the installer, the compatibility layer and the rest each have one, and they are expected to differ. A part that did not change keeps the number it already had.

The version of the whole release is not typed in anywhere. It is worked out when the build is staged, from what each part's version did and from what the channels already publish, so it describes what actually changed. It has four parts:

```
MAJOR . MINOR . BUILD . PATCH
```

`BUILD` counts builds. It only ever counts up, nothing resets it, and only a build for the `experimental` channel advances it — moving tested work to `canary` or `stable` is not another build of it. A release that carries nothing but fixes leaves `BUILD` alone and moves `PATCH` instead, so `3.7.7.1` is the first fix released on top of build 7.

The `VERSION` file at the repository root holds three lines: the floor the next release must beat, the build counter, and the channel. Those are written back when a release is packaged, not when it is built, so an ordinary `make` leaves the file alone.

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
