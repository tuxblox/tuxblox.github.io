# Versions

The Versions tab is where you decide which build of Roblox you are actually running.

Most people never need it. It is there for when a new Roblox release breaks a plugin you rely on, when you need to reproduce a bug against a specific build, or when you want to test your game on an older client.

> **With Auto-Update Roblox on, this tab is read-only.** It still shows every build you have, but the buttons are turned off, because TuxBlox is keeping Roblox up to date and clearing out the builds you no longer run. Turn [Auto-Update Roblox](settings/updates.md#auto-update-roblox) off to use this tab.

## What a version looks like

Roblox identifies each build with a hash, like `version-a1b2c3d4e5f6789a`. That is what you see everywhere in this tab.

Player and Studio have separate lists, even though they share a folder inside the virtual drive. A **Player / Studio** switch along the top picks which list you are looking at.

## Installing a version

**Install a version**, on the right of that switch, opens a small window:

| Control | What it does |
|---|---|
| **Latest** | The newest build on the channel |
| **Previous** | The build immediately before the newest one |
| **Custom** | A specific build, named by its hash |
| **Channel** | Roblox's release channel, `live` unless you have a reason. See [Channels](#channels) |
| **Build** | Only shown for **Custom**: the `version-…` hash you want |

Whichever you pick installs for whichever app the switch is on.

**Previous** is the one most people want. It is the "Roblox broke something today" button.

### Channels

Roblox publishes its builds to named channels. `live` is the one everybody gets, and it is what the box starts on.

Roblox keeps its other channels private. Asking for the newest build on one of those comes back refused, so **Latest** and **Previous** both only work on `live`. Roblox also hides the build list for those channels, which is what **Previous** reads.

If you already know the exact hash you want, pick **Custom**, type the channel name and that hash, and TuxBlox will fetch it. Capitals do not matter.

Whether a channel can be reached at all is Roblox's decision, and TuxBlox cannot change it.

While an install runs you get a progress bar and a label telling you which stage it is at. It stays on the tab itself, so closing the install window does not hide an install that is still going.

Each package is unpacked while the others are still downloading, which makes an install roughly twice as quick as waiting for every download to finish first. Studio is made up of more than thirty packages, so it still takes a moment.

Only one install can run at a time.

## The version list

Each installed build gets a row showing its hash, and under it the version Roblox reports for itself (such as `0.740.0.7400927`) and the channel it came from. The version is read out of the build on disk, so a row cannot claim a version that is not the one installed.

| Button | What it does |
|---|---|
| **Set active** | Makes that build the one that launches from now on |
| **ACTIVE** | A label rather than a button, this is already the active build |
| **Remove** | Behind the **⋮** button on the row: takes that build out of the virtual drive, with a confirm step |

Deleting the active build is allowed. The next launch simply installs Roblox again.

### What an automatic update does to the active build

If you have never pressed **Set active**, TuxBlox keeps the newest build you have as the active one, so an automatic update makes the build it just installed the one that launches.

Once you press **Set active** on a build, that choice is remembered and an automatic update will not move it. The newer build still gets installed and still appears in the list; it just does not become the active one until you say so. Press **Set active** on the newest row whenever you want to follow along again.

## The list reflects reality, not bookkeeping

TuxBlox works out what is installed by looking in the virtual drive, not by trusting a list it wrote earlier. If you delete a version folder by hand it disappears from the tab, and if something appears there that TuxBlox did not install, it shows up.

That means the tab cannot get stuck telling you something is installed when it is not.

The tab also keeps up while it is open. An update that happens in the background, or a build you add or remove yourself, shows up within a second or so without reopening the launcher.

## Roblox still updates itself

Pinning a version is not the same as freezing Roblox forever. Roblox updates itself when it feels the need to, the same way it does on Windows, and joining an experience with a newer client requirement will pull the newer client.

Think of this tab as choosing where to start from, not as a lock.

## When there is nothing listed

A fresh install shows **No versions installed** under both headings. That is normal. Press **Install & Launch** on the Home tab, or install a version here, and the list fills in.
