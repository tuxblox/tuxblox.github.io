# Display and Scaling

Roblox is a Windows program, and the virtual drive it runs in keeps its own idea of how large your screen is. TuxBlox matches that idea to your desktop's, so Studio is not drawn at a quarter size on a high resolution screen.

You should not need anything on this page. It is here for the sessions that do not report their scale, and for knowing what is responsible when something comes out the wrong size.

## Interface scale

Windows measures interface scale in dots per inch, where 96 means unscaled, and a fresh virtual drive starts there. Studio's interface reads that number once as it starts and sizes everything from it, so a drive left at 96 on a 4K desktop draws Studio's panels and text at a quarter of the area your desktop gives everything else.

TuxBlox works your desktop's scale out at startup and writes it into the drive. It asks three places, in order, and the first one that answers wins:

| Where it looks | When that is the answer |
|---|---|
| `Xft.dpi`, from `xrdb -query` | An X11 desktop writes this when you pick a scale |
| GNOME's `text-scaling-factor` | A Wayland session leaves the X resources alone, so GNOME is asked directly |
| `GDK_SCALE` | A session that scales by whole numbers reports it here and nowhere else |

If none of them answer, the drive keeps its own 96 rather than having a guess written into it. A desktop that never said is not the same as a desktop that said it is unscaled.

Two results are deliberately not written:

- **96 or below.** An unscaled desktop needs nothing, and writing it would only leave a value behind to go stale.
- **Above 480.** A desktop can report a scale that nothing would fit on, so the figure is capped there.

Takes effect the next time Roblox starts, because Studio reads the number as it starts.

### If Studio comes out small anyway

Your session is one that does not report its scale anywhere TuxBlox can see. Say it yourself, in [Environment variables](settings/environment.md#environment-variables):

```
GDK_SCALE=2
```

That is the third row of the table above, so TuxBlox reads it as though your desktop had said it. Whole numbers only, and it multiplies the unscaled 96 — `2` means 192 DPI.

## Fonts

TuxBlox matches the drive's interface font to your desktop's as well, by family and point size, for the fonts Windows reports for dialogs, menus and status bars. Studio's dialogs then use the font the rest of your desktop uses rather than the compatibility layer's default.

The title bar font is left alone. The title bar is your desktop's to draw, so its font is your desktop's to choose.

## When it is the window rather than the scale

A window that opens in the wrong place, goes missing, or will not give your mouse back is a window management problem rather than a scaling one. [Virtual Desktop Mode](settings/environment.md#virtual-desktop-mode) is the switch worth trying for those: it gives Roblox a desktop of its own inside a single window, and everything Roblox opens stays inside it.

## Graphics and framerate

Those live elsewhere, because they are not about how large anything is drawn:

| Question | Where it is answered |
|---|---|
| Which card is Roblox rendering on? | [Graphics card](settings/environment.md#graphics-card) |
| Why is performance worse than I expected? | [Performance is worse than I expected](../troubleshooting/common-problems.md#performance-is-worse-than-i-expected) |
| What can I measure or override? | [Graphics variables](../advanced/environment-variables.md#graphics-variables) |
