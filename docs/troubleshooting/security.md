# Reporting a Security Issue

A security problem is not an ordinary bug, and it does not belong in the issue tracker. Writing one up in public tells everybody who might use it, at a point when there is nothing to update to yet. So these reports are handled privately.

Everything else is an ordinary bug: a crash, something broken, something that simply does not work. [Reporting Bugs](reporting-bugs.md) is the page for those.

## Where to send it

**Email [security@tuxblox.net](mailto:security@tuxblox.net).** This is the route we prefer, and it works wherever you got TuxBlox from. If you want to be sure the address is still current, it is the one published in [security.txt](https://tuxblox.net/.well-known/security.txt).

If you would rather not use email, GitHub's [private vulnerability reporting](https://github.com/cherrypath0/tuxblox/security/advisories/new) reaches us the same way, and stays private in the same way.

> [!CAUTION]
> Do not open a public issue, and do not post it in Discord. A public report is a disclosure, whatever it is labelled as.

**You will not get in trouble for telling us.** Reporting a vulnerability the way this page describes is not a breach of the [Terms of Use](https://tuxblox.net/terms), and we will take no action against you for the report. That holds even if it turns out you were wrong about what you found.

## What to put in it

As much of this as you have:

- What the problem is, and what somebody could do with it
- How to reproduce it, or a proof of concept
- Which version you are on, and which part is affected
- Your distribution and kernel version, if they matter here

`~/.tuxblox/TuxBloxLauncher --version` answers the version question. [Logs and Diagnostics](logs.md) covers gathering the rest, but read it before you attach anything and take out whatever you would not want to send us. A report is only as private as what you put in it.

If you cannot work out how bad it is, say so and send it anyway. Working that out is our job rather than yours, and we would far rather read a report that turns out to be nothing than miss one that was not.

## What is covered

The program is two halves with two licences, and both are in scope:

| Part | Where it is |
|---|---|
| The launcher and TuxBlox's own tooling | everything outside `compat/`, GPLv3 |
| The compatibility layer | `compat/`, LGPLv2.1, based on Wine and Proton |

[Repository Structure](../development/repository-structure.md) goes into that split in more detail.

A hole in upstream Wine, Proton or DXVK that our own changes did not introduce belongs with that project rather than with us. If you cannot tell which side it came from, send it over and we will help work out where it goes.

Our servers are in scope too, and [Our servers](#our-servers) covers what those reports need.

Not in scope:

- Anything that needs an already compromised or modified TuxBlox to be installed first
- Forks and modified builds, which belong with whoever maintains them
- Social engineering, phishing, and physical security

## Our servers

TuxBlox talks to three servers of ours, and all three are in scope:

| Server | What it does |
|---|---|
| `setup.tuxblox.net` | Update checks, the file list for each release, and TuxBlox's own downloads |
| `geo.tuxblox.net` | The region of a Roblox server you joined |
| `telemetry.tuxblox.net` | Crash reports |

`deploy.tuxblox.net` is in scope as well, and it is the one we care about most. Nothing in TuxBlox ever talks to it: it is the host we deploy releases through. A way into it, or a way to get a file of your own out through it, would reach everybody who updates. Tell us about that one first.

This website and these documentation pages count too.

Roblox's own files never come from us, and neither does the check for which Roblox version is current. The launcher asks Roblox for both of those, so anything wrong on that side is Roblox's to fix.

A report about a server needs different things from a report about the program:

- The exact URL or endpoint, and the request that did it, with headers if they matter
- What came back, and what you expected instead
- **When it happened, in UTC.** Request logs are kept for 30 days and then deleted, so there is nothing left to check an older report against
- The address you sent it from, if what happens depends on where the request comes from

> [!CAUTION]
> Please do not load test the servers, flood them, or knock them over, and do not go digging through anybody else's data. Finding a hole by sending a request is a report we want. Proving it by taking the service down for everyone else is not.

Not worth reporting on this side:

- Volume. Any small server can be buried under enough traffic, and telling us so is not a finding
- Being rate limited or blocked. That is us doing it deliberately, not a flaw
- A scanner's output with nothing shown to come of it

`geo.tuxblox.net` and `telemetry.tuxblox.net` sit behind Cloudflare, and this website is GitHub Pages behind Cloudflare, so a flaw in their infrastructure rather than in how we use it is theirs to fix. If you cannot tell whose it is, send it to us and we will look.

A server being down, slow, or refusing an ordinary request is not a security issue. That is a normal problem: try [Common Problems](common-problems.md#updating), then [Discord](https://tuxblox.net/discord).

## What happens next

We will tell you we got it, and keep you posted while we work out what is going on and fix it. What we ask in return is the usual thing: give it a reasonable amount of time to be fixed before you write it up publicly.
