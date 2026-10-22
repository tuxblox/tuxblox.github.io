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

Once a newer build is in, TuxBlox removes the older builds of that app and the downloads they came from, so the versions folder holds the one you are playing on rather than every build of the last few months. Player and Studio are counted separately: updating one never removes builds of the other, and a build that is still open is left where it is.

Because TuxBlox is choosing the build while this is on, the Versions tab only shows what is installed and its buttons are turned off. Turn this setting off to pick a build yourself again.

When off, you keep whichever build you have until you install another one yourself from the Versions tab, and nothing is ever removed for you.

On is the default because this is what happens on Windows too, and a Roblox that is behind can refuse to join an experience. If the check cannot finish, TuxBlox starts the Roblox you already have rather than stopping, and says so in a desktop notification.

## norollback

**Default: off. No switch in the launcher.**

This one is only in the settings file. Add the key to the object that is already in `~/.tuxblox/settings.json`, alongside whatever is there:

```json
{
  "channel": "stable",
  "send_crash_reports": false,
  "norollback": true
}
```

> [!CAUTION]
> Add it to the existing file rather than replacing the file with just this key. A `settings.json` missing the fields TuxBlox expects is treated as damaged, and a damaged file falls back to defaults wholesale — so you would lose every other setting, and `norollback` itself would come back off.

Close the launcher first. It rewrites the file whenever you change anything in the window, so an edit made while it is open is simply overwritten. [Files and Folders](../../advanced/files-and-folders.md#settingsjson) describes the rest of the file.

The key is lowercase `norollback`, exactly as written. TuxBlox will not recognise it spelled any other way, and an unrecognised key is ignored rather than reported, so a typo here looks like the setting doing nothing.

It stops TuxBlox moving you *backwards*. If the version you are running is ahead of the one your channel asks for, TuxBlox offers to bring it back in line — the same ordinary update prompt as any other, which you can decline. With `norollback` on, it is not offered at all, and an install that is deliberately ahead is left alone.

That matters for one case: a TuxBlox you [built yourself](../../development/building-from-source.md) rather than downloaded. Your own build is usually ahead of what any channel publishes, so you would otherwise be asked to replace it with a release every time the launcher checks.

If you downloaded TuxBlox, you do not need this. Being ahead of your channel does happen on its own — it is exactly what a withdrawn release looks like, as described under **Automatic updates** above — and that is a case where going backwards is the right outcome.

`norollback` covers the mismatched-component repair as well. When the pieces of an install disagree — the compatibility layer reporting one version while the launcher reports another — TuxBlox normally treats that as a damaged install and repairs it without asking, because a half-applied update leaves exactly that trail. On a build you made yourself the pieces disagree as a matter of course, since you replace them one at a time, and repairing it would fetch the published release over the top of what you built. With `norollback` on, TuxBlox writes what it found to its log and leaves the install alone.

The trade-off is that a genuinely half-applied update is left alone too, and that is the main reason not to turn this on if you downloaded TuxBlox.
