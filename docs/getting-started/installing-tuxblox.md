# Installing TuxBlox

TuxBlox does not need Flatpak, Snap, or your distribution's package manager. It installs into a single folder in your home directory and never asks for root.

There are two ways to install it. Both end up in the same place.

## Option 1: The install script

This is the easiest way. You need a terminal, `curl` and `bash`, which practically every Linux distribution already has.

```bash
curl -sSLf https://tuxblox.net/install.sh | bash
```

That downloads the installer, runs it, and starts TuxBlox when it finishes.

<details>
<summary>Prefer to read the script before running it?</summary>

Reasonable. Piping a script from the internet into your shell is a habit worth being careful about.

```bash
curl -sSLf https://tuxblox.net/install.sh -o install.sh
less install.sh
bash install.sh
```

</details>

## Option 2: The installer from the releases page

1. Go to [tuxblox.net/releases](https://tuxblox.net/releases).
2. Download **TuxBloxInstaller**.
3. Double click it in your file manager.

If double clicking does nothing, your system has probably not marked it as a program yet. Open a terminal where you downloaded it and run:

```bash
chmod +x TuxBloxInstaller
./TuxBloxInstaller
```

A window opens and walks you through the rest. It has a normal title bar and follows your desktop's light or dark setting.

The installer is one file of about 13.9 MB, up from about 4.3 MB in earlier versions, because it now carries its own interface inside it. Nothing extra has to be installed first. The first time you open the window, it unpacks that interface into `~/.cache/tuxblox` (see [Files and Folders](../advanced/files-and-folders.md#the-cache-folder)), which takes a moment; later runs reuse it. It also opens on machines whose graphics driver could not run the old installer.

> [!TIP]
> On a machine with no desktop, such as a server you are testing on over SSH, run `./TuxBloxInstaller --headless` instead. It reports progress in the terminal and never tries to open a window. See [Command Line Reference](../advanced/command-line.md) for the other flags.

## What the installer actually does

Nothing surprising, and nothing outside your home folder:

- Creates `~/.tuxblox` and downloads TuxBlox into it.
- Writes desktop entries so TuxBlox appears in your applications menu.
- Registers `roblox:` links and `.rbxl` files so they open in TuxBlox.
- Starts the launcher.

It never asks for your password, never touches system directories, and never installs a background service. If you try to run it as root it refuses, because an install made by root is one your normal account cannot update or write to afterwards.

## Installing somewhere else

`~/.tuxblox` is only the default. To put TuxBlox somewhere else, give the installer a folder:

```bash
./TuxBloxInstaller --dir /opt/tuxblox
```

The path has to be absolute, and the folder it goes in has to exist already. Pick somewhere your own account can write to: TuxBlox updates itself in place, so an install in a folder you need root for cannot update.

You can also move an install after the fact. Every part of TuxBlox looks for the others next to itself, so moving the whole folder is enough; nothing inside it records where it used to be. The desktop entries still point at the old place, though, so open the launcher once from the new location and it will write them again.

## Starting TuxBlox

Once installed, you can start it in either of these ways:

- **From your desktop.** Open your applications menu and search for **TuxBlox**.
- **From a terminal.** Run `~/.tuxblox/TuxBloxLauncher`, or `TuxBloxLauncher` inside whichever folder you installed into.

Next: [Your First Launch](first-launch.md).

## Updating

You do not reinstall to update. The launcher checks for updates when it starts and, depending on your settings, either installs them or shows you a notification first. See [Settings](../using-tuxblox/settings.md#updates) to change which one it does.

## Uninstalling

Open the launcher, go to **Settings**, scroll to **Danger zone**, and press **Uninstall TuxBlox** twice.

From a terminal, the equivalent is:

```bash
~/.tuxblox/TuxBloxInstaller --uninstall
```

Either one removes the TuxBlox folder entirely, including your virtual drive and everything Roblox installed into it, plus the desktop entries, the file associations and the installer's interface in `~/.cache/tuxblox`.

If you installed somewhere other than the default, pass the same folder again, so the uninstaller removes the right one:

```bash
/opt/tuxblox/TuxBloxInstaller --uninstall --dir /opt/tuxblox
```

It checks the folder really is a TuxBlox install before deleting anything, and refuses if it is not.
