# The Launcher

The TuxBlox Launcher is the window you use for everything: starting Roblox, changing settings, managing Roblox versions, and editing FastFlags.

Start it from your applications menu, or with `~/.tuxblox/TuxBloxLauncher`.

## The sidebar

Six tabs down the left side:

| Tab | What it is for |
|---|---|
| **Home** | Start Roblox Player or Roblox Studio |
| **Sessions** | What is open, and each session's log |
| **Versions** | Install, pin and remove Roblox builds |
| **FastFlags** | Roblox's own internal settings |
| **Settings** | Everything about TuxBlox itself |
| **About** | Version, links, license |

## Home

Two cards, one for Roblox Player and one for Roblox Studio.

The button on each card tells you what state that app is in:

- **Install & Launch** means Roblox is not in the virtual drive yet. Pressing it downloads and installs Roblox first, then starts it.
- **Launch Studio** or **Launch Player** means it is installed and ready.
- **Stop Player**, red, means a Player session is open. Pressing it closes that session.

Under each card's name is the Roblox version it will start, such as `0.740.0.7400927`, and which channel it came from. If TuxBlox cannot read a version out of that build it shows the folder name Roblox installed it under instead, which looks like `version-2366ba214ec740ca`.

### Open sessions

Below the cards is everything open right now, one line each, with how long it has been going and how much memory it is using. It says so when nothing is running.

**Open** on the right of a line takes you to that session in the [Sessions](sessions.md) tab, with its log already on screen.

### Closing what is running

The Player card's one button becomes a red **Stop Player** while a session is open, because one Player session runs at a time, so starting another is not on offer anyway.

Studio can have several open at once, so its card always offers **Launch Studio**, however many are already running. Closing one is the Sessions tab's job: the list of what is open sits right below the cards, and **Open** on any line takes you to it.

**Stopping Studio closes it immediately, and anything you have not saved is lost.** Studio is not given the chance to ask you to save first, so save before you stop it.

Starting the Player again while a session is open closes that session and starts a new one. Roblox runs one Player session at a time, which means the new launch replaces the old one rather than opening beside it — and because it is a new session rather than a return to the old one, you start again from the beginning. The Home screen's Player button never does this: while a session is open it says Stop, so closing and starting are two deliberate presses. A desktop shortcut, a Roblox link or a place file does replace the running session.

At the bottom of the tab is a status strip:

- On the left, the release you are running and the channel it came from. That is not always the channel you are set to follow: switching channels in Settings changes what you will get next, and this changes when that update lands.
- On the right, the update state (`Up to date`, `Checking…`, `Out of date`, `Updating`, `Update check failed`), and an **Update** button when there is one to install.

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

See [Settings](settings/launcher.md).

## About

Your TuxBlox version, the copyright notice, and links to the website, documentation, GitHub, Discord, privacy policy and terms of use.

If you are reporting a bug, the version number here is the one to quote.

## Update notifications

When an update is available and **Automatic updates** is off, TuxBlox opens a window titled **Update available**. It names the release you would move to and lists which parts of TuxBlox change, each as `Launcher 3.5.0 → Launcher 3.5.1`, so you can see what is actually in it before deciding. It asks whether you would like to update, with **Update** and **Not now**.

The bottom right of the Home page reads `Out of date` with an **Update** button beside it, which does the same thing.

**Not now** leaves you on your current version and leaves the button where it is, so you can start the update later from the Home page. The window appears once per release offered, not on every check. With automatic updates on, you never see it, the update just installs.

> [!NOTE]
> If TuxBlox is missing its compatibility layer entirely, rather than just having an old one, it updates immediately whatever this setting says. There would be nothing to launch otherwise.

## One window at a time

Trying to open a second launcher tells you one is already running. This stops two copies from fighting over the same settings file and the same virtual drive.

Launches started from a desktop shortcut or a `roblox:` link do not count, so those still work while the launcher is open.
