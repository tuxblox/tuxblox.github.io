# Environment

What TuxBlox hands to Roblox when it starts: which renderer and graphics card, what the web panels do, what gets shared, and your own variables.

## Graphics API

**Default: Automatic**

Which renderer Roblox draws with.

| Option | What you get |
|---|---|
| Automatic | TuxBlox asks for nothing and Roblox chooses for itself. |
| DirectX 11 | Roblox draws through DirectX 11, which the compatibility layer translates to Vulkan for your driver. |
| Vulkan | Roblox draws through Vulkan directly. |
| OpenGL | Roblox draws through OpenGL. |

TuxBlox applies this by writing FastFlags, the same hidden Roblox settings the [FastFlags](../fastflags.md) page edits. It writes the flag for the renderer you chose set to True and the other two set to False, so Roblox is asked for one rather than only steered away from the others. The three flags are `FFlagDebugGraphicsPreferD3D11`, `FFlagDebugGraphicsPreferVulkan` and `FFlagDebugGraphicsPreferOpenGL`.

**This setting wins over the FastFlags page.** If a row there sets one of those three flags, the value chosen here replaces it. A renderer picked in Settings is meant to be the one that applies, without you having to go and find the row that disagrees with it.

On **Automatic** nothing is written at all, so the FastFlags page is left to decide, and so is Roblox where the page says nothing either.

Takes effect the next time Roblox starts.

## Preferred graphics card

**Default: Automatic**

Which graphics card Roblox renders on. This only matters on a machine with more than one, which usually means a laptop with both integrated and discrete graphics.

The dropdown lists every card TuxBlox can see, numbered, so two cards of the same model are still distinguishable. **Automatic** names whichever one your system would pick on its own.

Picking a card sets the standard Linux graphics offload variables for you, so you do not have to know which ones your driver wants. On NVIDIA that is the PRIME render offload set, and on AMD and Intel it is the Mesa device selection variables.

> [!TIP]
> If your laptop runs Studio on the wrong card and the picker does not fix it, you can override it by hand in **Environment variables** below. Anything you type there wins over the picker.

## GPU acceleration for web pages

**Default: on**

Speeds up the login screen, the Toolbox, and every other panel inside Roblox that is really a web page.

This has nothing to do with game or Studio viewport graphics. Turning it off will not affect your framerate.

On some machines those panels are drawn on the processor even with this on. That is not a fault: TuxBlox uses your own graphics driver where it can reach it, and falls back rather than risk a blank panel. Your session log says which was used.

Turn it off if those panels are blank, flickering, drawing garbage, or crashing. That is the most common fix for it, especially on older drivers and on llvmpipe software rendering.

Takes effect the next time Roblox starts.

## Enable Discord Rich Presence

**Default: off**

Puts Roblox on your Discord profile while it is open, so people can see what you are building or playing.

In Studio it shows the place you have open, whether you are editing or play testing, who made it, and how long the session has been going, with a button to open its page. When the place has an icon, that icon is shown too, with a small Studio badge on it. A Studio plugin can set its own status text the same way a game can.

In the Roblox app it shows the experience's name, who made it, how long you have been playing and its icon, with two buttons: one to open its page, and one to join the server you are in. Many games also set their own status text, such as which floor or room you are on, and that text is shown when they do, unless you turn that off below — TuxBlox reads it the same way games already expect, so it looks the same here as it does on Windows. A game can only name a picture that is already on Roblox, never a web address of its own, and TuxBlox looks the picture up itself rather than following anything the game hands it.

A place that is only a file on your machine is never named: it reads "Editing a local place", with no author, no picture and no link, so a project you have not released is not announced by its filename.

**Anyone who can see your Discord profile can read the name of a published place** and any text a game sets for itself. Opening this setting reveals two more switches, and that is the whole of what it does, so leave it off if you would rather not share any of it.

**Let people join your server** adds a button to your activity that takes somebody into the same server you are in. That is useful for a friend and worth knowing about for anyone else, so turn it off if you would rather show what you are playing without being followed there.

**Let games use the Rich Presence API** decides whether the text and picture a game sets for itself are shown at all. It only works on games that use the Bloxstrap API. With it off, nothing a game sends is read, and your profile shows only what TuxBlox works out on its own: the experience, who made it, its icon and how long you have been playing.

Nothing is shown when Discord is not running, and nothing is sent anywhere else. The presence disappears when Roblox closes.

Takes effect the next time Roblox starts.

## Notify server location

**Default: off**

Shows a notification naming the region of each Roblox server you join, for example "Connected to a server in Frankfurt am Main, Hesse, Germany".

To work out the region, TuxBlox sends the server's address to `geo.tuxblox.net` and asks where it is. **That is the one thing this setting sends anywhere**, it is only ever the address of a server Roblox itself put you on, and nothing about you or your account goes with it. Each address is asked about once per session, so rejoining the same server asks nothing further.

It covers both the Roblox app and a Studio session connected to Team Create. A place you are testing on your own machine runs on your own machine rather than on a server, so nothing is sent and no notification appears for one.

If the lookup fails, or you are offline, nothing is shown and nothing is retried.

Takes effect the next time Roblox starts.

## Virtual Desktop Mode

**Default: off**

Runs Roblox inside a single window of its own, instead of letting it place windows on your desktop. This is experimental.

Normally every Roblox window is a window on your desktop, moved and resized by your desktop like any other. With this on, Roblox gets a desktop of its own inside one window, and everything it opens stays inside that window. It is sized to your screen.

This is worth trying when windows open in the wrong place, go missing, or will not give your mouse back. It is not better than the normal mode otherwise, and your desktop can no longer arrange Roblox's windows for you.

Takes effect the next time Roblox starts.

## Environment variables

**Default: empty**

A space separated list of `VARIABLE=value` pairs passed to Roblox and to the compatibility layer.

```
DXVK_HUD=fps MANGOHUD=1
```

This is the escape hatch. Anything you put here is applied last, so it overrides variables TuxBlox sets for you, including the graphics card picker.

See [Environment Variables](../../advanced/environment-variables.md) for what is worth setting.
