# Updates

Which releases TuxBlox follows, and how it installs them.

## Update channel

**Default: stable**

Which release stream TuxBlox follows.

| Channel | Who it is for |
|---|---|
| `stable` | Everyone. Tested releases only. |
| `canary` | New features early, with the occasional rough edge. Still meant to be usable day to day. |
| `experimental` | Work in progress builds. Things are expected to break here. |

**If you want to be ahead of stable, use `canary`.** It is the one built for people who want new things sooner, and it is the only channel other than stable we would suggest running day to day.

`experimental` is not an "even newer canary". It is where things go to be tried, including the ones that do not work. Run it only if being broken occasionally is the point for you.

> [!NOTE]
> `experimental` used to be called `dev`. If your settings still say `dev`, TuxBlox moves you to `experimental` automatically, and `--channel dev` on the command line still works. Nothing about the channel itself changed.

Switching channels makes TuxBlox move to that channel's current release on the next check. That can mean going backwards, if the channel you picked is on an older version than the one you have — you asked for that channel, so TuxBlox gives you what is on it.

The channel shown at the bottom of the Home tab is the one the version you are running came from, so it changes when the update lands rather than the moment you pick a new channel.

> [!WARNING]
> Bug reports from `canary` and `experimental` are welcome, but say which channel you are on. An `experimental` build may already be broken in ways nobody has looked at yet.

## Automatic updates

**Default: off**

When on, updates install themselves as soon as TuxBlox finds one.

When off, you get a notification in the corner of the launcher instead, and nothing happens until you click it.

Off is the default because an update that starts on its own while you are about to open Studio is annoying. Turn it on if you would rather never think about it.

TuxBlox keeps you on the version your channel publishes, which is usually the newest one but not always. If a release turns out to be broken, the channel is pointed back at the release before it, and the next check moves you back the same way an update moves you forward. You are asked first, like any other update, unless automatic updates are on.

One case ignores this setting. TuxBlox is several programs that ship together and are meant to be the same version, and an update interrupted partway through can leave them mismatched. TuxBlox checks for that at startup and repairs it straight away, because a mismatched install is broken rather than merely out of date. It is not something you can end up in by choosing to postpone an update.

This setting is about TuxBlox itself. Roblox has its own setting below.

## Auto-Update Roblox

**Default: on**

Before each launch, TuxBlox checks whether Roblox has put out a newer build and installs it if so. The check itself is silent; a window appears only when there is actually something to download.

When off, you keep whichever build you have until you install another one yourself from the Versions tab.

On is the default because this is what happens on Windows too, and a Roblox that is behind can refuse to join an experience. If the check cannot finish, TuxBlox starts the Roblox you already have rather than stopping, and says so in a desktop notification.
