# Feature Switches

Some of what TuxBlox does is switched on and off from our server rather than decided once when the
release was built. A feature that turns out to be faulty can be switched back off the same day, for
everybody, without anyone installing anything — and one that is ready can be switched on the same
way.

## What this means for you

Usually nothing. It does mean two installs on the same release can behave slightly differently, and
that an install which has been offline since the day it was installed uses whatever it was built
with.

TuxBlox asks **once, as it starts**. The question says which release channel you follow and which
kind of processor you have, and nothing about you or your account — the
[Privacy Policy](https://tuxblox.net/privacy) covers what that request contains. If the answer does
not arrive quickly, TuxBlox carries on with what it was built with rather than waiting.

A switch is read once per run, so a feature cannot change position underneath you while TuxBlox is
open. Starting it again is what picks up a change.

## What is switched this way

- Whether the **Roblox Player** button on the Home screen does anything. It is off for everybody
  while [Player support is still being worked on](../getting-started/faq.md#does-roblox-player-work),
  and this is how it becomes live for everybody on the day it is ready.
- Whether the **Christmas theme** is offered, inside its season.
- Whether the **server location notification** runs.
- Whether **crash reports** are sent, including the Report button that offers to send one by hand.
- Whether the **Versions** tab offers to install Roblox's [next version](../using-tuxblox/versions.md),
  the one Roblox has uploaded but not released.
- Whether Roblox's files are stored in [standard Linux folders](files-and-folders.md), which is still
  experimental.
- Whether an install following `canary` or `experimental` takes
  [a build from a more tested channel](../getting-started/releases-and-updates.md) when that build is
  ahead of its own.
- How many downloads run at once while Roblox is being installed, and which version of HTTP TuxBlox
  asks for when it downloads. Both exist so that a server which answers badly can be worked around
  without a release.

Every one of these is a choice between behaviours that were already built into the release you have.
The server picks between paths that exist; it cannot add one.

## Overriding a switch on your own machine

Support may ask you to create a `flags.json`. It goes in your TuxBlox folder — the same one as
`settings.json`, usually `~/.tuxblox` — and it overrides these switches **on your machine only**:

```json
{
    "tbxFlagDisableUpdater": true
}
```

Your file wins over the server, and the server wins over what the release was built with. So a name
you set here is the answer, whatever anybody else says.

TuxBlox never creates or edits this file; if it exists, a person put it there. Delete it to go back
to normal. Only use names support gives you: a name TuxBlox does not know is ignored, and so is a
value of the wrong kind, so a typo quietly does nothing rather than breaking anything.

Two names are worth knowing because they are the ones people ask for:

| Name | What it does |
|---|---|
| `"tbxFlagDisableUpdater": true` | Stops TuxBlox checking for its own updates, which is how you keep a build you are testing from being replaced under you. The server is never allowed to set this one — only you can, on your own machine, because a wrong answer from us would stop every install updating and updating is how that would be corrected. |
| `"tbxFlagDisablePlayerButton": false` | Turns the Roblox Player button on before Player support is finished. It is not expected to work. |
