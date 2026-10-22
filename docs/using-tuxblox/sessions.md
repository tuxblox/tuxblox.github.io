# Sessions

The Sessions tab shows what is running right now, and what each session is saying.

Every time you open Roblox Player or Roblox Studio, that is a session. Studio lets you have several open at once; the Player runs one at a time. This tab lists them all, and gives you each one's log as it is being written.

It is the first place to look when something goes wrong — a session that will not start, one that closed on its own, or one behaving oddly while it runs.

## The list

Sessions are grouped under two headings.

**Running** is everything open right now. Each row shows the app, how long it has been going, and how much memory it is using:

```
Roblox Studio
18m · PID 24881 · 1.41 GB
```

The number after `PID` is how the rest of your system refers to that session. You rarely need it, but it is what a bug report will ask for.

The sidebar's **Sessions** row carries a count of what is open, so you can see at a glance without coming here.

**Ended this run** is the sessions that finished while the launcher was open, and how each one ended — closed normally, stopped by you, or crashed. A session that crashed is marked in red.

Sessions that ended *before* you opened the launcher are not listed. The launcher only knows about what it watched happen.

A session started by a game link is listed exactly like any other. The launcher does not need to have started it.

### Searching

The box at the top of the list filters it. Type part of an app's name, or a PID, and only the matching sessions stay.

## The log

Selecting a session shows its log on the right, updating as new lines arrive.

A session actually writes **two** logs: one from TuxBlox, covering starting up and the virtual drive, and one from Roblox itself. The tab shows both together. TuxBlox's own lines are tinted green so you can tell which half a problem is in.

If Roblox has not written anything yet, the tab says so rather than showing you an empty box.

The log keeps itself at the newest line, wraps long lines rather than running them off the side, and hides the parts of each line only a machine wants — how long the session had been running, and which thread wrote it. None of that needs turning on.

Scroll up and it stops following, so you can read back without being pulled to the bottom. It says so while it is paused, and offers **Jump to the end** to start following again.

### The buttons above the log

| Button | What it does |
| --- | --- |
| **Errors only** | Shows only warnings and errors. |
| **Copy** | Copies the whole log to the clipboard. |
| **Save** | Writes the log to a file in your home folder, ready to attach to a bug report. |
| **Open folder** | Opens the folder the logs are kept in. |

Beside them is how much the session has written so far.

### Finding something

The box at the bottom searches the log. Every match is highlighted where it sits, and the arrows beside it step between them. The count tells you which match you are on and how many there are.

The search covers the whole session, not just what is on screen.

### Messages that run over several lines

When a script goes wrong, Roblox writes the error and then the trail of where it happened — several lines that are really one message. The tab keeps them together, indented under the first line, and colours all of it as the one warning it is. Searching looks inside all of it.

## Stopping one session

Each running session has a stop button on its row, and the selected session has one above its log.

This closes **only that session**. The others stay open. That is the difference from the Stop button on the Home screen, which closes every session of that app at once.

Stopping is a normal close, not a kill — TuxBlox asks the session to shut down the way closing its window would. Unsaved work in Studio is still unsaved work, so save first.

## Launching takes you here

When you start Roblox from the Home screen, the launcher stays open and brings you to that session's log.

If you would rather it closed, turn on [Minimise to background](settings/launcher.md). With that on, the launcher closes when Roblox starts, as it used to, and there is nothing to bring you to.

If you already had TuxBlox before this changed, your existing setting is kept exactly as it was.

Opening a game from a link or a desktop shortcut never opens the launcher window at all. That session is still listed here next time you open the launcher by hand.

## When the log looks wrong

TuxBlox works out which of Roblox's logs belongs to which session by when each one started. That is almost always right.

With two Studio sessions started within the same second of each other, it can pair them the wrong way round. If a log does not look like the session you picked, hold the pointer over the session's name to see which file it settled on — and if it is the wrong one, the other session's log is the one you want.

## Where the logs live

Logs are kept in the `logs` folder inside your TuxBlox install, and the **Open folder** button takes you straight there.

**Installing a TuxBlox update clears that folder.** Save anything you still need before updating.
