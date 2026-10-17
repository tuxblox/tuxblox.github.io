# Reporting a Security Issue

A security problem is not an ordinary bug, and it does not go in the issue tracker. Describing one in public tells everybody who might use it, before there is anything to update to, so these reports are handled privately.

Anything else — a crash, something broken, something that does not work — is an ordinary bug. [Reporting Bugs](reporting-bugs.md) is the page for those.

## Where to send it

**Email [security@tuxblox.net](mailto:security@tuxblox.net).** This is the route we prefer, and it works wherever you found TuxBlox. The current address is always the one published in [security.txt](https://tuxblox.net/.well-known/security.txt).

If you would rather not use email, GitHub's [private vulnerability reporting](https://github.com/cherrypath0/tuxblox/security/advisories/new) on the repository reaches us the same way, and stays private in the same way.

> [!CAUTION]
> Do not open a public issue, and do not post it in Discord. A public report is a disclosure, whatever it is labelled as.

## What to put in it

As much of this as you have:

- What the problem is, and what someone could do with it
- Steps to reproduce it, or a proof of concept
- Which version you are on, and which part is affected: the launcher, or the compatibility layer
- Your distribution and kernel version, if they are relevant

`~/.tuxblox/TuxBloxLauncher --version` answers the version half of the third point. [Logs and Diagnostics](logs.md) covers gathering the rest — but read it first and take out anything you would not want to send, since a report is only as private as what you put in it.

## What is covered

TuxBlox is two halves with two licences, and both are in scope:

| Part | Where it is |
|---|---|
| The launcher and TuxBlox's own tooling | everything outside `compat/`, GPLv3 |
| The compatibility layer | `compat/`, LGPLv2.1, based on Wine and Proton |

[Repository Structure](../development/repository-structure.md) describes that split in more detail.

A vulnerability in upstream Wine, Proton or DXVK that TuxBlox's own changes did not introduce belongs with that project rather than here. If you cannot tell which side it came from, send it anyway and we will help route it.

Out of scope:

- Anything that needs an already compromised or modified TuxBlox to be installed first
- Forks and modified builds, which belong with whoever maintains them
- Social engineering, phishing, and physical security

## What happens next

Reports are acknowledged, and you are kept in the loop while the problem is understood and fixed. The ask in return is the usual one: give it a reasonable amount of time to be fixed before writing it up publicly.
