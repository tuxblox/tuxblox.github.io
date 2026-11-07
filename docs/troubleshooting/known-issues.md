# Known Issues

Problems we already know about. If you hit one of these, there is no need to report it.

For anything else, try [Common Problems](common-problems.md) first, then [Reporting Bugs](reporting-bugs.md).

---

## Roblox Player does not start

**Status:** being worked on, no date

Roblox's anti-tamper blocks Roblox Player from starting under every Wine based compatibility layer, TuxBlox included. This is not a bug in TuxBlox that a setting or a driver update will fix.

This is the project's largest ongoing piece of work, and it is real progress rather than a placeholder. Player now gets much further into its own startup than it used to. There is still no date, and we would rather say nothing than give one we cannot keep.

**Roblox Studio is not affected** and works normally.

Development updates are posted in [Discord](https://tuxblox.net/discord).

---

## Visual glitches while resizing Studio panels

**Status:** being worked on

Dragging the edge of a panel in Studio can briefly show black or torn areas along the edge you are dragging, for as long as the drag lasts.

This is the redraw not keeping up with the drag, nothing more. It is cosmetic: nothing is lost, everything is drawn correctly the moment you let go, and Studio itself is unaffected.

It is not the same thing as black squares turning up on their own in a session you are not touching. That was a separate problem in the compatibility layer and it has been fixed. If you see black areas while you are **not** dragging a panel edge, that is worth [reporting](reporting-bugs.md).

---

## Reporting something that is not here

If your problem is not on this page and not in [Common Problems](common-problems.md), we want to hear about it. See [Reporting Bugs](reporting-bugs.md) for what to include.
