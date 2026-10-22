# FastFlags

FastFlags are Roblox's own internal settings. Roblox uses them to turn features on and off, run experiments, and tune the engine without shipping a new build. TuxBlox lets you set them yourself.

> [!NOTE]
> Since September 2025, Roblox only applies player flags that are on an **allowlist**. A flag outside it is ignored, and **Roblox takes no action against an account for setting one**. Roblox Studio is not restricted this way. If you do not already know what a flag does, the safest thing is still to leave it alone.

## The allowlist

Roblox published the allowlist, and the announcement explaining it, on the Developer Forum:

**[Allowlist for Local Client Configuration via Fast Flags](https://devforum.roblox.com/t/allowlist-for-local-client-configuration-via-fast-flags/3966569)**

Read it before you set anything. A few things worth knowing, all of them from that post:

- The list in that post is not always current. Roblox updates the allowlist itself more often than it updates the post.
- A flag that is not on the list is simply ignored. Nothing happens, and no action is taken against your account for trying one.
- **Roblox Studio is not covered by the allowlist at all.** Studio flags are not restricted, so the list only matters for the Player side.
- Old guides and flag lists from before September 2025 predate the allowlist entirely. Most of what they recommend is now ignored rather than applied.

So the cost of an off-list player flag is that it does nothing, not that you lose your account. That is worth knowing before you spend an evening on a flag list that cannot work.

TuxBlox does not check your flags against the list. It sets whatever you type, exactly like the Windows client would.

## The three kinds of flag

You can tell what a flag expects from the prefix on its name.

| Prefix | Type | Example value |
|---|---|---|
| `FFlag`, `DFFlag`, `SFFlag` | On or off | `True` or `False` |
| `FInt`, `DFInt`, `SFInt` | A whole number | `120` |
| `FString`, `DFString`, `SFString` | Text | `https://example.com/` |

The extra letters have meanings inside Roblox (`D` for dynamic, `S` for synchronised) but for your purposes they behave the same way.

TuxBlox does not check the type for you. It passes whatever you type straight through, because Roblox accepts a text value for every flag type anyway.

## Using the editor

Open the **FastFlags** tab. It has two lists, **Player** and **Studio**. Each keeps its own separate flags, so a flag you set for Studio does not affect Player. Roblox's allowlist applies to the **Player** list only; anything in the **Studio** list is applied whether it is on the list or not.

To add a flag:

1. Press **Add flag** above the list you want.
2. Type the flag name in the left box, exactly as Roblox spells it. Names are case sensitive.
3. Type the value in the right box.

To remove one, press the **−** button at the end of its row.

Changes are saved as you type. There is no save button.

### Importing many flags at once

If you already have your flags as JSON, press **Import JSON** above the list you want, paste them, and press **Import**:

```json
{"FFlagExample": "true", "DFIntExample": 30}
```

Values can be text, numbers, or `true` and `false`. The **Import** button stays greyed out while the text is not valid JSON, and the window says what is wrong. A flag that is already in the list takes the imported value; new flags are added at the end.

### The Graphics API setting wins

**Graphics API** in [Settings](settings/environment.md#graphics-api) writes the three renderer flags itself, and what it writes replaces any row here that sets the same flag. Set it to **Automatic** if you would rather choose the renderer from this page.

### Duplicates

If two rows set the same flag name, the row marked **duplicate** is telling you the last one wins. Nothing breaks, it is just that only one of them can take effect.

## When flags take effect

The next time you start Roblox. TuxBlox writes your flags into Roblox's own settings folder at every launch, so editing a flag while Roblox is open does nothing until you restart it.

It does not matter how you start it. Opening Roblox from the TuxBlox window, from your applications menu, from a desktop icon or from a link in a web browser all go through the same step.

Clearing every flag removes the file entirely, which puts Roblox back to completely stock behaviour.

## Where they are stored

Your flags live in `~/.tuxblox/settings.json`, under `fast_flags`, split into `player` and `studio` lists:

```json
{
  "fast_flags": {
    "player": [],
    "studio": [
      { "name": "FFlagDebugDisplayFPS", "value": "True" },
      { "name": "DFIntTaskSchedulerTargetFps", "value": "120" }
    ]
  }
}
```

At launch, TuxBlox turns the relevant list into a `ClientAppSettings.json` inside the Roblox version's own folder, which is where Roblox actually reads them from.

It is written at every launch rather than once, because Roblox updates put each build in its own folder and the file has to follow. Every installed version gets the same list, so a flag you delete stops applying everywhere, including in an older build you go back to from the Versions tab.

## Finding flag names

Start with [Roblox's allowlist post](https://devforum.roblox.com/t/allowlist-for-local-client-configuration-via-fast-flags/3966569). That is the only list with any authority behind it.

Community maintained lists exist and vary enormously in quality. TuxBlox does not ship a list and does not recommend any flags.

A few sanity rules:

- A flag that does not exist is ignored, so a typo is harmless but also silent.
- A flag that exists but expects a different type may make Roblox behave unpredictably.
- Flags disappear between Roblox releases. A list from a year ago is mostly fiction, and a player list from before September 2025 is mostly off the allowlist and therefore ignored.
- If a "performance flag" sounds too good to be true, it is.

## Turning everything off again

Remove every row. The next launch deletes the override file and Roblox goes back to its own defaults.

If you have a FastFlag setup you are not sure about and Roblox is misbehaving, clearing the list is the first thing to try, before anything in [Troubleshooting](../troubleshooting/common-problems.md).
