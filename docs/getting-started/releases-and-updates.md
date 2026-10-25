# Releases and Updates

When a new TuxBlox arrives, how it reaches you, and why the day is a habit rather than a promise.

## When releases happen

**Most Fridays, around 19:00 UTC.**

That is the habit, not a commitment. A release can land earlier in the afternoon, late in the evening, a day or two later, or not that week at all. Nothing is held back to fit the slot and nothing is rushed out to meet it, because a release that misses a Friday is a smaller problem than one that should not have gone out.

So Friday is the day worth checking rather than a date to plan around. The [download page](https://tuxblox.net/releases) carries the date of every build, which is the only authoritative answer to when something actually appeared.

### Why a week moves, or passes

- **Something was found late.** A release that is ready apart from one bug waits for that bug.
- **There was nothing worth shipping.** A quiet week does not get a release just to keep the streak going.
- **Roblox moved first.** A Roblox update that breaks something takes priority over whatever was planned for that week, and that reshuffles the rest of it.
- **A release was withdrawn.** Putting a channel back comes before putting the next release out.

New releases are announced in [Discord](https://tuxblox.net/discord), which is the place to watch if you would rather be told than check.

## How TuxBlox notices a release

TuxBlox checks **once per launcher run**, and that is the whole of it. There is no timer. A launcher left open since Tuesday will not notice Friday's release, and neither will one that is closed — starting the launcher again is what performs the check.

What the check does when it finds something depends on [Automatic updates](../using-tuxblox/settings/updates.md#automatic-updates):

| Automatic updates | What happens |
|---|---|
| **Off** (the default) | The check runs as the window opens. TuxBlox asks first, naming the release and the parts of it that change, and waits for you to answer. |
| **On** | The check runs before the window does, with up to five seconds allowed for an answer, so an update that is about to install does not flash the Home screen up first. |

Dismissing the notification hides it for that run only. It is not a decision that gets remembered, so the next time you start the launcher the update is offered again.

If you do not want to wait for the launcher to ask, the [download page](https://tuxblox.net/releases) always shows what each channel is on, and installing from there works at any time.

## Which channel gets it, and when

Every release is published to exactly one channel, so the channel you follow decides not only how tested your TuxBlox is but how soon you see anything at all.

| Channel | What arrives, and when |
|---|---|
| `stable` | Tested releases. This is the Friday habit described above. |
| `canary` | New work earlier, when there is new work to put there. |
| `experimental` | Builds made to try something out. They appear whenever something needs trying, which may be twice in a week or not for a month. |

A channel sits wherever its own last release left it, so `canary` is not automatically ahead of `stable` — a quiet stretch on `canary` and a couple of stable releases will leave it behind. What each channel is currently on is on the [download page](https://tuxblox.net/releases), and the channel your own copy came from is at the bottom of the launcher's Home tab.

[Update channel](../using-tuxblox/settings/updates.md#update-channel) covers what switching does, including the part where moving to a channel on an older release moves you back onto it.

## What changed in a release

The [download page](https://tuxblox.net/releases) lists each release with its changelog, its date and its file sizes, earlier versions underneath. That is the record of what a release contained.

These documentation pages describe TuxBlox as it is now rather than as any one release, so a page can change in the same week a release does. They do not describe a release that has not gone out yet — a page for something unreleased is held back until the day it ships.

## Roblox's updates are not TuxBlox's

The two are unrelated. Roblox puts out new builds of the Player and Studio frequently and on its own schedule, and none of that is coordinated with a Friday here.

TuxBlox handles those for you. With [Auto-Update Roblox](../using-tuxblox/settings/updates.md#auto-update-roblox) on, which is the default, it checks before each launch and installs a new Roblox build if there is one. That check is silent, and it happens whether or not TuxBlox itself has an update waiting.

So "there is an update" means one of two different things, and they arrive by different routes:

| What | How you see it |
|---|---|
| A new Roblox build | A download, before Roblox starts |
| A new TuxBlox release | A notification in the launcher |

To hold Roblox at a particular build instead, the [Versions](../using-tuxblox/versions.md) tab installs and pins one.

## When a release is withdrawn

Occasionally a release turns out to be broken badly enough that leaving it up is worse than taking it back. The channel is pointed at the release before it, and the next check offers you that earlier version the same way it would offer a newer one. You are asked first, unless automatic updates are on.

This is why being *ahead* of your channel is a normal thing to see rather than a sign that something went wrong. [Automatic updates](../using-tuxblox/settings/updates.md#automatic-updates) describes the one case that ignores the setting entirely: an install whose pieces do not match each other is repaired straight away, because that is broken rather than merely out of date.
