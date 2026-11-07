# Building From Source

> [!WARNING]
> **Most people should not do this.** A first build takes one to two hours and needs 50 GB of disk. Installing normally takes about a minute and gets you the same thing. Build from source only if you want to change something.

Building has its own requirements, separate from the ones needed just to run TuxBlox.

## Requirements

| | |
|---|---|
| **Processor** | A modern x86-64 processor. More cores means a shorter wait. |
| **Memory** | 16 GB of RAM or more |
| **Storage** | 50 GB free |
| **Packages** | `python3`, `podman`, `curl`, `git`, `zstd`, `gcc`, `uidmap` |

Building inside WSL or a virtual machine is not supported.

> [!IMPORTANT]
> **Podman, not Docker.** Parts of the build run inside a container using `podman run --userns=keep-id`, a rootless flag Docker does not have. Docker is fine for anything else in the repository, but it will not work for these steps.

## Building

### 1. Clone the repository

```bash
git clone https://github.com/cherrypath0/tuxblox
cd tuxblox
```

### 2. Run the build script

```bash
./build.sh --log --nodebug
```

Do not run this with `sudo`. The script works out which package manager you have and installs anything missing, asking for your password only if it needs to.

It will ask which release channel to build for, offering `experimental` as the default. Press Enter to accept: work is built on experimental until it has been tested, so the other channels are always chosen deliberately. It does not ask for a version number — that is worked out for you once the build is finished.

Then wait. The first build compiles the entire compatibility layer.

### Build options

| Option | What it does |
|---|---|
| *(none)* | Full build, with each step's output shown |
| `--nodebug` | Quieter. Only summaries, not every step's output. |
| `--log` | Also write everything to `build.log`, and diagnose failures automatically |
| `--stage-only` | Re-package the existing build without rebuilding it |
| `--local` | Build and package, upload nothing. Only has an effect for a maintainer with the upload helper; a normal clone has nothing to upload to and skips it either way. |

`--log` is worth using every time. Without it there is no build log, so a failure leaves nothing to look at.

### Build-time variables

A few things are set through the environment rather than a flag. These affect the build only — none of them mean anything to a TuxBlox that is already installed, and none belong in [Environment Variables](../advanced/environment-variables.md).

| Variable | What it does |
|---|---|
| `TUXBLOX_MAKE_JOBS` | How many compile jobs to run at once, instead of one per core |
| `TUXBLOX_DEV_TOOLS` | Include the development tooling in the build |
| `TUXBLOX_HEADLESS_ONLY` | Build the installer without its window, for a machine with no display |

```bash
TUXBLOX_MAKE_JOBS=4 ./build.sh --log --nodebug
```

There is a fourth, `TUXBLOX_SKIP_DEPS`, but it is not for you to set here: `build.sh` does its own dependency check regardless, and passes this variable down to each component's build script so they do not each repeat it. It only does something if you run a component script such as `./launcher/build.sh` directly.

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

Later builds are much faster, because TuxBlox reuses what it can. Only what actually changed gets compiled again.

A build wipes and recreates `build/` every time, including the virtual drive underneath it, so anything you put there by hand is gone.

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

The `VERSION` file at the repository root holds three lines — the floor the next release must beat, the build counter, and the channel — and `build.sh` writes all three back once it knows what the release became, so the file keeps itself current.

Working out the release needs `setup.tuxblox.net` to be reachable, because that is where it reads what is already published. If you are building offline, or you want a particular number, set it yourself:

```bash
TUXBLOX_BUILD_VERSION=3.7.7.1 TUXBLOX_CHANNEL=experimental ./build.sh --log --nodebug
```

## When a build fails

Re-run with `--log` if you did not already. On a real failure the script searches `build.log` for the last error and prints the surrounding lines, which is usually enough to see what happened.

If you are stuck, ask in [Discord](https://tuxblox.net/discord) with that section of the log.

## Changing something

Read [Repository Structure](repository-structure.md) first, to know which half of the project you are in. The licensing split matters, and so does which folder a change belongs in.

Then read [Contributing](contributing.md) before opening a merge or pull request.
