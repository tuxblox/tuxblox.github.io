# How Flags Work

TuxBlox keeps a set of named switches, its flags, and asks our server what they are set to. Some of what TuxBlox does is decided by them rather than fixed when the release was built, so a feature that turns out to be faulty can be switched back off the same day, for everybody, without anyone installing anything. One that is ready can be switched on the same way.

Every flag chooses between behaviours that are already built into the release you have. The server picks between paths that exist in your copy; it cannot add one, and it cannot make TuxBlox do something the release was not built to do.

## What it means for you

Usually nothing. It does mean two installs on the same release can behave slightly differently, and that an install which has been offline since the day it was installed uses whatever it was built with.

TuxBlox asks **once, as it starts**. The question says which release channel you follow and which kind of processor you have, and nothing about you or your account. The [Privacy Policy](https://tuxblox.net/privacy) covers what that request contains. If the answer does not arrive quickly, TuxBlox carries on with the values it was built with rather than waiting on the network.

A flag is read once per run, so one cannot change position underneath you while TuxBlox is open. Starting it again is what picks up a change.

## Where a value comes from

Three places can set a flag, and the first one that does wins:

| | |
|---|---|
| `flags.json` in your TuxBlox folder | your machine only, and it beats everything below |
| our server | what the answer above says |
| the release itself | the values it was built with, used when nothing above sets one |

A name that no source sets reads the same as one that is set and switched off, so a release that has never heard of a flag behaves as though it were off.

## Setting one on your own machine

Support may ask you to create a `flags.json`. It goes in your TuxBlox folder, the same one as `settings.json`, usually `~/.tuxblox`:

```json
{
    "tbxFlagDisableUpdater": true
}
```

TuxBlox never creates or edits this file; if it exists, a person put it there. Delete it to go back to normal.

Only use names support gives you, or the ones on these pages. A name TuxBlox does not know is ignored, and so is a value of the wrong kind, so a typo quietly does nothing rather than breaking anything. A name says what kind of value it takes: `tbxFlag` is true or false, `tbxString` is text, and `tbxInt` is a whole number.

## The one our server cannot set

`tbxFlagDisableUpdater` is honoured only on your own machine, and a value for it from our server is thrown away. If we served it wrongly it would stop every install updating, and updating is how that mistake would be corrected. It is the flag to set when you are testing a build and do not want it replaced underneath you.
