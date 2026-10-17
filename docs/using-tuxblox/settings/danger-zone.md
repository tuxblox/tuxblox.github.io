# Danger zone

Three buttons that do real damage. The bottom two ask you to confirm in a window first, and nothing happens until you do.

## Terminate Roblox

Stops every Roblox process that is currently running. Player, Studio, the crash handler, all of it.

Use this when Roblox has stopped responding and will not close normally, or when the launcher still thinks Roblox is running after it has gone.

Unlike the other two, this is safe. The worst it can do is lose unsaved work in Studio.

## Wipe the virtual drive

Deletes the virtual drive and everything in it.

That includes every installed Roblox version, anything Roblox saved locally, and any Windows settings inside the drive. Your TuxBlox settings and FastFlags are kept, since those live outside the drive.

The next launch rebuilds the drive and reinstalls Roblox from scratch, which takes about as long as your very first launch did.

This is the biggest hammer for "Roblox is behaving strangely and I do not know why". Try it before reinstalling TuxBlox.

> [!CAUTION]
> Anything you put inside the virtual drive by hand goes with it. Copy it out first.

## Uninstall TuxBlox

Removes TuxBlox completely: the virtual drive, the desktop shortcuts, the file associations, and TuxBlox itself.

The equivalent from a terminal is `~/.tuxblox/TuxBloxInstaller --uninstall`.
