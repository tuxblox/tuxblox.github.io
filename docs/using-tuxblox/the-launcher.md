# The Launcher

The TuxBlox Launcher is the window you use for everything: starting Roblox, changing settings, managing Roblox versions, and editing FastFlags.

Start it from your applications menu, or with `~/.tuxblox/TuxBloxLauncher`.

## The sidebar

Five tabs down the left side:

| Tab | What it is for |
|---|---|
| **Home** | Start Roblox Player or Roblox Studio |
| **Versions** | Install, pin and remove Roblox builds |
| **FastFlags** | Roblox's own internal settings |
| **Settings** | Everything about TuxBlox itself |
| **About** | Version, links, license |

## Home

Two cards, one for Roblox Player and one for Roblox Studio.

The button on each card tells you what state that app is in:

- **Install & Launch** means Roblox is not in the virtual drive yet. Pressing it downloads and installs Roblox first, then starts it.
- **Launch Studio** or **Launch Player** means it is installed and ready.

Under each card's name is the Roblox version it will start, such as `0.740.0.7400927`, and which channel it came from. If TuxBlox cannot read a version out of that build it shows the folder name Roblox installed it under instead, which looks like `version-2366ba214ec740ca`.

At the bottom of the tab is a status strip:

- On the left, whether Roblox is running.
- On the right, your TuxBlox version, your update channel, and the update state (`Up to date`, `Checking`, `Version 2.1.0 available`, and so on).

TuxBlox checks for an update as soon as it opens. The cards stay where they are while it does, so there is nothing to wait for before pressing a button. The screen is only given over to a progress bar when an update is actually being installed.

If automatic updates are on, the check happens before the window opens at all, so an update that is about to install does not flash the Home screen up first.

### The launcher closes when Roblox starts

This is the default, and you can turn it off with **Minimize to background** in Settings.

Once Roblox is running the launcher has no reason to sit in your taskbar, so it hands the session to a small background watcher and closes. The watcher is what notices if Roblox exits badly and shows you a message about it, so nothing is lost by the window closing.

In a process list the watcher appears as `tuxbloxWatcher`, separately from the launcher itself. They are the same program, so without that they would be indistinguishable, and anything that went looking for the launcher by name would find a running Roblox session instead.

With the setting off the window stays open and usable instead, which is handy for starting Studio and the Player together or changing a setting mid session.

## Versions

Where you decide which build of Roblox you are running. Useful if a new Roblox release breaks a plugin you depend on, or if you are testing something against a specific build.

See [Versions](versions.md).

## FastFlags

Roblox's internal feature switches, editable without touching any files. Separate lists for Player and Studio.

See [FastFlags](fastflags.md).

## Settings

Whether the window closes when Roblox starts, update channel, automatic updates, graphics card selection, controller vibration, detailed logging, crash reporting, and the danger zone.

See [Settings](settings.md).

## About

Your TuxBlox version, the copyright notice, and links to the website, documentation, GitHub, Discord and privacy policy.

If you are reporting a bug, the version number here is the one to quote.

## Update notifications

When an update is available and **Automatic updates** is off, TuxBlox shows a desktop notification, `TuxBlox 2.1.0 is available`, with an **Update** button on it. The bottom right of the Home page reads `Version 2.1.0 available` with an **Update** button too.

Pressing either **Update** starts the update. If your desktop's notifications cannot show buttons, you get the notification without one and use the Home page. Ignoring it leaves you on your current version until next time. With automatic updates on, you never see the notification, the update just installs.

> [!NOTE]
> If TuxBlox is missing its compatibility layer entirely, rather than just having an old one, it updates immediately whatever this setting says. There would be nothing to launch otherwise.

## One window at a time

Trying to open a second launcher tells you one is already running. This stops two copies from fighting over the same settings file and the same virtual drive.

Launches started from a desktop shortcut or a `roblox:` link do not count, so those still work while the launcher is open.
