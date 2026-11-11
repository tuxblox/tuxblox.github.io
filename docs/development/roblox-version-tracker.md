# Roblox Version Tracker

The Roblox Version Tracker is a small service TuxBlox runs to notice when Roblox
publishes a new Windows client. TuxBlox runs the official Roblox client on Linux, so a
new client build can break it; the tracker exists so that is noticed within minutes
rather than from user reports days later.

This page is written for anyone looking at the traffic and wondering what it is —
including Roblox staff. It explains exactly what the service does and how to confirm a
request claiming to be it really is.

## What it does

Every five minutes it makes a small number of read-only requests:

| Endpoint | Why |
|---|---|
| `clientsettings.roblox.com/v2/client-version/WindowsPlayer/channel/LIVE` | the live Player version |
| `clientsettings.roblox.com/v2/client-version/WindowsStudio64/channel/LIVE` | the live Studio version |
| `setup.rbxcdn.com/DeployHistory.txt` | notices a build that has been deployed but is not live yet |
| `clientsettings.roblox.com/v2/client-version/<binary>/channel/zbeta` | the version number of a deployed build, which `DeployHistory.txt` does not name |
| `HEAD` on `setup.rbxcdn.com/<hash>-rbxPkgManifest.txt` | checks whether a deployment's files are published |

All of these are public, unauthenticated endpoints. The service:

- **reads only, from Roblox.** It never writes to Roblox, never authenticates, and
  never uses an account. It does post its own findings to a TuxBlox server, which is
  described below.
- **downloads no game content.** The manifest check is an HTTP `HEAD`, so no body is
  transferred. It does not fetch client packages.
- **does not touch the Roblox website or API.** No scraping, no logged-in session.
- **runs on a fixed five-minute timer**, not on demand. An ordinary cycle is **three
  small requests**: the live version of each client, and the deployment log. While a
  build is deployed but not yet live it adds one version lookup and one `HEAD`, and
  stops once that build's hash is known.

The last two rows exist because `DeployHistory.txt` lists a build as soon as it is
deployed but prints `version-hidden` in place of the hash. The `zbeta` lookup supplies
the version, and the `HEAD` confirms the files are actually published before anything
is announced, so a build is never named on one source's word alone.

### Where its findings go

When it sees a change it posts a message to a TuxBlox Discord channel naming the
version, the deployment hash where one can be determined, and whether the build is
live or merely deployed.

It also records each version it observes to a TuxBlox server, so TuxBlox keeps a list
of which client versions were released and when. That list is TuxBlox's own, built
only from the public endpoints above, and it exists because the launcher offers to
install a previous version and Roblox no longer publishes a list of them. It holds a
version number, a deployment hash, which client it is for, and a date. It contains no
game content and no information about any person.

> [!NOTE]
> The tracker is **closed source**, so its behaviour cannot be confirmed by reading
> its code. That is why this page describes what it does and gives a way to verify its
> network identity instead.

## Verifying a request really is ours

Every request it makes carries this `User-Agent`:

```
TuxBlox-RobloxVersionTracker/1.0 (+https://tuxblox.net/rvt; contact@tuxblox.net)
```

A `User-Agent` can be set by anyone, so it proves nothing on its own. Confirm it the
way you would any other named crawler, with a **reverse DNS lookup that is then
forward-confirmed**:

**1. Look up the reverse DNS of the source address.**

```
$ dig +short -x 217.182.196.189
srv.tuxblox.net.
```

**2. Confirm that name resolves back to the same address.**

```
$ dig +short srv.tuxblox.net
217.182.196.189
```

If both steps agree, the request came from a machine TuxBlox controls. If either step
fails, it did not, whatever the `User-Agent` says.

> [!IMPORTANT]
> **`217.182.196.189` is the only address the tracker ever runs from.** There is one
> instance and it is not distributed. Traffic from any other address using this
> `User-Agent` is not ours, and we would like to hear about it.

## If you want it to stop or change

Mail **contact@tuxblox.net**. If Roblox would prefer this service did not run, polled
less often, or used a different endpoint, say so and it will be changed or switched
off. There is no need to block it quietly first.

TuxBlox is an independent project. It is not affiliated with, endorsed by, or
associated with Roblox Corporation, and nothing on this page should be read as a claim
that Roblox has approved this service.
